//go:build ignore

package main

//go:generate bpf2go -target amd64 TcpRetransmit ./bpf/tcp_retransmit.bpf.c

func main() {}
