pipeline {
    agent any

    environment {
        APP_NAME = 'staynest'
        IMAGE_REPO = 'your-dockerhub-username/staynest'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        K8S_NAMESPACE = 'staynest'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Validate') {
            steps {
                sh 'npm run check'
            }
        }

        stage('Build Image') {
            steps {
                sh 'docker build -t $IMAGE_REPO:$IMAGE_TAG -t $IMAGE_REPO:latest .'
            }
        }

        stage('Push Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                    sh 'docker push $IMAGE_REPO:$IMAGE_TAG'
                    sh 'docker push $IMAGE_REPO:latest'
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-staynest', variable: 'KUBECONFIG_FILE')]) {
                    sh 'KUBECONFIG=$KUBECONFIG_FILE kubectl apply -f k8s/'
                    sh 'KUBECONFIG=$KUBECONFIG_FILE kubectl -n $K8S_NAMESPACE set image deployment/$APP_NAME $APP_NAME=$IMAGE_REPO:$IMAGE_TAG'
                    sh 'KUBECONFIG=$KUBECONFIG_FILE kubectl -n $K8S_NAMESPACE rollout status deployment/$APP_NAME'
                }
            }
        }
    }
}
