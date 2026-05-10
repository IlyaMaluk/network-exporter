package ports

import "network-exporter/internal/domain/models"

type ICMPReader interface {
	ReadICMPStats() (models.ICMPStats, error)
}
