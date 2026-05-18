pipeline {
    agent any

    environment {
        REGISTRY = credentials('docker-registry-url')
        REGISTRY_CREDENTIALS = credentials('docker-registry-credentials')
        IMAGE_NAME = "${REGISTRY}/staynest"
        IMAGE_TAG = "${BUILD_NUMBER}"
        KUBE_CONFIG = credentials('kubeconfig-staynest')
        KUBECONFIG = '/tmp/kubeconfig'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    echo "✓ Code checked out successfully"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    sh '''
                        echo "Installing npm dependencies..."
                        npm install
                        echo "✓ Dependencies installed"
                    '''
                }
            }
        }

        stage('Lint & Syntax Check') {
            steps {
                script {
                    sh '''
                        echo "Running syntax check..."
                        node --check app.js
                        node --check init/index.js
                        echo "✓ Syntax check passed"
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh '''
                        echo "Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
                        docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                        docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest
                        echo "✓ Docker image built successfully"
                    '''
                }
            }
        }

        stage('Push to Registry') {
            steps {
                script {
                    sh '''
                        echo "Logging into Docker registry..."
                        echo "${REGISTRY_CREDENTIALS_PSW}" | docker login -u "${REGISTRY_CREDENTIALS_USR}" --password-stdin ${REGISTRY}
                        
                        echo "Pushing image: ${IMAGE_NAME}:${IMAGE_TAG}"
                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${IMAGE_NAME}:latest
                        
                        echo "✓ Image pushed to registry"
                        docker logout ${REGISTRY}
                    '''
                }
            }
        }

        stage('Update Deployment') {
            steps {
                script {
                    sh '''
                        echo "Configuring kubectl with kubeconfig..."
                        cp ${KUBE_CONFIG} ${KUBECONFIG}
                        chmod 600 ${KUBECONFIG}
                        
                        echo "Updating deployment with new image..."
                        kubectl set image deployment/staynest staynest=${IMAGE_NAME}:${IMAGE_TAG} \
                            -n staynest \
                            --kubeconfig=${KUBECONFIG}
                        
                        echo "Waiting for rollout to complete..."
                        kubectl rollout status deployment/staynest -n staynest \
                            --kubeconfig=${KUBECONFIG} \
                            --timeout=5m
                        
                        echo "✓ Deployment updated successfully"
                    '''
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    sh '''
                        echo "Running health check..."
                        kubectl get pods -n staynest --kubeconfig=${KUBECONFIG}
                        
                        READY=$(kubectl get deployment staynest -n staynest \
                            -o jsonpath='{.status.conditions[?(@.type=="Available")].status}' \
                            --kubeconfig=${KUBECONFIG})
                        
                        if [ "${READY}" = "True" ]; then
                            echo "✓ All pods are healthy"
                        else
                            echo "! Health check: Some pods may not be ready"
                        fi
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                sh '''
                    echo "Cleaning up temporary files..."
                    rm -f ${KUBECONFIG} 2>/dev/null || true
                    docker logout ${REGISTRY} 2>/dev/null || true
                '''
            }
        }

        success {
            echo "✓ Pipeline completed successfully!"
            echo "Build #${BUILD_NUMBER} deployed to production"
        }

        failure {
            echo "✗ Pipeline failed. Check logs for details."
            echo "Build #${BUILD_NUMBER} encountered an error"
        }
    }
}
