package models

type SockStat struct {
	TCPInUse  uint64
	TCPTW     uint64
	TCPOrphan uint64
	TCPMem    uint64

	UDPInUse uint64
	UDPMem   uint64

	SocketsUsed uint64
}
