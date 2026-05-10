package main

import (
	"context"
	"errors"
	"log"
	"log/slog"
	"net/http"
	"network-exporter/internal/adapters/ebpf"
	"os"
	"os/signal"
	"syscall"
	"time"

	"network-exporter/internal/adapters/procfs"
	"network-exporter/internal/application/collectors"
	"network-exporter/internal/ebpf/gen"

	"github.com/cilium/ebpf/link"
	"github.com/cilium/ebpf/ringbuf"
	"github.com/cilium/ebpf/rlimit"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)
	slog.Info("Application started")

	if err := rlimit.RemoveMemlock(); err != nil {
		log.Fatalf("failed to remove memlock: %v", err)
	}

	objs := gen.TcpRetransmitObjects{}
	if err := gen.LoadTcpRetransmitObjects(&objs, nil); err != nil {
		log.Fatalf("loading objects: %v", err)
	}
	defer objs.Close()

	kp, err := link.Kprobe("tcp_retransmit_skb", objs.TcpRetransmitPrograms.HandleRetransmit, nil)
	if err != nil {
		log.Fatalf("failed to attach kprobe: %v", err)
	}
	defer kp.Close()

	tp, err := link.Tracepoint("skb", "kfree_skb", objs.TcpRetransmitPrograms.HandleDrop, nil)
	if err != nil {
		log.Fatalf("failed to attach tracepoint: %v", err)
	}
	defer tp.Close()

	rd, err := ringbuf.NewReader(objs.TcpRetransmitMaps.Events)
	if err != nil {
		log.Fatalf("opening ringbuf reader: %v", err)
	}
	defer rd.Close()

	fs := procfs.New()
	networkCollector := collectors.NewNetworkCollector(fs)
	tcpCollector := collectors.NewTCPCollector(fs)
	socketCollector := collectors.NewSocketCollector(fs)
	retransmitColl := collectors.NewRetransmitCollector()
	conntrackCollector := collectors.NewConntrackCollector(fs)
	udpCollector := collectors.NewUDPCollector(fs)
	icmpCollector := collectors.NewICMPCollector(fs)

	ebpfExporter := ebpf.NewRetransmitExporter(retransmitColl, 4, 2048)
	ebpfExporter.Start(ctx)
	reg := prometheus.NewRegistry()
	reg.MustRegister(
		networkCollector,
		tcpCollector,
		socketCollector,
		retransmitColl,
		conntrackCollector,
		udpCollector,
		icmpCollector,
	)

	go func() {
		slog.Info("eBPF Producer started")
		for {
			record, err := rd.Read()
			if err != nil {
				if errors.Is(err, ringbuf.ErrClosed) {
					return
				}
				continue
			}
			ebpfExporter.Publish(record.RawSample)
		}
	}()

	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.HandlerFor(reg, promhttp.HandlerOpts{}))

	server := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	go func() {
		slog.Info("Server starting on port 8080")
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	<-ctx.Done()
	slog.Info("shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	server.Shutdown(shutdownCtx)

	slog.Info("server shutdown successfully")
}
