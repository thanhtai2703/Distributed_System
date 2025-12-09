# 🚀 HƯỚNG DẪN DEPLOY HỆ THỐNG

## Yêu cầu

- ✅ K3s cluster đã cài đặt
- ✅ kubectl có quyền truy cập cluster
- ✅ Docker images đã push lên Docker Hub

---

## 📦 CÀI ĐẶT LONGHORN STORAGE

```bash
# Cài đặt Longhorn
kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/v1.10.1/deploy/longhorn.yaml

# Đợi Longhorn ready
kubectl get pods -n longhorn-system --watch
# Chờ đến khi tất cả pods Running

# Expose Longhorn UI (Optional)
kubectl patch svc longhorn-frontend -n longhorn-system -p '{"spec":{"type":"NodePort","ports":[{"port":80,"targetPort":8000,"nodePort":30880}]}}'
```

**Longhorn UI**: http://192.168.40.121:30880

---

## 🏷️ LABEL NODES & CREATE NAMESPACES

### 1. Label Nodes cho Anti-Affinity

```bash
# Kiểm tra nodes hiện có
kubectl get nodes

# Label nodes theo role
# Worker nodes: role=app (cho application pods)
kubectl label nodes worker1 role=ops
kubectl label nodes worker2 role=app
kubectl label nodes worker3 role=app

# Verify labels
kubectl get nodes --show-labels | grep role
```

### 2. Tạo Namespaces

```bash
# Tạo namespace cho databases
kubectl create namespace databases

# Tạo namespace cho monitoring
kubectl create namespace monitoring

# Tạo namespace cho production
kubectl create namespace prod

# Tạo namespace cho development(optional)
kubectl create namespace dev

# Verify namespaces
kubectl get namespaces
```

---

## 📦 DEPLOY PRODUCTION

### 1. Deploy Databases

```bash
kubectl apply -f deployment/databases/databases.yaml
kubectl apply -f deployment/databases/db-services.yaml
# Đợi databases ready
kubectl get pods -n databases --watch
# Chờ đến khi: postgres-0 1/1 Running, user-db-0 1/1 Running
```

### 2. Deploy Backend Services

```bash
kubectl apply -f deployment/prod/config-prod.yaml
kubectl apply -f deployment/prod/todo-service-prod.yaml
kubectl apply -f deployment/prod/user-service-prod.yaml
kubectl apply -f deployment/prod/stats-service-prod.yaml
# Kiểm tra
kubectl get pods -n prod --watch
# Chờ đến khi: 6/6 pods Running (2 replicas × 3 services)
```

### 3. Deploy Frontend

```bash
kubectl apply -f deployment/prod/frontend-prod.yaml
# Kiểm tra
kubectl get pods -n prod
```

### 4. Deploy Monitoring

```bash
kubectl apply -f deployment/monitoring/kube-state-metrics.yaml
kubectl apply -f deployment/monitoring/prometheus.yaml
kubectl apply -f deployment/monitoring/grafana.yaml
# Kiểm tra
kubectl get pods -n monitoring
```

---

## 🧪 DEPLOY DEV (Optional)

```bash
# 1. Tạo namespace
kubectl create namespace dev

# 2. Deploy databases dev
kubectl apply -f deployment/dev/databases-dev.yaml
kubectl get pods -n databases -l env=dev --watch

# 3. Deploy services dev
kubectl apply -f deployment/dev/config-dev.yaml
kubectl apply -f deployment/dev/todo-service-dev.yaml
kubectl apply -f deployment/dev/user-service-dev.yaml
kubectl apply -f deployment/dev/stats-service-dev.yaml
kubectl apply -f deployment/dev/frontend-dev.yaml

# 4. Kiểm tra
kubectl get pods -n dev
```

---

## 🌐 TRUY CẬP HỆ THỐNG

### Production

- **Frontend**: http://192.168.40.121:31000
- **Todo API**: http://192.168.40.121:31080/todos
- **User API**: http://192.168.40.121:31081/users
- **Stats API**: http://192.168.40.121:31082/stats
- **Prometheus**: http://192.168.40.121:30000
- **Grafana**: http://192.168.40.121:32000

### Dev

- **Frontend**: http://192.168.40.121:32000
- **Todo API**: http://192.168.40.121:32080/todos
- **User API**: http://192.168.40.121:32081/users
- **Stats API**: http://192.168.40.121:32082/stats

### Longhorn UI

```bash
kubectl patch svc longhorn-frontend -n longhorn-system -p '{"spec":{"type":"NodePort","ports":[{"port":80,"targetPort":8000,"nodePort":30880}]}}'
```

URL: http://192.168.40.121:30880

---

## ✅ KIỂM TRA HỆ THỐNG

```bash
# Check tất cả pods
kubectl get pods -A

# Check services
kubectl get svc -n prod
kubectl get svc -n databases
kubectl get svc -n monitoring

# Check PVCs (storage)
kubectl get pvc -n databases
kubectl get pvc -n monitoring

# Check nodes
kubectl get nodes -o wide
```

---

## 🔧 TROUBLESHOOTING

### Pod không start

```bash
kubectl describe pod <pod-name> -n <namespace>
kubectl logs <pod-name> -n <namespace>
```

### Service không accessible

```bash
kubectl get svc -n <namespace>
curl http://192.168.40.121:<NodePort>/actuator/health
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
