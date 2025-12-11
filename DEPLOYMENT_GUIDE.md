# 🚀 HƯỚNG DẪN DEPLOY HỆ THỐNG 2-CLUSTER

## Kiến trúc hệ thống

**Cluster 1 (Application Cluster):**

- 1 master + 2 workers (role=app)
- Chạy: Longhorn, Databases, Application services
- IP: 192.168.40.121

**Cluster 2 (Monitoring Cluster):**

- 1 master + 1 worker (role=monitoring)
- Chạy: Longhorn, Prometheus, Grafana, Kube-state-metrics
- Cross-cluster metrics collection từ Cluster 1

## Yêu cầu

- ✅ 2 K3s clusters đã cài đặt
- ✅ kubectl có quyền truy cập cả 2 clusters
- ✅ Docker images đã push lên Docker Hub
- ✅ 2 clusters cùng subnet hoặc có kết nối mạng

---

## 📦 CLUSTER 1: APPLICATION CLUSTER

### 1. Cài đặt Longhorn Storage

```bash
# Cài đặt Longhorn trên Cluster 1
kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/v1.10.1/deploy/longhorn.yaml

# Đợi Longhorn ready
kubectl get pods -n longhorn-system --watch

# (Optional) Expose Longhorn UI
kubectl patch svc longhorn-frontend -n longhorn-system -p '{"spec":{"type":"NodePort","ports":[{"port":80,"targetPort":8000,"nodePort":30880}]}}'
```

**Longhorn UI**: http://192.168.40.121:30880

### 2. Label Nodes & Create Namespaces

```bash
# Label nodes theo role
kubectl label nodes worker1 role=app
kubectl label nodes worker2 role=app

# Tạo namespaces
kubectl create namespace databases
kubectl create namespace prod
kubectl create namespace monitoring

# Verify
kubectl get nodes --show-labels | grep role
kubectl get namespaces
```

### 3. Deploy Databases

```bash
kubectl apply -f deployment/databases/databases.yaml
kubectl apply -f deployment/databases/db-services.yaml

# Đợi databases ready
kubectl get pods -n databases --watch
# Chờ: postgres-0 1/1 Running, user-db-0 1/1 Running
```

### 4. Deploy Application Services

```bash
# Deploy config và backend services
kubectl apply -f deployment/prod/config-prod.yaml
kubectl apply -f deployment/prod/todo-service-prod.yaml
kubectl apply -f deployment/prod/user-service-prod.yaml
kubectl apply -f deployment/prod/stats-service-prod.yaml

# Deploy frontend
kubectl apply -f deployment/prod/frontend-prod.yaml

# Kiểm tra
kubectl get pods -n prod --watch
# Chờ: 8/8 pods Running (2 replicas × 3 services + 2 frontend)
```

### 5. Expose Metrics Endpoints

```bash
# Deploy NodePort services để expose metrics cho Cluster 2
kubectl apply -f deployment/monitoring/metrics-nodeport.yaml

# Deploy kube-state-metrics trên Cluster 1
kubectl apply -f deployment/monitoring/kube-state-metrics.yaml

# Verify
kubectl get svc -n prod | grep metrics
kubectl get svc -n monitoring
```

**Metrics endpoints:**

- todo-service: `192.168.40.121:31180`
- user-service: `192.168.40.121:31181`
- stats-service: `192.168.40.121:31182`
- kube-state-metrics: `192.168.40.121:31280`

---

## 📦 CLUSTER 2: MONITORING CLUSTER

### 1. Cài đặt Longhorn Storage

```bash
# Cài đặt Longhorn trên Cluster 2
kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/v1.10.1/deploy/longhorn.yaml

# Đợi Longhorn ready
kubectl get pods -n longhorn-system --watch

# QUAN TRỌNG: Set replica count = 2 (vì chỉ có 2 nodes)
kubectl patch settings.longhorn.io default-replica-count -n longhorn-system --type='json' -p='[{"op": "replace", "path": "/value", "value": "2"}]'
```

### 2. Label Nodes & Create Namespaces

```bash
# Label nodes
kubectl label nodes worker1 role=monitoring

# Tạo namespace
kubectl create namespace monitoring

# Verify
kubectl get nodes --show-labels | grep role
```

### 3. Deploy Kube-State-Metrics

```bash
kubectl apply -f deployment/monitoring/kube-state-metrics.yaml

# Verify
kubectl get pods -n monitoring
```

### 4. Deploy Prometheus

