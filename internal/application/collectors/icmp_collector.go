package collectors

import (
	"github.com/prometheus/client_golang/prometheus"
	"network-exporter/internal/ports"
)

type ICMPCollector struct {
	reader ports.ICMPReader

	inMsgs    *prometheus.Desc
	inErrors  *prometheus.Desc
	outMsgs   *prometheus.Desc
	outErrors *prometheus.Desc
}

func NewICMPCollector(r ports.ICMPReader) *ICMPCollector {
	return &ICMPCollector{
		reader: r,

		inMsgs: prometheus.NewDesc(
			"node_icmp_inmsgs_total",
			"ICMP input messages",
			nil, nil,
		),
		inErrors: prometheus.NewDesc(
			"node_icmp_inerrors_total",
			"ICMP input errors",
			nil, nil,
		),
		outMsgs: prometheus.NewDesc(
			"node_icmp_outmsgs_total",
			"ICMP output messages",
			nil, nil,
		),
		outErrors: prometheus.NewDesc(
			"node_icmp_outerrors_total",
			"ICMP output errors",
			nil, nil,
		),
	}
}

func (c *ICMPCollector) Describe(ch chan<- *prometheus.Desc) {
	ch <- c.inMsgs
	ch <- c.inErrors
	ch <- c.outMsgs
	ch <- c.outErrors
}

func (c *ICMPCollector) Collect(ch chan<- prometheus.Metric) {
	stats, err := c.reader.ReadICMPStats()
	if err != nil {
		return
	}

	ch <- prometheus.MustNewConstMetric(c.inMsgs, prometheus.CounterValue, float64(stats.InMsgs))
	ch <- prometheus.MustNewConstMetric(c.inErrors, prometheus.CounterValue, float64(stats.InErrors))
	ch <- prometheus.MustNewConstMetric(c.outMsgs, prometheus.CounterValue, float64(stats.OutMsgs))
	ch <- prometheus.MustNewConstMetric(c.outErrors, prometheus.CounterValue, float64(stats.OutErrors))
}
