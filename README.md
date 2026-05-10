# Network Exporter with eBPF and React Dashboard

An advanced network metrics exporter combining Go, eBPF capabilities, Prometheus data aggregation, and a modern React-based frontend dashboard. Developed to support anomaly detection capabilities.

## Architecture Overview

- **eBPF (Extended Berkeley Packet Filter)**: Safely inspects native TCP/IP stack operations directly in the kernel space to gather granular data (e.g., active opens, socket states, TCP retransmits) with low overhead.
- **Go Exporter**: Userspace application parsing eBPF maps and exposing them via HTTP along with standard procfs network metrics.
- **Prometheus**: Time-series database scraping and retaining the exported metrics.
- **React Frontend**: A Vite-based dynamic dashboard querying Prometheus (`/api/v1/query_range`) and using `recharts` for rich visualizations.

## Prerequisites

- **Go** (1.20+)
- **Clang/LLVM** (for eBPF compilation)
- **Node.js & npm** (for frontend)
- **Docker & Minikube** (for localized Kubernetes deployment)

## Usage

This project includes a comprehensive `Makefile` to simplify the build process.

- `make generate`: Compiles the eBPF C code into Go bytecode using `bpf2go`.
- `make build`: Generates bytecode and builds the local Go executable.
- `make docker-build`: Builds both backend and frontend Docker images.
- `make k8s-deploy`: Applies the Kubernetes manifests from the `deploy/kubernetes/` directory.
- `make k8s-clean`: Removes Kubernetes resources.

## Native Linux (Ubuntu) Execution

To run the exporter natively without Docker:

1. Generate the eBPF bytecode:
   ```bash
   make generate
   ```

2. Build the executable:
   ```bash
   make build
   ```

3. Run the exporter. **CRITICAL**: The binary MUST be run with `sudo` or elevated `CAP_BPF` / `CAP_SYS_ADMIN` privileges because attaching eBPF kprobes requires root access.
   ```bash
   sudo ./bin/network-exporter
   ```

## Frontend Dashboard

To start the React interface:

```bash
cd frontend
npm install
npm run dev
```

Ensure Prometheus is running and scraping the exporter. The frontend will proxy requests directly to `http://localhost:9090`.
