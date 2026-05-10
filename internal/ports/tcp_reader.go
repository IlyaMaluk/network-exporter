package ports

import "network-exporter/internal/domain/models"

type TCPReader interface {
	ReadTCPStats() (models.TCPStats, error)
}
