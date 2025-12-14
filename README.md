# 🚀 HƯỚNG DẪN DEPLOY HỆ THỐNG 2-CLUSTER

## Kiến trúc hệ thống

**Cluster 1 (Application Cluster):**

- 1 master + 2 workers (role=app)
- Chạy: Longhorn, Databases, Application services
  **Cluster 2 (Monitoring Cluster):**
- 1 master + 1 worker (role=monitoring)
- Chạy: Longhorn, Prometheus, Grafana, Kube-state-metrics
- Cross-cluster metrics collection từ Cluster 1

## Yêu cầu

- ✅ 2 K3s clusters đã cài đặt
- ✅ kubectl có quyền truy cập cả 2 clusters
- ✅ Docker images đã push lên Docker Hub
- ✅ 2 clusters cùng subnet

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
# Đợi databases ready
kubectl get pods -n databases --watch
# Chờ: postgres-0 1/1 Running, user-db-0 1/1 Running
```

### 4. Deploy Application Services

````bash
# Deploy config và backend services
kubectl apply -f deployment/prod/config-prod.yaml
kubectl apply -f deployment/prod/application/todo-service-prod.yaml
kubectl apply -f deployment/prod/application/user-service-prod.yaml
kubectl apply -f deployment/prod/application/stats-service-prod.yaml
# Deploy frontend
kubectl apply -f deployment/prod/frontend-prod.yaml
# Kiểm tra
kubectl get pods -n prod --watch```
### 5. Expose Metrics Endpoints
```bash
# Deploy kube-state-metrics trên Cluster 1
kubectl apply -f deployment/prod/kube-state-metrics.yaml
# Verify
kubectl get svc -n prod | grep metrics
kubectl get svc -n monitoring
````

**Cài đặt VIP (Virtual IP) để các services có 1 ip chung**

```bash
kubectl apply -f deployment/prod/rbac.yaml
kubectl apply -f deployment/prod/kube-vip-daemonset.yaml
```

**Các services được đổi thành LoadBalacer và có LoadbalancerIP rồi -> xem chi tiết trong các file yaml của services**
**Truy cập: 192.168.40.205**

---

### Cấu hình HPA (Horizontal Pod Autoscaler)

**Cài metrics server**

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

kubectl patch deployment metrics-server -n kube-system --type='json' -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'

kubectl get deployment metrics-server -n kube-system
```

**áp dụng hpa controller**

```bash
kubectl deployment/prod/application/hpa.yaml
kubectl get hpa -n prod
```

## 📦 CLUSTER 2: MONITORING CLUSTER

### 1. Cài đặt Longhorn Storage

````bash
# Cài đặt Longhorn trên Cluster 2, dùng longhorn.yaml, file đã chỉnh sửa replica xuống còn 2
kubectl apply -f longhorn.yaml
# Đợi Longhorn ready
kubectl get pods -n longhorn-system --watch
### 2. Label Nodes & Create Namespaces
```bash
# Label nodes
kubectl label nodes worker3 role=monitoring
# Tạo namespace
kubectl create namespace monitoring
# Verify
kubectl get nodes --show-labels | grep role
````

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

### Config grafana -> Tuyền

## ✅ KIỂM TRA & TEST HỆ THỐNG

```bash
#thay prod bằng tên các namespace muốn xem
kubectl get svc -n prod -o wide
#kq câu lệnh trên:
```

stats-service LoadBalancer 10.43.74.177 192.168.40.202 8082:31082/TCP 42h app=stats-service
todo-frontend-service LoadBalancer 10.43.169.194 192.168.40.203 80:31891/TCP 49s app=todo-frontend-prod
todo-service LoadBalancer 10.43.66.92 192.168.40.200 8080:32033/TCP 50m app=todo-service
user-service LoadBalancer 10.43.240.91 192.168.40.201 8081:31081/TCP 27h app=user-service

```
#truy cập frontend bằng 192.168.40.203/todo
```

```bash
#test scaling. truy cập master2 chạy lệnh sau để tăng traffic cho 1 service
hey -z 5000 -c 50 http://192.168.40.200:8080/todos
#sau đó chạy lệnh sau và xem replica của todo-service có tăng lên không
kubectl get hpa -n prod
```

####
