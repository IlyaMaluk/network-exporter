# ==============================================================================
# Variables
# ==============================================================================

EBPF_IMG ?= network-exporter-ebpf:latest
WEB_IMG ?= network-exporter-frontend:latest
CLI_IMG ?= network-exporter-cli:latest

# ==============================================================================
# Help
# ==============================================================================

.PHONY: help
help:
	@echo "======================================================================"
	@echo "Network Exporter - Master Control Panel"
	@echo "======================================================================"
	@echo "IMPORTANT FOR WINDOWS USERS:"
	@echo "Before running 'make build-all' or any build command, ensure you point"
	@echo "your Docker client to Minikube's internal Docker registry:"
	@echo "Run this in PowerShell: minikube docker-env | Invoke-Expression"
	@echo "======================================================================"
	@echo ""
	@echo "Available Commands:"
	@echo "  make help           - Show this help message"
	@echo "  make up             - Start Minikube cluster and sync time"
	@echo "  make down           - Gracefully stop the Minikube cluster"
	@echo "  make fix-time       - Sync time in Minikube to fix blank Prometheus charts"
	@echo "  make test-loss-on   - Simulate 15% packet loss for eBPF testing"
	@echo "  make test-loss-off  - Restore normal network"
	@echo "  make build-ebpf     - Build eBPF daemon image"
	@echo "  make build-web      - Build React frontend image"
	@echo "  make build-cli      - Build Go TUI CLI image"
	@echo "  make build-all      - Build all images"
	@echo "  make k8s-deploy     - Deploy all resources to Kubernetes"
	@echo "  make k8s-clean      - Delete all resources from Kubernetes"
	@echo "  make k8s-rollout    - Restart deployments to pull fresh images"
	@echo "  make show-metrics   - Fetch raw OpenMetrics data from the cluster"
	@echo "  make run-web        - Forward Dashboard to http://localhost:3000"
	@echo "  make run-cli        - Run the interactive TUI in the cluster"

# ==============================================================================
# Environment & Fixes
# ==============================================================================

.PHONY: up down fix-time test-loss-on test-loss-off show-metrics

up:
	@echo "Starting Minikube cluster..."
	minikube start
	@echo "Syncing hardware clock for Prometheus..."
	minikube ssh "sudo hwclock -s || sudo date -s \"\$$(curl -sI https://google.com | grep -i ^date: | sed 's/^[Dd]ate: //g' | tr -d '\r')\""
	@echo "Cluster is up! Use 'make run-web' to access the dashboard."

down:
	@echo "Gracefully stopping Minikube cluster..."
	minikube stop

fix-time:
	minikube ssh "sudo hwclock -s || sudo date -s \"\$$(curl -sI https://google.com | grep -i ^date: | sed 's/^[Dd]ate: //g' | tr -d '\r')\""

test-loss-on:
	minikube ssh "sudo tc qdisc replace dev eth0 root netem loss 15%"

test-loss-off:
	minikube ssh "sudo tc qdisc del dev eth0 root || true"

test-error-on:
	minikube ssh "sudo iptables -A INPUT -i eth0 -m statistic --mode random --probability 0.1 -j DROP"

test-error-off:
	minikube ssh "sudo iptables -D INPUT -i eth0 -m statistic --mode random --probability 0.1 -j DROP || true"

show-metrics:
	@echo "Fetching raw eBPF metrics from the cluster..."
	kubectl run curl-metrics -i --rm --image=curlimages/curl --restart=Never -- -s http://network-exporter:8080/metrics

# ==============================================================================
# Docker Builds
# ==============================================================================

.PHONY: build-ebpf build-web build-all

build-ebpf:
	docker build -t $(EBPF_IMG) -f build/Dockerfile.ebpf .

build-frontend:
	docker build --no-cache -t network-dashboard:latest -f frontend/Dockerfile ./frontend

build-web:
	docker build -t $(WEB_IMG) -f frontend/Dockerfile ./frontend

build-all: build-ebpf build-web

# ==============================================================================
# Kubernetes Deploy & Rollouts
# ==============================================================================

.PHONY: k8s-deploy k8s-clean k8s-rollout

k8s-deploy:
	kubectl apply -f deploy/k8s/
	kubectl apply -f deploy/k8s/prometheus/

k8s-clean:
	kubectl delete -f deploy/k8s/ --ignore-not-found
	kubectl delete -f deploy/k8s/prometheus/ --ignore-not-found

k8s-rollout:
	kubectl rollout restart deployment dashboard
	kubectl rollout restart daemonset network-exporter

# ==============================================================================
# UI Runners
# ==============================================================================

.PHONY: run-web run-grafana run-cli

run-web:
	@echo "🌐 Dashboard is available at: http://localhost:3000"
	@echo "Press Ctrl+C to stop the server."
	kubectl port-forward svc/dashboard 3000:80

run-grafana:
	@echo "🌐 Dashboard is available at: http://localhost:3001"
	@echo "Press Ctrl+C to stop the server."
	kubectl port-forward daemonset/network-exporter 8081:8080

run-cli:
	kubectl run netmon-debug -it --rm --image=$(CLI_IMG) --restart=Never --env="PROMETHEUS_URL=http://prometheus:9090"