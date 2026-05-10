package collectors

import (
	"network-exporter/internal/ports"

	"github.com/prometheus/client_golang/prometheus"
)

type TCPCollector struct {
	reader ports.TCPReader

	activeOpens  *prometheus.Desc
	passiveOpens *prometheus.Desc
	retransSegs  *prometheus.Desc
}

func NewTCPCollector(r ports.TCPReader) *TCPCollector {
	return &TCPCollector{
		reader: r,

		activeOpens: prometheus.NewDesc(
			"node_tcp_active_opens_total",
			"TCP active opens",
			nil, nil,
		),

		passiveOpens: prometheus.NewDesc(
			"node_tcp_passive_opens_total",
			"TCP passive opens",
			nil, nil,
		),

		retransSegs: prometheus.NewDesc(
			"node_tcp_retrans_segments_total",
			"TCP retransmitted segments",
			nil, nil,
		),
	}
}

func (c *TCPCollector) Describe(ch chan<- *prometheus.Desc) {
	ch <- c.activeOpens
	ch <- c.passiveOpens
	ch <- c.retransSegs
}

func (c *TCPCollector) Collect(ch chan<- prometheus.Metric) {
	stats, err := c.reader.ReadTCPStats()
	if err != nil {
		return
	}

	ch <- prometheus.MustNewConstMetric(
		c.activeOpens,
		prometheus.CounterValue,
		float64(stats.ActiveOpens),
	)

	ch <- prometheus.MustNewConstMetric(
		c.passiveOpens,
		prometheus.CounterValue,
		float64(stats.PassiveOpens),
	)

	ch <- prometheus.MustNewConstMetric(
		c.retransSegs,
		prometheus.CounterValue,
		float64(stats.RetransSegs),
	)
}
