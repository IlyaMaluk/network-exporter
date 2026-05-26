package procfs

import (
	"bufio"
	"network-exporter/internal/domain/models"
	"os"
	"strconv"
	"strings"
)

func (p *ProcFS) ReadNetDev() ([]models.NetDevStats, error) {
	f, err := os.Open("/proc/net/dev")
	if err != nil {
		return nil, err
	}
	defer f.Close() //nolint:errcheck

	var result []models.NetDevStats
	scanner := bufio.NewScanner(f)

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		if !strings.Contains(line, ":") {
			continue
		}

		parts := strings.Split(line, ":")
		iface := strings.TrimSpace(parts[0])
		fields := strings.Fields(strings.TrimSpace(parts[1]))

		rxBytes, _ := strconv.ParseUint(fields[0], 10, 64)
		rxPackets, _ := strconv.ParseUint(fields[1], 10, 64)
		rxErrs, _ := strconv.ParseUint(fields[2], 10, 64)
		rxDrop, _ := strconv.ParseUint(fields[3], 10, 64)

		txBytes, _ := strconv.ParseUint(fields[8], 10, 64)
		txPackets, _ := strconv.ParseUint(fields[9], 10, 64)
		txErrs, _ := strconv.ParseUint(fields[10], 10, 64)
		txDrop, _ := strconv.ParseUint(fields[11], 10, 64)

		result = append(result, models.NetDevStats{
			Interface: iface,
			RxBytes:   rxBytes,
			RxPackets: rxPackets,
			RxErrs:    rxErrs,
			RxDrop:    rxDrop,
			TxBytes:   txBytes,
			TxPackets: txPackets,
			TxErrs:    txErrs,
			TxDrop:    txDrop,
		})
	}

	return result, scanner.Err()
}
