import json
import logging
import datetime
import boto3

# Initialize logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
ec2_client = boto3.client('ec2')

def lambda_handler(event, context):
    """
    AWS Lambda handler triggered by EventBridge on EC2 Instance State-change Notification
    (for stopping or stopped state transitions).
    """
    logger.info("Received event: %s", json.dumps(event))
    
    # Extract details from the EventBridge event
    detail = event.get('detail', {})
    instance_id = detail.get('instance-id')
    state = detail.get('state')
    region = event.get('region')
    
    if not instance_id:
        logger.error("No Instance ID found in the event payload.")
        return {
            'statusCode': 400,
            'body': 'Error: Missing instance-id in event detail'
        }
        
    logger.info("Processing backup trigger for EC2 Instance: %s (State: %s, Region: %s)", 
                instance_id, state, region)
    
    try:
        # Describe the instance to verify its metadata and find attached EBS volumes
        response = ec2_client.describe_instances(InstanceIds=[instance_id])
        reservations = response.get('Reservations', [])
        if not reservations:
            logger.error("EC2 Instance %s not found.", instance_id)
            return {
                'statusCode': 404,
                'body': f"Error: EC2 Instance {instance_id} not found"
            }
            
        instance_details = reservations[0].get('Instances', [])[0]
        block_device_mappings = instance_details.get('BlockDeviceMappings', [])
        
        # Look for the instance name tag if it exists
        instance_name = "UnnamedInstance"
        for tag in instance_details.get('Tags', []):
            if tag.get('Key') == 'Name':
                instance_name = tag.get('Value')
                break
                
        if not block_device_mappings:
            logger.info("No EBS volumes attached to instance %s. Nothing to snapshot.", instance_id)
            return {
                'statusCode': 200,
                'body': 'No volumes attached'
            }
            
        logger.info("Found %d attached EBS volume(s) for instance %s (%s)", 
                    len(block_device_mappings), instance_id, instance_name)
        
        created_snapshots = []
        timestamp = datetime.datetime.utcnow().strftime('%Y-%m-%d-%H%M%S')
        
        # Iterate over all block devices and trigger snapshots
        for device in block_device_mappings:
            volume_id = device.get('Ebs', {}).get('VolumeId')
            device_name = device.get('DeviceName')
            
            if not volume_id:
                continue
                
            snapshot_description = (
                f"Automated snapshot of volume {volume_id} ({device_name}) "
                f"attached to EC2 Instance {instance_id} ({instance_name}) "
                f"triggered on instance {state} state at {timestamp} UTC."
            )
            
            logger.info("Creating snapshot for volume %s (%s)...", volume_id, device_name)
            
            # Create snapshot
            snapshot = ec2_client.create_snapshot(
                VolumeId=volume_id,
                Description=snapshot_description,
                TagSpecifications=[
                    {
                        'ResourceType': 'snapshot',
                        'Tags': [
                            {'Key': 'Name', 'Value': f"{instance_name}-{device_name}-stop-backup"},
                            {'Key': 'InstanceId', 'Value': instance_id},
                            {'Key': 'InstanceName', 'Value': instance_name},
                            {'Key': 'VolumeId', 'Value': volume_id},
                            {'Key': 'DeviceName', 'Value': device_name},
                            {'Key': 'TriggerEvent', 'Value': f"EC2-{state.upper()}"},
                            {'Key': 'BackupSystem', 'Value': 'StayNest-Backup-Automation'},
                            {'Key': 'Timestamp', 'Value': timestamp}
                        ]
                    }
                ]
            )
            
            snapshot_id = snapshot.get('SnapshotId')
            logger.info("Successfully initiated snapshot %s for volume %s", snapshot_id, volume_id)
            created_snapshots.append({
                'volume_id': volume_id,
                'snapshot_id': snapshot_id,
                'device_name': device_name
            })
            
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f"Successfully initiated {len(created_snapshots)} snapshot(s).",
                'instance_id': instance_id,
                'instance_name': instance_name,
                'snapshots': created_snapshots
            })
        }
        
    except Exception as e:
        logger.exception("Failed to create EBS snapshots for instance %s", instance_id)
        return {
            'statusCode': 500,
            'body': f"Error: Failed to create snapshots. Exception details: {str(e)}"
        }
