# StayNest Cloud Architecture

## Target Architecture

```text
Developer
   |
   | git push
   v
Jenkins CI/CD
   |
   | npm ci + node syntax check
   | docker build
   | docker push
   v
Container Registry
   |
   | kubectl rollout
   v
Kubernetes Cluster
   |
   +-- Ingress Controller
   |      |
   |      v
   +-- Service: staynest-service
          |
          v
      Deployment: staynest
      +-- Pod 1: Node.js Express app
      +-- Pod 2: Node.js Express app
          |
          v
      MongoDB Atlas or managed MongoDB
```

## Components

- **Docker** packages the Express/EJS app into a portable image.
- **Jenkins** runs CI/CD: checkout, install dependencies, validate the app, build the image, push to registry, and deploy to Kubernetes.
- **Kubernetes** runs the app with 2 replicas, service discovery, ingress routing, health probes, and autoscaling.
- **MongoDB** should be managed outside the app pods, preferably MongoDB Atlas or a managed cloud database.
- **Secrets** store sensitive values such as `MONGO_URL`, `SESSION_SECRET`, `JWT_SECRET`, OAuth, SMTP, and Twilio credentials.

## Deployment Flow

1. Developer pushes code to Git.
2. Jenkins pipeline starts.
3. Jenkins runs `npm ci` and `npm run check`.
4. Jenkins builds `your-dockerhub-username/staynest:<build-number>`.
5. Jenkins pushes the image to Docker Hub or another registry.
6. Jenkins applies Kubernetes manifests.
7. Jenkins updates the Deployment image.
8. Kubernetes performs a rolling deployment.
9. Ingress exposes the app at `https://staynest.example.com`.

## Required Jenkins Credentials

- `dockerhub-credentials`: username/password for your container registry.
- `kubeconfig-staynest`: kubeconfig file credential with access to the target cluster.

## Setup Steps

1. Update `Jenkinsfile`:
   - Replace `your-dockerhub-username/staynest` with your real registry image path.

2. Update Kubernetes config:
   - Replace `staynest.example.com` in `k8s/01-configmap.yaml` and `k8s/05-ingress.yaml`.

3. Create the real secret:
   - Copy `k8s/02-secret.yaml.example` to `k8s/02-secret.yaml`.
   - Fill in real values.
   - Do not commit real secrets.
   - Apply it once before running the Jenkins deployment stage:

```powershell
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/02-secret.yaml
```

4. Deploy:

```powershell
kubectl apply -f k8s/
```

## Production Notes

- Use HTTPS at the ingress layer with cert-manager or your cloud load balancer.
- Use MongoDB Atlas or another managed MongoDB service for backups and availability.
- Keep at least 2 replicas for rolling deployments and basic resilience.
- Add centralized logs and metrics, such as Prometheus/Grafana or your cloud provider's monitoring stack.
- For session-heavy production traffic, consider moving Express sessions to Redis instead of in-memory sessions.
