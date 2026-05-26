package procfs

import (
	"bufio"
	"network-exporter/internal/domain/models"
	"os"
	"strconv"
	"strings"
)

func (p *ProcFS) ReadTCPStats() (models.TCPStats, error) {
	f, err := os.Open("/proc/net/snmp")
	if err != nil {
		return models.TCPStats{}, err
	}
	defer f.Close() //nolint:errcheck

	scanner := bufio.NewScanner(f)

	var keys []string
	var values []string

	for scanner.Scan() {
		line := scanner.Text()

		if strings.HasPrefix(line, "Tcp:") {
			parts := strings.Fields(line)

			if keys == nil {
				keys = parts[1:]
			} else {
				values = parts[1:]
			}
		}
	}

	var parse = func(name string) uint64 {
		for i, k := range keys {
			if k == name && i < len(values) {
				v, _ := strconv.ParseUint(values[i], 10, 64)
				return v
			}
		}
		return 0
	}

	return models.TCPStats{
		ActiveOpens:  parse("ActiveOpens"),
		PassiveOpens: parse("PassiveOpens"),
		AttemptFails: parse("AttemptFails"),
		EstabResets:  parse("EstabResets"),
		InSegs:       parse("InSegs"),
		OutSegs:      parse("OutSegs"),
		RetransSegs:  parse("RetransSegs"),
	}, nil
}
