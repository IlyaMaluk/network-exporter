package procfs

import (
	"bufio"
	"network-exporter/internal/domain/models"
	"os"
	"strconv"
	"strings"
)

func (p *ProcFS) ReadUDPStats() (models.UDPStats, error) {
	f, err := os.Open("/proc/net/snmp")
	if err != nil {
		return models.UDPStats{}, err
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	var keys []string
	var values []string

	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "Udp:") {
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

	return models.UDPStats{
		InDatagrams:  parse("InDatagrams"),
		NoPorts:      parse("NoPorts"),
		InErrors:     parse("InErrors"),
		OutDatagrams: parse("OutDatagrams"),
	}, nil
}
