package models

type TCPStats struct {
	ActiveOpens  uint64
	PassiveOpens uint64
	AttemptFails uint64
	EstabResets  uint64
	InSegs       uint64
	OutSegs      uint64
	RetransSegs  uint64
}
