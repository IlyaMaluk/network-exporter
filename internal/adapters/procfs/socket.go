package procfs

import (
	"bufio"
	"network-exporter/internal/domain/models"
	"os"
	"strconv"
	"strings"
)

func (p *ProcFS) ReadSockStat() (models.SockStat, error) {
	f, err := os.Open("/proc/net/sockstat")
	if err != nil {
		return models.SockStat{}, err
	}
	defer f.Close() //nolint:errcheck

	scanner := bufio.NewScanner(f)

	var stat models.SockStat

	for scanner.Scan() {
		line := scanner.Text()

		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}

		switch fields[0] {

		case "sockets:":
			for i := 0; i < len(fields)-1; i++ {
				if fields[i] == "used" {
					v, _ := strconv.ParseUint(fields[i+1], 10, 64)
					stat.SocketsUsed = v
				}
			}

		case "TCP:":
			for i := 0; i < len(fields)-1; i++ {
				switch fields[i] {
				case "inuse":
					stat.TCPInUse, _ = strconv.ParseUint(fields[i+1], 10, 64)
				case "orphan":
					stat.TCPOrphan, _ = strconv.ParseUint(fields[i+1], 10, 64)
				case "tw":
					stat.TCPTW, _ = strconv.ParseUint(fields[i+1], 10, 64)
				case "mem":
					stat.TCPMem, _ = strconv.ParseUint(fields[i+1], 10, 64)
				}
			}

		case "UDP:":
			for i := 0; i < len(fields)-1; i++ {
				switch fields[i] {
				case "inuse":
					stat.UDPInUse, _ = strconv.ParseUint(fields[i+1], 10, 64)
				case "mem":
					stat.UDPMem, _ = strconv.ParseUint(fields[i+1], 10, 64)
				}
			}
		}
	}

	return stat, nil
}
