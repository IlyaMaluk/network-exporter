# ==============================================================================
# Variables
# ==============================================================================

EBPF_IMG ?= network-exporter-ebpf:latest
WEB_IMG ?= network-exporter-frontend:latest

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
	@echo "  make build-ebpf     - Build eBPF daemon and load into Minikube"
	@echo "  make build-web      - Build React frontend and load into Minikube"
	@echo "  make build-all      - Build all images and load them"
	@echo "  make k8s-deploy     - Deploy all resources (Prometheus first!)"
	@echo "  make k8s-clean      - Delete all resources from Kubernetes"
	@echo "  make k8s-rollout    - Restart deployments to pull fresh images"
	@echo "  make show-metrics   - Fetch raw OpenMetrics data from the cluster"
	@echo "  make run-web        - Forward Dashboard to http://localhost:3000"

# ==============================================================================
# Environment & Fixes
# ==============================================================================

.PHONY: up down fix-time test-loss-on test-loss-off test-error-on test-error-off show-metrics

up:
	@echo "Starting Minikube cluster..."
	minikube start
	@echo "Syncing hardware clock for Prometheus..."
	minikube ssh "sudo hwclock -s || sudo date -s \"\$$(curl -sI https://google.com | grep -i ^date: | sed 's/^[Dd]ate: //g' | tr -d '\r')\""
	@echo "Cluster is up! Use 'make k8s-deploy' to deploy."

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
	@echo "Building eBPF image..."
	docker build -t $(EBPF_IMG) -f build/Dockerfile.ebpf .
	@echo "Loading eBPF image into Minikube..."
	minikube image load $(EBPF_IMG)

build-web:
	@echo "Building Frontend image..."
	docker build -t $(WEB_IMG) -f frontend/Dockerfile ./frontend
	@echo "Loading Frontend image into Minikube..."
	minikube image load $(WEB_IMG)

build-all: build-ebpf build-web

# ==============================================================================
# Kubernetes Deploy & Rollouts
# ==============================================================================

.PHONY: k8s-deploy k8s-clean k8s-rollout

k8s-deploy:
	@echo "Deploying Prometheus first to ensure DNS resolution for Nginx..."
	kubectl apply -f deploy/k8s/prometheus/
	@echo "Deploying Network Exporter and Dashboard..."
	kubectl apply -f deploy/k8s/

k8s-clean:
	kubectl delete -f deploy/k8s/ --ignore-not-found
	kubectl delete -f deploy/k8s/prometheus/ --ignore-not-found

k8s-rollout:
	kubectl rollout restart deployment dashboard
	kubectl rollout restart daemonset network-exporter

# ==============================================================================
# UI Runners
# ==============================================================================

.PHONY: run-web

run-web:
	@echo "🌐 Dashboard is available at: http://localhost:3000"
	@echo "Press Ctrl+C to stop the server."
	kubectl port-forward svc/dashboard 3000:80

run-grafana:
	@echo "🌐 Dashboard is available at: http://localhost:3001"
	@echo "Press Ctrl+C to stop the server."
	kubectl port-forward daemonset/network-exporter 8081:8080
