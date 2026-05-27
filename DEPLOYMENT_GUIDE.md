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

## Phase 10: Automated AWS Stopped-Service S3 & EBS Snapshotting

Workloads are frequently stopped or scaled down (e.g., stopping EC2 instances manually, Spot Interruption events, or nightly shut-downs to save costs). Without active automated hooks, temporary logs, dynamic configuration tweaks, and uncommitted database files can be lost, and EBS drives risk corruption. 

We resolve this with a multi-layered automation system:
1. **S3 Native Version Snapshots**: Continuous file history tracking with automatic transition of old backups to cold storage (Glacier) to keep costs near zero.
2. **Serverless EBS Volume Snapshotting**: An EventBridge rule that detects when compute nodes transition to `stopping` or `stopped` states, triggering a Lambda to execute crash-consistent disk backups.
3. **Local EC2 Graceful Shutdown S3 Sync Hook**: A systemd hook daemon that intercept the OS shutdown process, delays power-down, and tarballs configurations, environment files, and active container logs, uploading them safely to S3.

---

### Step 10.1: Configure S3 Object Versioning & Lifecycle Rules

Enabling S3 versioning creates an immutable point-in-time snapshot log for every file in your bucket (`staynest-media-028969191757`). To apply cost-optimized rules (pruning and cold-storage transitions):

```powershell
# 1. Enable Object Versioning on the bucket
aws s3api put-bucket-versioning `
  --bucket staynest-media-028969191757 `
  --versioning-configuration Status=Enabled

# 2. Apply our premium lifecycle policy (Glacier transition + old version pruning)
aws s3api put-bucket-lifecycle-configuration `
  --bucket staynest-media-028969191757 `
  --lifecycle-configuration file://aws/s3_versioning_policy.json
```

---

### Step 10.2: Deploy EventBridge + EBS Snapshot Lambda Stack

We package the event handlers, IAM roles, and Lambdas together in a one-click AWS CloudFormation stack.

#### Deployment via AWS CLI:
```powershell
aws cloudformation create-stack `
  --stack-name StayNest-Backup-Automation-Stack `
  --template-body file://aws/cloudformation-template.yaml `
  --capabilities CAPABILITY_NAMED_IAM `
  --parameters ParameterKey=EnvironmentName,ParameterValue=Production
```

#### Verification:
1. Go to the **CloudFormation** console and verify the `StayNest-Backup-Automation-Stack` creates successfully.
2. Once the stack is green, navigate to **Lambda** to verify `StayNest-Production-EBSBackupHandler` is ready.
3. Stop your EC2 instance (`staynest-production` or node instance).
4. Go to **EC2 Dashboard -> Snapshots**; you will see new EBS volume snapshots automatically spinning up, tagged with `TriggerEvent: EC2-STOPPING` and `BackupSystem: StayNest-Backup-Automation`.

---

### Step 10.3: Install the Local EC2 Shutdown S3 Sync Hook

To capture files on the server itself (environment keys, Nginx configurations, and application logs) right before the EC2 host stops:

```bash
# Connect to your EC2 instance via SSH
ssh -i "your-key.pem" ubuntu@ec2-3-234-224-71.compute-1.amazonaws.com

# 1. Create directory structure if needed
mkdir -p /home/ubuntu/cloudproject/StayNest/scripts

# 2. Copy staynest-shutdown-backup.sh to the target directory
# (Or write/rsync it directly)

# 3. Make the script executable
chmod +x /home/ubuntu/cloudproject/StayNest/scripts/staynest-shutdown-backup.sh

# 4. Copy staynest-backup.service to the systemd folder
sudo cp /home/ubuntu/cloudproject/StayNest/scripts/staynest-backup.service /etc/systemd/system/staynest-backup.service

# 5. Reload systemd daemon to register the new backup hook
sudo systemctl daemon-reload

# 6. Enable the backup daemon to run on startup
sudo systemctl enable staynest-backup.service

# 7. Start the service (runs a dummy command on boot to mark it active)
sudo systemctl start staynest-backup.service

# 8. Check service status (should say active/running)
sudo systemctl status staynest-backup.service
```

When you trigger a stop (`sudo poweroff` or AWS console action), systemd will wait until `/home/ubuntu/cloudproject/StayNest/scripts/staynest-shutdown-backup.sh` completes its backup upload to S3 before actually cutting the power!

---

### Step 10.4: Backup Verification & Disaster Recovery Guide

#### Scenario A: The EC2 instance was corrupted/deleted, and you need to restore files from the S3 Shutdown Snapshot.
1. Provision a new Ubuntu 22.04 LTS instance.
2. Ensure the AWS CLI is configured with the instance profile role.
3. Download the latest backup from S3:
   ```bash
   aws s3 cp s3://staynest-media-028969191757/snapshots/ $(aws s3 ls s3://staynest-media-028969191757/snapshots/ | sort | tail -n 1 | awk '{print $4}') .
   ```
4. Extract the backup tarball to restore your `.env` keys, Nginx files, and logs:
   ```bash
   tar -xzf staynest-state-backup-*.tar.gz -C /home/ubuntu/cloudproject/StayNest/
   ```

#### Scenario B: Recovering an EBS Volume from an Automated Stopped-State Snapshot.
1. In the AWS console, navigate to **EC2 -> Elastic Block Store -> Snapshots**.
2. Select your stopping-triggered snapshot (e.g., `staynest-production-sda1-stop-backup`).
3. Click **Actions -> Create Volume from Snapshot**. Select the matching availability zone.
4. Go to **Instances**, select the stopped instance, detach the broken volume, and attach this newly created volume as the root device (usually `/dev/sda1` or `/dev/xvda`).
5. Restart the instance. Your OS and files are restored precisely to the moment the service was shut down!

---

## Cost Estimate (AWS Free Tier)
- EKS Cluster: ~$73/month
- EC2 Nodes (2): ~$40/month
- ECR: ~$0.10/GB stored
- S3 Bucket Storage: Standard costs cover active images.
- **S3 Versioning / Lifecycle Backups**: ~$0.004/GB in S3 Glacier Deep Archive (Extreme Cost-Savings).
- **Automated EBS Snapshots**: ~$0.05/GB of snapshot data stored (incremental changes only).
- **Lambda & EventBridge Automation**: 100% Free Tier (1 Million Lambda requests free per month).

**Total Monthly Cost: ~$115 - $118 (highly optimized for professional recovery protection)**

---

## Next Steps
1. Set up AWS account & EKS cluster (Step 1)
2. Containerize and push to ECR (Step 2)
3. Deploy to Kubernetes (Step 3)
4. Set up GitHub Actions (Step 4)
5. Configure monitoring (Step 5)
6. **Set up Automated Stopped-Service S3 & EBS Snapshotting (Step 10)**

Ready to start? Let me know which phase you want to begin with! 🚀

