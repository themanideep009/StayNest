# StayNest Deployment Guide - AWS + Kubernetes + CI/CD

## Complete Deployment Architecture

```
GitHub Repository (Source Code)
        ↓
GitHub Actions (CI/CD Pipeline)
        ↓
Build Docker Image → Push to AWS ECR (Elastic Container Registry)
        ↓
Deploy to AWS EKS (Elastic Kubernetes Service)
        ↓
Service exposed via Load Balancer
        ↓
MongoDB Atlas (Database)
        ↓
Prometheus + Grafana (Monitoring)
```

---

## Phase 1: AWS Setup (Prerequisites)

### Step 1.1: Create AWS Account
- [ ] Go to https://aws.amazon.com
- [ ] Sign up for free account
- [ ] Add payment method
- [ ] Create IAM user for development

### Step 1.2: Install AWS CLI
```powershell
# Install AWS CLI
choco install awscli

# Verify installation
aws --version

# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Default region (us-east-1)
```

### Step 1.3: Create AWS Resources
```powershell
# Create ECR Repository
aws ecr create-repository --repository-name staynest --region us-east-1

# Create EKS Cluster (takes 10-15 minutes)
eksctl create cluster --name staynest-cluster --version 1.28 --region us-east-1 --nodegroup-name staynest-nodes --nodes 2 --nodes-min 1 --nodes-max 3

# Configure kubectl
aws eks update-kubeconfig --name staynest-cluster --region us-east-1

# Verify cluster
kubectl get nodes
```

---

## Phase 2: Docker & Container Registry

### Step 2.1: Build Docker Image
```powershell
cd C:\Users\thema\OneDrive\Desktop\cloudproject\StayNest

# Build Docker image
docker build -t staynest:latest .

# Test locally
docker run -p 3000:3000 staynest:latest
```

### Step 2.2: Push to AWS ECR
```powershell
# Get AWS account ID
$AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag image for ECR
docker tag staynest:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/staynest:latest

# Push to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/staynest:latest
```

---

## Phase 3: Kubernetes Deployment

### Step 3.1: Update Kubernetes Manifests

**Update k8s/03-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: staynest-app
  namespace: staynest
spec:
  replicas: 2
  selector:
    matchLabels:
      app: staynest
  template:
    metadata:
      labels:
        app: staynest
    spec:
      containers:
      - name: staynest
        image: YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/staynest:latest
        ports:
        - containerPort: 3000
        env:
        - name: MONGO_URL
          valueFrom:
            secretKeyRef:
              name: staynest-secrets
              key: mongo-url
        - name: PORT
          value: "3000"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Step 3.2: Create Kubernetes Secrets
```powershell
# Create namespace
kubectl create namespace staynest

# Create secret for MongoDB URL
kubectl create secret generic staynest-secrets `
  --from-literal=mongo-url="mongodb+srv://manideepsai:%40Manideep3@cluster0.aqjkpoh.mongodb.net/?appName=Cluster0" `
  -n staynest
```

### Step 3.3: Deploy to Kubernetes
```powershell
# Apply all manifests
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/03-deployment.yaml
kubectl apply -f k8s/04-service.yaml
kubectl apply -f k8s/05-ingress.yaml
kubectl apply -f k8s/06-hpa.yaml

# Verify deployment
kubectl get pods -n staynest
kubectl get svc -n staynest
```

---

## Phase 4: CI/CD Pipeline (GitHub Actions)

### Step 4.1: Create GitHub Actions Workflow
**Create file: `.github/workflows/deploy.yml`**

```yaml
name: Build and Deploy to EKS

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: staynest
  EKS_CLUSTER_NAME: staynest-cluster

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push image to ECR
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        cd StayNest
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
    
    - name: Update EKS kubeconfig
      run: |
        aws eks update-kubeconfig --name $EKS_CLUSTER_NAME --region $AWS_REGION
    
    - name: Deploy to EKS
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        kubectl set image deployment/staynest-app staynest=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -n staynest
        kubectl rollout status deployment/staynest-app -n staynest
```

### Step 4.2: Add GitHub Secrets
1. Go to GitHub Repository → Settings → Secrets → New repository secret
2. Add:
   - `AWS_ACCESS_KEY_ID` = Your AWS Access Key
   - `AWS_SECRET_ACCESS_KEY` = Your AWS Secret Key

---

## Phase 5: Monitoring (Prometheus + Grafana)

### Step 5.1: Deploy Prometheus
```powershell
# Add Prometheus Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

### Step 5.2: Deploy Grafana
```powershell
# Grafana is installed with kube-prometheus-stack
# Get Grafana admin password
$password = kubectl get secret -n monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 -d

# Port forward to access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3001:80

# Access: http://localhost:3001
# Username: admin
# Password: (from command above)
```

### Step 5.3: Configure Grafana Dashboards
1. Add Prometheus data source
2. Import Kubernetes monitoring dashboard
3. Create custom dashboards for StayNest metrics

---

## Phase 6: Security & SSL

### Step 6.1: Install Cert-Manager
```powershell
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager -n cert-manager
```

### Step 6.2: Update Ingress for HTTPS
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: staynest-ingress
  namespace: staynest
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - staynest.yourdomain.com
    secretName: staynest-tls
  rules:
  - host: staynest.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: staynest-service
            port:
              number: 3000
```

---

## Phase 7: Validation & Testing

### Step 7.1: Verify Deployment
```powershell
# Check all resources
kubectl get all -n staynest

# Check logs
kubectl logs -f deployment/staynest-app -n staynest

# Get Load Balancer URL
kubectl get svc -n staynest
```

### Step 7.2: Test Application
```powershell
# Get the external IP
$LB_URL = kubectl get svc staynest-service -n staynest -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Test
curl "http://$LB_URL"
```

---

## Phase 8: Monitoring & Auto-scaling

### Step 8.1: Configure HPA (Horizontal Pod Autoscaling)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: staynest-hpa
  namespace: staynest
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: staynest-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Phase 9: Backup & Disaster Recovery

### Step 9.1: MongoDB Atlas Backups
- Already configured in MongoDB Atlas
- Automated daily snapshots
- Point-in-time recovery

### Step 9.2: Kubernetes Backup
```powershell
# Install Velero for cluster backups
helm repo add vmware-tanzu https://helm.releases.vmware.com
helm install velero vmware-tanzu/velero --namespace velero --create-namespace
```

---

## Summary: What You'll Have

✅ **Production-Ready Stack:**
- Docker containerization
- AWS EKS Kubernetes cluster
- CI/CD with GitHub Actions + Jenkins
- Auto-scaling capabilities
- SSL/TLS certificates
- Prometheus + Grafana monitoring
- Disaster recovery & backups

✅ **CV Booster Skills:**
- Kubernetes orchestration
- AWS cloud services
- CI/CD pipeline automation
- Infrastructure monitoring
- DevOps best practices

---

## Cost Estimate (AWS Free Tier)
- EKS Cluster: ~$73/month
- EC2 Nodes (2): ~$40/month
- ECR: ~$0.10/GB stored
- **Free Tier covers: 750 hours of t2.micro, S3, CloudWatch**

**Total Monthly Cost: ~$115 (can be reduced with optimizations)**

---

## Next Steps
1. Set up AWS account & EKS cluster (Step 1)
2. Containerize and push to ECR (Step 2)
3. Deploy to Kubernetes (Step 3)
4. Set up GitHub Actions (Step 4)
5. Configure monitoring (Step 5)

Ready to start? Let me know which phase you want to begin with! 🚀
