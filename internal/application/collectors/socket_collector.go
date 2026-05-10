package collectors

import (
	"network-exporter/internal/ports"

	"github.com/prometheus/client_golang/prometheus"
)

type SocketCollector struct {
	reader ports.SockStatReader

	socketsUsed *prometheus.Desc

	tcpInUse  *prometheus.Desc
	tcpTW     *prometheus.Desc
	tcpOrphan *prometheus.Desc
	tcpMem    *prometheus.Desc

	udpInUse *prometheus.Desc
	udpMem   *prometheus.Desc
}

func NewSocketCollector(r ports.SockStatReader) *SocketCollector {
	return &SocketCollector{
		reader: r,

		socketsUsed: prometheus.NewDesc(
			"node_sockets_used",
			"Total sockets used",
			nil, nil,
		),

		tcpInUse: prometheus.NewDesc(
			"node_tcp_sockets_inuse",
			"TCP sockets in use",
			nil, nil,
		),

		tcpTW: prometheus.NewDesc(
			"node_tcp_sockets_tw",
			"TCP time-wait sockets",
			nil, nil,
		),

		tcpOrphan: prometheus.NewDesc(
			"node_tcp_sockets_orphan",
			"TCP orphan sockets",
			nil, nil,
		),

		tcpMem: prometheus.NewDesc(
			"node_tcp_memory_bytes",
			"TCP memory usage",
			nil, nil,
		),

		udpInUse: prometheus.NewDesc(
			"node_udp_sockets_inuse",
			"UDP sockets in use",
			nil, nil,
		),

		udpMem: prometheus.NewDesc(
			"node_udp_memory_bytes",
			"UDP memory usage",
			nil, nil,
		),
	}
}

func (c *SocketCollector) Describe(ch chan<- *prometheus.Desc) {
	ch <- c.socketsUsed

	ch <- c.tcpInUse
	ch <- c.tcpTW
	ch <- c.tcpOrphan
	ch <- c.tcpMem

	ch <- c.udpInUse
	ch <- c.udpMem
}

func (c *SocketCollector) Collect(ch chan<- prometheus.Metric) {
	stats, err := c.reader.ReadSockStat()
	if err != nil {
		return
	}

	ch <- prometheus.MustNewConstMetric(
		c.socketsUsed,
		prometheus.GaugeValue,
		float64(stats.SocketsUsed),
	)

	ch <- prometheus.MustNewConstMetric(
		c.tcpInUse,
		prometheus.GaugeValue,
		float64(stats.TCPInUse),
	)

	ch <- prometheus.MustNewConstMetric(
		c.tcpTW,
		prometheus.GaugeValue,
		float64(stats.TCPTW),
	)

	ch <- prometheus.MustNewConstMetric(
		c.tcpOrphan,
		prometheus.GaugeValue,
		float64(stats.TCPOrphan),
	)

	ch <- prometheus.MustNewConstMetric(
		c.tcpMem,
		prometheus.GaugeValue,
		float64(stats.TCPMem),
	)

	ch <- prometheus.MustNewConstMetric(
		c.udpInUse,
		prometheus.GaugeValue,
		float64(stats.UDPInUse),
	)

	ch <- prometheus.MustNewConstMetric(
		c.udpMem,
		prometheus.GaugeValue,
		float64(stats.UDPMem),
	)
}
