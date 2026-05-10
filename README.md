# eBPF Network Metrics Exporter

High-performance eBPF-based network metrics exporter for Kubernetes in OpenMetrics format, paired with a real-time React dashboard. Developed for deep network observability and anomaly detection with near-zero overhead.

## 🧠 Architecture Overview

- **eBPF (Extended Berkeley Packet Filter):** Safely hooks into the Linux kernel (via `kprobes`) to monitor TCP/IP stack operations (e.g., `tcp_retransmit_skb`). Gathers granular data directly in kernel space.
- **Go Exporter:** Userspace daemon that reads from BPF maps and `procfs`, formats the data according to the OpenMetrics standard, and exposes it via an HTTP `/metrics` endpoint.
- **Prometheus:** Time-series database configured to scrape and retain the exported metrics.
- **React Frontend:** A modern, dynamic Vite-based dashboard querying the Prometheus API (`/api/v1/query_range`) and using `recharts` for rich, localized visualizations.

## 🛠 Prerequisites

- **WSL2 / Ubuntu** (Recommended environment)
- **Minikube & Docker** (For local Kubernetes cluster)
- **Go 1.20+** & **Clang/LLVM** (For eBPF compilation)
- **Make** (To use the Master Control Panel)

## 🚀 Quick Start (Kubernetes / Minikube)

This project uses a centralized `Makefile` to handle everything from cluster provisioning to chaos engineering.

1. **Start the cluster and sync time:**
   ```bash
   make up
   ```

2. **Point your Docker CLI to Minikube's registry:**
   ```bash
   eval $(minikube docker-env)
   ```
   *(Windows users in PowerShell: `minikube docker-env | Invoke-Expression`)*

3. **Build all images & Deploy:**
   ```bash
   make build-all
   make k8s-deploy
   ```

4. **Access the Dashboard:**
   ```bash
   make run-web
   ```

## 🎮 Master Control Panel (Makefile Targets)

Forget manual `kubectl` commands. Use the Makefile:

| Command | Description |
|---|---|
| `make up` / `make down` | Start or gracefully stop the Minikube cluster. |
| `make build-all` | Builds the Go eBPF daemon, React frontend, and CLI images. |
| `make k8s-rollout` | Restarts the deployments to immediately pull freshly built images. |
| `make show-metrics` | Spawns a temporary pod to curl and print raw OpenMetrics data. |
| `make fix-time` | Syncs Minikube's hardware clock (fixes empty Prometheus charts after waking from sleep). |

## 🚦 Chaos Engineering (Live Testing)

Want to see the eBPF probes in action? You can simulate network degradation directly from the Makefile.

- **Inject 15% Packet Loss:**
  ```bash
  make test-loss-on
  ```
  *Watch the TCP Retransmits (eBPF) chart spike in real-time on the dashboard.*

- **Restore Normal Network:**
  ```bash
  make test-loss-off
  ```

## 📂 Project Structure

- `/bpf`: C code for eBPF probes and kernel headers.
- `/cmd` & `/internal`: Go source code for the exporter and CLI.
- `/frontend`: React/Vite dashboard application.
- `/deploy/k8s`: Kubernetes manifests (DaemonSet, Deployment, Service, Prometheus config).
- `/build`: Dockerfiles for various project components.

---
*Note: If running the exporter natively outside of Docker/K8s, the binary MUST be executed with `sudo` (or `CAP_BPF` / `CAP_SYS_ADMIN` capabilities) to attach eBPF kprobes.*