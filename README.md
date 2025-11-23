# Triển Khai Hạ Tầng Microservices Trên Kubernetes (K3S)
### Mô hình: 1 Master + 3 Workers

---

## I. Tài Nguyên Sử Dụng

Hệ thống gồm 4 máy ảo Ubuntu 20.04:

| STT | Hostname        | Vai trò        | Cấu hình      | Nhiệm vụ                     |
|-----|------------------|----------------|----------------|-------------------------------|
| 1   | k3s-master       | Control Plane  | 2 Core / 2GB  | Quản lý cụm, API Server       |
| 2   | worker-monitor   | Infrastructure | 2 Core / 4GB  | Chạy Prometheus, Grafana      |
| 3   | worker-backend   | Backend Zone   | 2 Core / 3GB  | Deploy Backend                |
| 4   | worker-frontend  | Frontend Zone  | 2 Core / 1GB  | Deploy Frontend               |

> Gợi ý: Đặt network VM ở chế độ **Bridge** để nhận IP như máy thật.

---

## II. Thiết Lập Môi Trường (OS Setup)

Thực hiện trên **tất cả 4 máy**:

### 1. Cấu hình IP Tĩnh (tùy chọn)

Có thể cấu hình sau nếu dùng chế độ Bridge.

### 2. Đặt Hostname & Tắt Firewall

```bash
# Đặt hostname (ví dụ cho Master)
sudo hostnamectl set-hostname k3s-master

# Tắt firewall
sudo ufw disable

# Áp dụng lại profile
bash
```

---

## III. Cài Đặt Kubernetes (K3S)

### 1. Cài đặt Master Node

Trên `k3s-master`:

```bash
curl -sfL https://get.k3s.io | sh -
```

Lấy node token để các worker truy cập:

```bash
sudo cat /var/lib/rancher/k3s/server/node-token
```

### 2. Cài đặt Worker Nodes

Chạy lệnh sau trên mỗi Worker:

```bash
curl -sfL https://get.k3s.io |   K3S_URL=https://<IPMASTER>:6443   K3S_TOKEN=<token> sh -
```

### 3. Kiểm tra trạng thái các node

```bash
sudo k3s kubectl get nodes
```

Kết quả phải có **4 node** dạng `Ready`.

---

## IV. Phân Chia Vai Trò (Node Labeling)

Gán nhãn cho các node (làm trên máy Master):

```bash
# Node Monitoring
sudo k3s kubectl label nodes k3s-monitor role=monitoring

# Node Backend
sudo k3s kubectl label nodes k3s-backend role=backend

# Node Frontend
sudo k3s kubectl label nodes k3s-frontend role=frontend
```

Kiểm tra:

```bash
sudo k3s kubectl get nodes --show-labels
```

---

## V. Cài Đặt Monitoring Stack (Prometheus + Grafana)

Monitoring sẽ chạy trên `worker-monitor`.

### 1. Cài Helm

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

### 2. Chuẩn bị file cấu hình

Cần tạo các file:

- `monitoring-values.yaml`
- `backend-stack.yaml`
- `frontend-deploy.yaml`

### 3. Triển khai stack

```bash
# Tạo namespace Monitoring
sudo k3s kubectl create namespace monitoring

# Cấp quyền đọc file Kubeconfig
sudo chmod 644 /etc/rancher/k3s/k3s.yaml

# Cài Prometheus Stack
helm install prometheus prometheus-community/kube-prometheus-stack   --namespace monitoring   -f monitoring-values.yaml

# Namespace Backend + Frontend
sudo k3s kubectl create namespace db
sudo k3s kubectl apply -f backend-stack.yaml
sudo k3s kubectl apply -f frontend-deploy.yaml
```

---

## VI. Kiểm Tra Truy Cập
Sau deploy:

- Kiểm tra pod:

```bash
sudo k3s kubectl get pods -A
```
- Đăng nhập Grafana:
  - User: `admin`
  - Password lấy từ secret:
    ```bash
    sudo k3s kubectl get secret -n monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode
    ```
- Truy cập các services khác kiểm tra qua ip và port thử.
---

## Hoàn Tất

Đã triển khai thành công hạ tầng Microservices cơ bản gồm:
- K3s Cluster (1 Master + 3 Workers)
- Monitoring Stack
- Backend & Frontend Deploy

