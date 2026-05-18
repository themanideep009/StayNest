#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  deploy-all.sh — Bootstrap all K8s resources in the correct order
#  Usage:  bash k8s/deploy-all.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

NAMESPACE="staynest"

echo "==> Applying namespace..."
kubectl apply -f k8s/namespace.yaml

echo "==> Applying ConfigMap..."
kubectl apply -f k8s/configmap.yaml -n "$NAMESPACE"

echo "==> Applying Secret..."
kubectl apply -f k8s/secret.yaml -n "$NAMESPACE"

echo "==> Applying Deployment..."
kubectl apply -f k8s/deployment.yaml -n "$NAMESPACE"

echo "==> Applying Service..."
kubectl apply -f k8s/service.yaml -n "$NAMESPACE"

echo "==> Applying Ingress..."
kubectl apply -f k8s/ingress.yaml -n "$NAMESPACE"

echo "==> Applying HPA..."
kubectl apply -f k8s/hpa.yaml -n "$NAMESPACE"

echo "==> Waiting for rollout..."
kubectl rollout status deployment/staynest-app -n "$NAMESPACE" --timeout=120s

echo "==> Done. Pods:"
kubectl get pods -n "$NAMESPACE"