```bash
# Deploy Prometheus với cross-cluster scrape configs
kubectl apply -f deployment/monitoring/prometheus.yaml

# Verify
kubectl get pods -n monitoring
kubectl get svc -n monitoring
```

**Prometheus UI**: http://<cluster2-ip>:30000

### 5. Deploy Grafana

```bash
kubectl apply -f deployment/monitoring/grafana.yaml

# Verify
kubectl get pods -n monitoring
kubectl get pvc -n monitoring
```

**Grafana UI**: http://<cluster2-ip>:32000

- Username: `admin`
- Password: `admin`

---

## 🔧 CONFIGURE GRAFANA

### 1. Login Grafana

Truy cập: http://<cluster2-ip>:32000

- Username: `admin`
- Password: `admin` (sẽ yêu cầu đổi password)

### 2. Add Prometheus Datasource

- Click **⚙️ Configuration** > **Data Sources** > **Add data source**
- Chọn **Prometheus**
- URL: `http://prometheus-service.monitoring.svc:9090`
- Click **Save & Test**

### 3. Import Dashboards

**Kubernetes Cluster Monitoring:**

- Dashboard ID: **15661**

**Spring Boot Statistics:**

- Dashboard ID: **12900** hoặc **11378**

**JVM Micrometer:**

- Dashboard ID: **4701**

---

## 🌐 TRUY CẬP HỆ THỐNG

### Cluster 1 - Application

- **Frontend**: http://192.168.40.121:31000
- **Todo API**: http://192.168.40.121:31080/todos
- **User API**: http://192.168.40.121:31081/users
- **Stats API**: http://192.168.40.121:31082/stats
- **Longhorn UI**: http://192.168.40.121:30880

### Cluster 2 - Monitoring

- **Prometheus**: http://<cluster2-ip>:30000
- **Grafana**: http://<cluster2-ip>:32000

---

## ✅ KIỂM TRA & TEST HỆ THỐNG

### 1. Verify Cluster 1

```bash
# Check pods
kubectl get pods -n prod
kubectl get pods -n databases

# Check services
kubectl get svc -n prod
kubectl get svc -n monitoring

# Test application
curl http://192.168.40.121:31000
curl http://192.168.40.121:31080/todos/actuator/health
curl http://192.168.40.121:31081/users/actuator/health
curl http://192.168.40.121:31082/stats/actuator/health

# Test metrics endpoints
curl http://192.168.40.121:31180/actuator/prometheus
curl http://192.168.40.121:31181/actuator/prometheus
curl http://192.168.40.121:31182/actuator/prometheus
```

### 2. Verify Cluster 2

```bash
# Check pods
kubectl get pods -n monitoring

# Check PVCs
kubectl get pvc -n monitoring
```

### 3. Verify Prometheus Metrics Collection

Truy cập: http://<cluster2-ip>:30000

**Check Targets (Status > Targets):**

- Tất cả targets phải **UP**

**Test Queries:**

```promql
# Services health
up{cluster="cluster1"}

# HTTP request rate
rate(http_server_requests_seconds_count{cluster="cluster1"}[5m])

# Pod status
kube_pod_status_phase{cluster="cluster1"}

# JVM memory
jvm_memory_used_bytes{cluster="cluster1"}
```

### 4. Generate Load Test

```bash
# Generate traffic to Cluster 1
for i in {1..100}; do curl -s http://192.168.40.121:31080/todos > /dev/null; done
for i in {1..100}; do curl -s http://192.168.40.121:31081/users > /dev/null; done
for i in {1..100}; do curl -s http://192.168.40.121:31082/stats > /dev/null; done

# Verify metrics in Grafana dashboards
```

---

## 🔧 TROUBLESHOOTING

### Pod không start

```bash
kubectl describe pod <pod-name> -n <namespace>
kubectl logs <pod-name> -n <namespace>
```

### Metrics 404 Not Found

```bash
# Rebuild images với actuator dependencies
# Thêm vào pom.xml:
# <dependency>
#   <groupId>io.micrometer</groupId>
#   <artifactId>micrometer-registry-prometheus</artifactId>
# </dependency>

# Rebuild và push
docker build -t <image>:<version> .
docker push <image>:<version>

# Update deployment
kubectl set image deployment/<name> <container>=<image>:<version> -n prod
```

### Prometheus targets DOWN

```bash
# Check metrics endpoints từ Cluster 2
curl -v http://192.168.40.121:31180/actuator/prometheus

# Check network connectivity
ping 192.168.40.121

# Check NodePort services
kubectl get svc -n prod | grep metrics
```

