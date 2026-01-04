# 🚀 Distributed Microservices System

A modern, enterprise-grade distributed system designed for high availability, scalability, and full-stack observability. This project demonstrates a production-ready architecture using a dual-cluster Kubernetes environment.

## 🌟 Overview

The core objective of this project is to build a resilient platform that separates business logic from operational monitoring. By deploying across two distinct clusters, the system ensures that monitoring remains independent and functional even during high-load scenarios or failures in the application layer.

## 🏗️ System Architecture

The system is split into two specialized clusters:

### 1. Application Cluster (Cluster 1)
Handles all user-facing traffic and business data processing.
*   **Frontend:** A modern React 19 SPA served via Nginx.
*   **Microservices:** Three Java 21 / Spring Boot 3.5 services (Todo, User, and Stats).
*   **Databases:** High-availability PostgreSQL instances managed with StatefulSets.
*   **Storage:** Longhorn distributed storage for data persistence and replication.
*   **Networking:** Kube-vip for High Availability VIP and Traefik for intelligent Ingress routing.

### 2. Monitoring Cluster (Cluster 2)
Acts as the "Watchtower" for the entire ecosystem.
*   **Prometheus:** Cross-cluster metrics collection (Hardware, Kubernetes, and App-level).
*   **Grafana:** Centralized visualization and real-time performance dashboards.
*   **Observability:** Integrated Node Exporter and Kube-State-Metrics for 360° visibility.

## ✨ Key Features

*   **Self-Healing:** Kubernetes automatically restarts failed pods and redistributes workloads.
*   **Auto-Scaling:** Horizontal Pod Autoscalers (HPA) dynamically adjust service replicas based on CPU demand.
*   **High Availability:** Network failover via Kube-vip ensures the system entry point is always reachable.
*   **Storage Resilience:** Longhorn ensures that database data is replicated across multiple nodes to prevent data loss.
*   **Fault Tolerance:** The Stats service is designed to remain functional even if other sub-services are temporarily unavailable.

## 🛠️ Technology Stack

*   **Backend:** Java 21, Spring Boot 3.5, Hibernate, PostgreSQL.
*   **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI.
*   **Infrastructure:** K3s (Kubernetes), Docker, Traefik, Kube-vip.
*   **Storage:** Longhorn.
*   **Operations:** Prometheus, Grafana, Micrometer, Node Exporter.