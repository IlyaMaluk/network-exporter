package models

type NetDevStats struct {
	Interface string
	RxBytes   uint64
	RxPackets uint64
	RxErrs    uint64
	RxDrop    uint64
	TxBytes   uint64
	TxPackets uint64
	TxErrs    uint64
	TxDrop    uint64
}
