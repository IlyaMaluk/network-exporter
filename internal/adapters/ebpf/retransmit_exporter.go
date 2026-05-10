package ebpf

import (
	"bytes"
	"context"
	"encoding/binary"
	"log/slog"
	"net"
	"network-exporter/internal/application/collectors"
	"sync"
)

type RetransmitEvent struct {
	Saddr [4]byte
	Daddr [4]byte
	Dport uint16
	Type  uint16 // 1 = Retransmit, 2 = Drop
	_     [4]byte
	Ts    uint64
}

type Exporter struct {
	collector  *collectors.RetransmitCollector
	workers    int
	bufferSize int
	eventChan  chan []byte
	wg         sync.WaitGroup
}

func NewRetransmitExporter(c *collectors.RetransmitCollector, workers, buffer int) *Exporter {
	return &Exporter{
		collector:  c,
		workers:    workers,
		bufferSize: buffer,
		eventChan:  make(chan []byte, buffer),
	}
}

func (e *Exporter) Start(ctx context.Context) {
	slog.Info("Starting eBPF worker pool", "workers", e.workers, "buffer", e.bufferSize)
	for i := 0; i < e.workers; i++ {
		e.wg.Add(1)
		go e.worker(ctx)
	}
}

func (e *Exporter) worker(ctx context.Context) {
	defer e.wg.Done()
	for {
		select {
		case <-ctx.Done():
			return
		case raw, ok := <-e.eventChan:
			if !ok {
				return
			}
			e.processEvent(raw)
		}
	}
}

func (e *Exporter) processEvent(raw []byte) {
	slog.Info("Processing event", "raw", string(raw))
	var event RetransmitEvent
	if err := binary.Read(bytes.NewBuffer(raw), binary.LittleEndian, &event); err != nil {
		slog.Error("Failed to parse event", "error", err)
		return
	}

	srcIP := net.IP(event.Saddr[:]).String()
	dstIP := net.IP(event.Daddr[:]).String()
	dport := binary.BigEndian.Uint16(binary.LittleEndian.AppendUint16(nil, event.Dport))

	e.collector.Observe(srcIP, dstIP, dport, event.Type)
}

func (e *Exporter) Publish(raw []byte) {
	select {
	case e.eventChan <- raw:
	default:
		slog.Debug("Event dropped due to backpressure")
	}
}

func (e *Exporter) Wait() {
	close(e.eventChan)
	e.wg.Wait()
}
