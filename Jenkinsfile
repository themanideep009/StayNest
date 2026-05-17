// ─────────────────────────────────────────────────────────────────────────────
//  Stayhub — CI/CD Pipeline
//  Stages:
//    1. Checkout
//    2. Install & Lint
//    3. Docker Build
//    4. Docker Push  → ECR
//    5. Deploy       → EKS (kubectl apply)
// ─────────────────────────────────────────────────────────────────────────────

pipeline {
    agent any

    // ── Tool versions (configure these in Jenkins Global Tool Configuration) ──
    tools {
        nodejs 'node-20'   // NodeJS installation named "node-20" in Jenkins
    }

    // ── Pipeline-wide environment ─────────────────────────────────────────────
    environment {
        // AWS settings — store these as Jenkins credentials / env vars
        AWS_REGION        = 'us-east-1'
        AWS_ACCOUNT_ID    = credentials('AWS_ACCOUNT_ID')          // Jenkins secret text
        ECR_REPO          = 'stayhub'
        IMAGE_TAG         = "${env.BUILD_NUMBER}"
        ECR_REGISTRY      = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        FULL_IMAGE        = "${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"
        LATEST_IMAGE      = "${ECR_REGISTRY}/${ECR_REPO}:latest"

        // EKS cluster name
        EKS_CLUSTER_NAME  = 'stayhub-cluster'

        // Kubernetes namespace
        K8S_NAMESPACE     = 'stayhub'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        // ── 1. Checkout ───────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                echo "Building commit: ${env.GIT_COMMIT}"
            }
        }

        // ── 2. Install & Syntax Check ─────────────────────────────────────────
        stage('Install & Check') {
            steps {
                sh 'node --version'
                sh 'npm ci --omit=dev'
                sh 'node --check app.js'
            }
        }

        // ── 3. Docker Build ───────────────────────────────────────────────────
        stage('Docker Build') {
            steps {
                sh """
                    docker build \
                        --tag ${FULL_IMAGE} \
                        --tag ${LATEST_IMAGE} \
                        --label git-commit=${env.GIT_COMMIT} \
                        .
                """
            }
        }

        // ── 4. Push to ECR ────────────────────────────────────────────────────
        stage('Push to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-ecr-credentials'   // Jenkins AWS credential ID
                ]]) {
                    sh """
                        aws ecr get-login-password --region ${AWS_REGION} \
                            | docker login --username AWS --password-stdin ${ECR_REGISTRY}

                        docker push ${FULL_IMAGE}
                        docker push ${LATEST_IMAGE}
                    """
                }
            }
        }

        // ── 5. Deploy to EKS ──────────────────────────────────────────────────
        stage('Deploy to EKS') {
            when {
                // Only deploy from main / master branch
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-ecr-credentials'
                ]]) {
                    sh """
                        # Update kubeconfig for EKS
                        aws eks update-kubeconfig \
                            --region ${AWS_REGION} \
                            --name ${EKS_CLUSTER_NAME}

                        # Substitute the image tag in the deployment manifest and apply
                        sed 's|IMAGE_PLACEHOLDER|${FULL_IMAGE}|g' k8s/deployment.yaml \
                            | kubectl apply -f - -n ${K8S_NAMESPACE}

                        # Apply the rest of the manifests
                        kubectl apply -f k8s/service.yaml        -n ${K8S_NAMESPACE}
                        kubectl apply -f k8s/ingress.yaml        -n ${K8S_NAMESPACE}
                        kubectl apply -f k8s/hpa.yaml            -n ${K8S_NAMESPACE}

                        # Wait for rollout to complete
                        kubectl rollout status deployment/stayhub-app \
                            -n ${K8S_NAMESPACE} --timeout=120s
                    """
                }
            }
        }
    }

    // ── Post actions ──────────────────────────────────────────────────────────
    post {
        always {
            // Clean up local Docker images to save disk space on the agent
            sh """
                docker rmi ${FULL_IMAGE}   || true
                docker rmi ${LATEST_IMAGE} || true
            """
        }
        success {
            echo "Pipeline succeeded — image ${FULL_IMAGE} deployed to EKS."
        }
        failure {
            echo "Pipeline failed. Check the logs above."
        }
    }
}
