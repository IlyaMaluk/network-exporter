package ports

import "network-exporter/internal/domain/models"

type SockStatReader interface {
	ReadSockStat() (models.SockStat, error)
}
