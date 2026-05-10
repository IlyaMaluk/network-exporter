package ports

import "network-exporter/internal/domain/models"

type ConntrackReader interface {
	ReadConntrackStats() (models.ConntrackStats, error)
}
