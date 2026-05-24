# 🏡 StayNest — Full-Stack Production-Hardened Stay & Review Platform

StayNest is a high-performance, full-stack stay listing and booking application built with **Node.js, Express, EJS, and MongoDB Atlas**. 

The platform has been hardened for cloud-scale deployment, featuring a multi-replica automated **AWS EKS Kubernetes cluster**, an optimized **AWS EC2 + S3 Single-Instance deployment**, and a secure, testing-gated **CI/CD pipeline** with both **GitHub Actions and Jenkins**.

---

## 🌐 Live Production Links (Publicly Verified)

Anyone in the world can access the production site directly via the following standard HTTP links:

* 🚀 **[Live StayNest Web App](http://3.234.224.71/listings)**
* 🌎 **[Public AWS DNS Endpoint](http://ec2-3-234-224-71.compute-1.amazonaws.com/listings)**

---

## 🏗️ Cloud & DevOps Infrastructure Architecture

The deployment architecture is designed for zero-downtime, horizontal scaling, and high-availability session persistence:

```text
       Developer Push to GitHub (main branch)
                       │
                       ▼
       ┌──────────────────────────────┐
       │   CI/CD Automated Pipelines  │
       │   (GitHub Actions + Jenkins)  │
       └───────────────┬──────────────┘
                       │
                       ▼
         Run Lint & Jest Integration Tests
                       │
                       ▼
       Build Production-Grade Docker Image
                       │
                       ▼
        Push to AWS ECR Container Registry
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌──────────────────┐       ┌───────────────────────────┐
│  AWS EKS Cluster │       │  AWS EC2 + S3 Deployment   │
│  (Multi-Replica) │       │   (Free-Tier Optimized)   │
└────────┬─────────┘       └─────────────┬─────────────┘
         │                               │
         │ Ingress ALB                   │ Nginx Reverse Proxy
         ▼                               ▼
    HTTP Port 80                    HTTP Port 80
         │                               │
         └─────────────┬─────────────────┘
                       │
                       ▼
         ┌───────────────────────────┐
         │       MongoDB Atlas       │
         │  (Database & Shared store)│
         └───────────────────────────┘
```

### ⚡ 1. High-Availability Shared Session Persistence
* **The Problem**: In multi-replica Kubernetes environments, in-memory sessions cause users to be logged out on redirects when subsequent requests hit different pods.
* **The Solution**: Integrated **`connect-mongo`** to store Express sessions centrally in your MongoDB Atlas cluster. Sessions are fully shared across all active container replicas, resolving sticky session bugs without the overhead of a dedicated Redis cluster.

### ☸️ 2. AWS EKS Kubernetes Orchestration (Consolidated)
* Unified, production-ready manifests reside in the `k8s/` folder:
  * **`deployment.yaml`**: Multi-replica pod specification utilizing `RollingUpdate` deployment strategies for **zero-downtime upgrades** alongside Prometheus scraping annotations.
  * **`service.yaml`**: Exposed internally via `ClusterIP` services.
  * **`ingress.yaml`**: Standard routing block mapping TLS secrets for secure HTTP/HTTPS ingress routing.
  * **`hpa.yaml`**: Horizontal Pod Autoscaler targeting `staynest` based on CPU (60%) and Memory (70%) utilization thresholds.

### 🐧 3. AWS EC2 + S3 Single-Instance Deployment (Free-Tier)
To provide a fast, cost-efficient, publicly accessible endpoint, we provisioned:
* **Amazon S3 Asset Bucket (`staynest-media-028969191757`)**: Configured with public read permissions to securely store and render listing images.
* **Amazon EC2 Security Group (`staynest-production-sg`)**: Opened port `80` (HTTP web) and port `22` (SSH management) to the public.
* **Ubuntu 22.04 LTS Instance (`t3.micro`)**: Bootstrapped using an automated `user-data` script that:
  * Installs **Docker** and **Nginx**.
  * Authenticates securely with **AWS ECR** using an **IAM Instance Profile role** (`staynest-ec2-role`).
  * Pulls the latest production image and runs it locally on port `3000`.
  * Configures Nginx as a reverse proxy on port `80` to map seamlessly to port `3000`.

### 🛡️ 4. CI/CD Testing Gates & Security Protocols
* **Automated Integration Tests**: Built with **Jest and Supertest** (located in `tests/app.test.js`), verifying endpoint health (`GET /healthz`), page redirects, and 404 error rendering.
* **Jenkins Pipeline (`Jenkinsfile`)**: Implements a complete multi-stage pipeline: Checkout, Dependency Installation, Lint & Syntax check, **Test Gate**, Docker Build, ECR/Registry Push, and Rolling Update patch.
* **GitHub Actions (`.github/workflows/deploy.yml`)**: Automatically triggers upon push to the `main` branch, running automated tests, containerizing the app, pushing to ECR, and patching the running EKS deployment.
* **Runtime Optimization**: Built using Node.js 24 environment parameters on the runner, suppressing deprecation warnings.

---

## 🎨 Application Features

* **Multi-Provider Authentication**: Email/Password, Google OAuth, and Phone-Number OTP verify login flows (built on Twilio Verify).
* **Robust JWT API**: Browser cookie sessions alongside a standard stateless JWT Bearer Token validation endpoint (`POST /api/auth/login`, `GET /api/auth/me`).
* **Interactive Dashboards**: Role-based onboarding, a dedicated Host view for managing listing spaces, booking details, and guest status.
* **Secure Reviews**: Ownership-gated creation and deletion, complete with server-side Joi validation schemas.
* **Centralized Production Logging**: Structured JSON logger middleware logs original request IP, URI, response status, duration, and user agent to standard output, making it ready for Fluentd/ELK/CloudWatch indexing.

---

## 🚀 Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file at the root of the project:
```env
MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/staynest
SESSION_SECRET=a-very-long-production-grade-random-secret
PORT=3000
NODE_ENV=development
APP_BASE_URL=http://localhost:3000

# Optional Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=your-email@gmail.com
```

### 3. Run Automated Tests
```bash
npm run test
```

### 4. Start Development Server
```bash
npm run dev
```

---

## 📜 Key NPM Scripts

* `npm start`: Starts the production application (`node app.js`).
* `npm run dev`: Runs the application in watch-mode (`node --watch app.js`).
* `npm run test`: Executes the Jest automated integration test suite.
* `npm run check`: Runs a syntax check on files before committing.
