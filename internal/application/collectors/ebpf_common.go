package collectors

import (
	"strconv"

	"github.com/prometheus/client_golang/prometheus"
)

type RetransmitCollector struct {
	retransmits *prometheus.CounterVec
	drops       *prometheus.CounterVec // НОВА МЕТРИКА
}

func NewRetransmitCollector() *RetransmitCollector {
	return &RetransmitCollector{
		retransmits: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "node_tcp_retransmit_total",
				Help: "Total number of TCP retransmits detected via eBPF",
			},
			[]string{"src_ip", "dst_ip", "dport"},
		),
		drops: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "node_tcp_drops_total",
				Help: "Total number of TCP drops detected via eBPF",
			},
			[]string{"src_ip", "dst_ip", "dport"},
		),
	}
}

func (c *RetransmitCollector) Describe(ch chan<- *prometheus.Desc) {
	c.retransmits.Describe(ch)
	c.drops.Describe(ch)
}

func (c *RetransmitCollector) Collect(ch chan<- prometheus.Metric) {
	c.retransmits.Collect(ch)
	c.drops.Collect(ch)
}

func (c *RetransmitCollector) Observe(src, dst string, dport uint16, eventType uint16) {
	portStr := strconv.Itoa(int(dport))

	if eventType == 1 {
		c.retransmits.WithLabelValues(src, dst, portStr).Inc()
	} else if eventType == 2 {
		c.drops.WithLabelValues(src, dst, portStr).Inc()
	}
}
