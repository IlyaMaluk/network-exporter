package collectors

import (
	"strconv"

	"github.com/prometheus/client_golang/prometheus"
)

type RetransmitCollector struct {
	retransmits *prometheus.CounterVec
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
	}
}

func (c *RetransmitCollector) Describe(ch chan<- *prometheus.Desc) {
	c.retransmits.Describe(ch)
}

func (c *RetransmitCollector) Collect(ch chan<- prometheus.Metric) {
	c.retransmits.Collect(ch)
}

func (c *RetransmitCollector) Observe(src, dst string, dport uint16) {
	c.retransmits.WithLabelValues(src, dst, strconv.Itoa(int(dport))).Inc()
}
