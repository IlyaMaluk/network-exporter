package gen

//go:generate go run github.com/cilium/ebpf/cmd/bpf2go -target amd64 TcpRetransmit ../../../bpf/tcp_retransmit.bpf.c
