package ports

import "network-exporter/internal/domain/models"

type NetDevReader interface {
	ReadNetDev() ([]models.NetDevStats, error)
}
