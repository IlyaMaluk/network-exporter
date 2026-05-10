package collectors

import (
	"github.com/prometheus/client_golang/prometheus"
	"network-exporter/internal/ports"
)

type UDPCollector struct {
	reader ports.UDPReader

	inDatagrams  *prometheus.Desc
	noPorts      *prometheus.Desc
	inErrors     *prometheus.Desc
	outDatagrams *prometheus.Desc
}

func NewUDPCollector(r ports.UDPReader) *UDPCollector {
	return &UDPCollector{
		reader: r,

		inDatagrams: prometheus.NewDesc(
			"node_udp_indatagrams_total",
			"UDP received datagrams",
			nil, nil,
		),
		noPorts: prometheus.NewDesc(
			"node_udp_noports_total",
			"UDP datagrams received on ports with no listener",
			nil, nil,
		),
		inErrors: prometheus.NewDesc(
			"node_udp_inerrors_total",
			"UDP receive errors",
			nil, nil,
		),
		outDatagrams: prometheus.NewDesc(
			"node_udp_outdatagrams_total",
			"UDP transmitted datagrams",
			nil, nil,
		),
	}
}

func (c *UDPCollector) Describe(ch chan<- *prometheus.Desc) {
	ch <- c.inDatagrams
	ch <- c.noPorts
	ch <- c.inErrors
	ch <- c.outDatagrams
}

func (c *UDPCollector) Collect(ch chan<- prometheus.Metric) {
	stats, err := c.reader.ReadUDPStats()
	if err != nil {
		return
	}

	ch <- prometheus.MustNewConstMetric(c.inDatagrams, prometheus.CounterValue, float64(stats.InDatagrams))
	ch <- prometheus.MustNewConstMetric(c.noPorts, prometheus.CounterValue, float64(stats.NoPorts))
	ch <- prometheus.MustNewConstMetric(c.inErrors, prometheus.CounterValue, float64(stats.InErrors))
	ch <- prometheus.MustNewConstMetric(c.outDatagrams, prometheus.CounterValue, float64(stats.OutDatagrams))
}
