package collectors

import (
	"network-exporter/internal/ports"

	"github.com/prometheus/client_golang/prometheus"
)

type NetworkCollector struct {
	reader   ports.NetDevReader
	rxBytes  *prometheus.Desc
	txBytes  *prometheus.Desc
	rxErrors *prometheus.Desc
	txErrors *prometheus.Desc
}

func NewNetworkCollector(reader ports.NetDevReader) *NetworkCollector {
	return &NetworkCollector{
		reader: reader,

		rxBytes: prometheus.NewDesc(
			"node_network_receive_bytes_total",
			"Received bytes",
			[]string{"interface"},
			nil,
		),

		txBytes: prometheus.NewDesc(
			"node_network_transmit_bytes_total",
			"Transmitted bytes",
			[]string{"interface"},
			nil,
		),

		rxErrors: prometheus.NewDesc(
			"node_network_receive_errors_total",
			"Receive errors",
			[]string{"interface"},
			nil,
		),

		txErrors: prometheus.NewDesc(
			"node_network_transmit_errors_total",
			"Transmit errors",
			[]string{"interface"},
			nil,
		),
	}
}

func (c *NetworkCollector) Describe(ch chan<- *prometheus.Desc) {
	ch <- c.rxBytes
	ch <- c.txBytes
	ch <- c.rxErrors
	ch <- c.txErrors
}

func (c *NetworkCollector) Collect(ch chan<- prometheus.Metric) {
	stats, err := c.reader.ReadNetDev()
	if err != nil {
		return
	}

	for _, s := range stats {
		ch <- prometheus.MustNewConstMetric(
			c.rxBytes,
			prometheus.CounterValue,
			float64(s.RxBytes),
			s.Interface,
		)

		ch <- prometheus.MustNewConstMetric(
			c.txBytes,
			prometheus.CounterValue,
			float64(s.TxBytes),
			s.Interface,
		)

		ch <- prometheus.MustNewConstMetric(
			c.rxErrors,
			prometheus.CounterValue,
			float64(s.RxErrs),
			s.Interface,
		)

		ch <- prometheus.MustNewConstMetric(
			c.txErrors,
			prometheus.CounterValue,
			float64(s.TxErrs),
			s.Interface,
		)
	}
}
