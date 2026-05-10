package ports

import "network-exporter/internal/domain/models"

type UDPReader interface {
	ReadUDPStats() (models.UDPStats, error)
}
