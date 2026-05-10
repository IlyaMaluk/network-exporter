package procfs

import (
	"network-exporter/internal/domain/models"
	"os"
	"strconv"
	"strings"
)

func (p *ProcFS) ReadConntrackStats() (models.ConntrackStats, error) {
	countStr, err := os.ReadFile("/proc/sys/net/netfilter/nf_conntrack_count")
	if err != nil {
		return models.ConntrackStats{}, err
	}

	maxStr, err := os.ReadFile("/proc/sys/net/netfilter/nf_conntrack_max")
	if err != nil {
		return models.ConntrackStats{}, err
	}

	count, _ := strconv.ParseUint(strings.TrimSpace(string(countStr)), 10, 64)
	max, _ := strconv.ParseUint(strings.TrimSpace(string(maxStr)), 10, 64)

	return models.ConntrackStats{
		Count: count,
		Max:   max,
	}, nil
}
