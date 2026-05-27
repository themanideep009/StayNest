#!/usr/bin/env bash
# ==============================================================================
# StayNest - Automated Shutdown S3 Backup Script
# This script is intended to run locally on the EC2 instance right before shutdown
# or termination. It packages configurations, environment files, and logs, 
# then uploads them directly to the S3 bucket.
# ==============================================================================

set -euo pipefail

# --- Configuration ---
DEFAULT_S3_BUCKET="staynest-media-028969191757"
S3_BUCKET="${1:-$DEFAULT_S3_BUCKET}"
BACKUP_DIR="/tmp/staynest-backup"
APP_ROOT="/home/ubuntu/cloudproject/StayNest" # Standard path on target EC2
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="staynest-state-backup-${TIMESTAMP}.tar.gz"
LOG_FILE="/var/log/staynest-backup.log"

# --- Output Helper Functions ---
log_info()  { echo -e "\e[32m[INFO] [$(date +'%Y-%m-%d %H:%M:%S')]\e[0m $1" | tee -a "$LOG_FILE"; }
log_warn()  { echo -e "\e[33m[WARN] [$(date +'%Y-%m-%d %H:%M:%S')]\e[0m $1" | tee -a "$LOG_FILE"; }
log_error() { echo -e "\e[31m[ERROR] [$(date +'%Y-%m-%d %H:%M:%S')]\e[0m $1" | tee -a "$LOG_FILE" >&2; }

# --- Cleanup Trap ---
cleanup() {
    log_info "Cleaning up temporary directories..."
    rm -rf "$BACKUP_DIR"
}
trap cleanup EXIT

# --- Main Script ---
log_info "=== StayNest Automated Service Shutdown Backup Initiated ==="

# 1. Ensure required binaries are available
for cmd in aws tar gzip; do
    if ! command -v "$cmd" &> /dev/null; then
        log_error "Required tool '$cmd' is not installed or not in PATH. Aborting backup."
        exit 1
    fi
done

# 2. Setup backup directories
log_info "Creating temporary backup directory at $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR/configs"
mkdir -p "$BACKUP_DIR/logs"

# 3. Gather local application configuration and secrets
if [ -d "$APP_ROOT" ]; then
    log_info "Found StayNest project directory at $APP_ROOT. Copying configuration files..."
    # Copy environment variables and configurations
    [ -f "$APP_ROOT/.env" ] && cp "$APP_ROOT/.env" "$BACKUP_DIR/configs/env.production"
    [ -f "$APP_ROOT/docker-compose.yml" ] && cp "$APP_ROOT/docker-compose.yml" "$BACKUP_DIR/configs/"
    [ -d "$APP_ROOT/k8s" ] && cp -r "$APP_ROOT/k8s" "$BACKUP_DIR/configs/k8s"
else
    log_warn "StayNest project directory not found at $APP_ROOT. Skipping app config backup."
fi

# 4. Gather system level configurations (Nginx reverse proxy, etc.)
if [ -d "/etc/nginx" ]; then
    log_info "Backing up Nginx reverse proxy configurations..."
    mkdir -p "$BACKUP_DIR/configs/nginx"
    [ -d "/etc/nginx/sites-available" ] && cp -r "/etc/nginx/sites-available" "$BACKUP_DIR/configs/nginx/"
    [ -d "/etc/nginx/sites-enabled" ] && cp -r "/etc/nginx/sites-enabled" "$BACKUP_DIR/configs/nginx/"
    [ -f "/etc/nginx/nginx.conf" ] && cp "/etc/nginx/nginx.conf" "$BACKUP_DIR/configs/nginx/"
fi

# 5. Gather logs (Nginx logs, app logs, and PM2/Docker logs if available)
log_info "Collecting logs..."
[ -d "/var/log/nginx" ] && cp -r "/var/log/nginx" "$BACKUP_DIR/logs/nginx-logs"

# Backup docker containers logs if docker is active
if command -v docker &> /dev/null; then
    log_info "Extracting logs from running Docker containers..."
    mkdir -p "$BACKUP_DIR/logs/docker"
    CONTAINERS=$(docker ps -a --format "{{.Names}}" || true)
    for container in $CONTAINERS; do
        docker logs "$container" &> "$BACKUP_DIR/logs/docker/${container}.log" || true
    done
fi

# 6. Compress gathered information
log_info "Packaging all backup files into $BACKUP_FILE..."
tar -czf "/tmp/$BACKUP_FILE" -C "$BACKUP_DIR" .

# 7. Upload to Amazon S3
log_info "Uploading snapshot archive to Amazon S3 bucket: s3://$S3_BUCKET/snapshots/..."
if aws s3 cp "/tmp/$BACKUP_FILE" "s3://$S3_BUCKET/snapshots/$BACKUP_FILE" --only-show-errors; then
    log_info "Backup successfully uploaded! Target: s3://$S3_BUCKET/snapshots/$BACKUP_FILE"
    
    # Tag the S3 object for lifecycle/audit
    log_info "Adding metadata tags to the S3 backup object..."
    aws s3api put-object-tagging \
        --bucket "$S3_BUCKET" \
        --key "snapshots/$BACKUP_FILE" \
        --tagging '{"TagSet": [{"Key": "BackupType", "Value": "ShutdownSnapshot"}, {"Key": "Service", "Value": "StayNest"}]}' \
        --only-show-errors
else
    log_error "Failed to upload backup tarball to S3. Please verify IAM role permissions and AWS network access."
    exit 2
fi

log_info "=== StayNest Automated Service Shutdown Backup Completed Successfully ==="
exit 0