### Grafana data source error

```bash
# Verify Prometheus service
kubectl get svc prometheus-service -n monitoring

# URL phải là: http://prometheus-service.monitoring.svc:9090
# Không phải: http://prometheus-service.monitoring.svc:8080
```

### Longhorn volume faulted

```bash
# Check replica count settings
kubectl get settings.longhorn.io default-replica-count -n longhorn-system -o yaml

# Cluster 2 chỉ có 2 nodes, phải set replica=2
kubectl patch settings.longhorn.io default-replica-count -n longhorn-system --type='json' -p='[{"op": "replace", "path": "/value", "value": "2"}]'

# Clean reinstall nếu cần
kubectl delete namespace longhorn-system
# Xóa /var/lib/longhorn/* trên tất cả nodes
# Cài lại Longhorn
```

### Database connection error

```bash
# Check database pods
kubectl get pods -n databases

# Check logs
kubectl logs postgres-0 -n databases
kubectl logs user-db-0 -n databases
```

### Restart deployment

```bash
kubectl rollout restart deployment <deployment-name> -n <namespace>
kubectl rollout status deployment <deployment-name> -n <namespace>
```

---

## 📊 DATA RETENTION & BACKUP

### Prometheus Data Retention

Mặc định: 12 giờ (cấu hình trong `prometheus.yaml`)

**Tăng retention:**

```yaml
args:
  - "--storage.tsdb.retention.time=30d" # Giữ 30 ngày
  - "--storage.tsdb.retention.size=50GB" # Hoặc giới hạn theo size
```

### Persistent Data

**Khi monitoring pods restart/die:**

- ✅ Prometheus metrics data: Được giữ lại trong PVC (Longhorn volume)
- ✅ Grafana dashboards/datasources: Được giữ lại trong PVC
- ✅ Database data: Được giữ lại trong PVC

**Longhorn replication:**

- Cluster 1: 3 replicas (trên 3 nodes)
- Cluster 2: 2 replicas (trên 2 nodes)

**Test data persistence:**

```bash
# Xóa pods để giả lập crash
kubectl delete pod -l app=prometheus-server -n monitoring
kubectl delete pod -l app=grafana -n monitoring

# Pods mới sẽ mount lại cùng volume
kubectl get pods -n monitoring -w

# Verify: Dashboards và historical data vẫn còn
```

---

## 🎯 KIẾN TRÚC TỔNG QUAN

```
┌─────────────────────────────────────────┐
│       CLUSTER 1 (Application)           │
│  192.168.40.121                         │
│  ┌──────────────────────────────┐      │
│  │ Longhorn Storage (3 replicas)│      │
│  └──────────────────────────────┘      │
│  ┌──────────────────────────────┐      │
│  │ Databases                     │      │
│  │ - postgres (todo_db)          │      │
│  │ - user-db                     │      │
│  └──────────────────────────────┘      │
│  ┌──────────────────────────────┐      │
│  │ Application Services          │      │
│  │ - todo-service (2 replicas)   │      │
│  │ - user-service (2 replicas)   │      │
│  │ - stats-service (2 replicas)  │      │
│  │ - frontend (2 replicas)       │      │
│  └──────────────────────────────┘      │
│  ┌──────────────────────────────┐      │
│  │ Metrics Exposure              │      │
│  │ NodePort: 31180/31181/31182   │      │
│  │ kube-state-metrics: 31280     │      │
│  └──────────────────────────────┘      │
└─────────────────────────────────────────┘
              │ Cross-cluster
              │ metrics scraping
              ▼
┌─────────────────────────────────────────┐
│       CLUSTER 2 (Monitoring)            │
│  <cluster2-ip>                          │
│  ┌──────────────────────────────┐      │
│  │ Longhorn Storage (2 replicas)│      │
│  └──────────────────────────────┘      │
│  ┌──────────────────────────────┐      │
│  │ Prometheus (Port 30000)       │      │
│  │ - Scrapes Cluster 1 metrics   │      │
│  │ - Retention: 12h              │      │
│  └──────────────────────────────┘      │
│  ┌──────────────────────────────┐      │
│  │ Grafana (Port 32000)          │      │
│  │ - Dashboards                  │      │
│  │ - Visualization               │      │
│  └──────────────────────────────┘      │
│  ┌──────────────────────────────┐      │
│  │ Kube-State-Metrics (Local)    │      │
│  └──────────────────────────────┘      │
└─────────────────────────────────────────┘
```

---
