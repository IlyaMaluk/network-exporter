package collectors

import (
	"github.com/prometheus/client_golang/prometheus"
	"network-exporter/internal/ports"
)

type ConntrackCollector struct {
	reader ports.ConntrackReader

	count *prometheus.Desc
	max   *prometheus.Desc
}

func NewConntrackCollector(r ports.ConntrackReader) *ConntrackCollector {
	return &ConntrackCollector{
		reader: r,

		count: prometheus.NewDesc(
			"node_network_conntrack_count",
			"Number of allocated connection tracking entries",
			nil, nil,
		),
		max: prometheus.NewDesc(
			"node_network_conntrack_max",
			"Maximum number of connection tracking entries",
			nil, nil,
		),
	}
}

func (c *ConntrackCollector) Describe(ch chan<- *prometheus.Desc) {
	ch <- c.count
	ch <- c.max
}

func (c *ConntrackCollector) Collect(ch chan<- prometheus.Metric) {
	stats, err := c.reader.ReadConntrackStats()
	if err != nil {
		return
	}

	ch <- prometheus.MustNewConstMetric(c.count, prometheus.GaugeValue, float64(stats.Count))
	ch <- prometheus.MustNewConstMetric(c.max, prometheus.GaugeValue, float64(stats.Max))
}
