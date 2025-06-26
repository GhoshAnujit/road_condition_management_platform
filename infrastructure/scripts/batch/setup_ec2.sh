#!/bin/bash
# Road Metrics AI - EC2 Batch Processing Setup Script
# This script sets up the EC2 instance for batch processing

# Exit on error
set -e

echo "Starting Road Metrics AI batch processor setup..."

# Update system packages
echo "Updating system packages..."
sudo yum update -y

# Install Python and dependencies
echo "Installing Python and dependencies..."
sudo yum install -y python3 python3-pip git awscli jq

# Install required Python packages
echo "Installing Python packages..."
sudo pip3 install boto3 pandas sqlalchemy psycopg2-binary requests schedule

# Create directories
echo "Creating application directories..."
sudo mkdir -p /opt/road-metrics/batch
sudo mkdir -p /opt/road-metrics/logs
sudo mkdir -p /opt/road-metrics/config

# Set permissions
sudo chown -R ec2-user:ec2-user /opt/road-metrics

# Copy batch scripts
echo "Setting up batch processing scripts..."
cp data_aggregation.py /opt/road-metrics/batch/
chmod +x /opt/road-metrics/batch/data_aggregation.py

# Create environment file for database connection
echo "Creating environment configuration..."
cat > /opt/road-metrics/config/batch.env << EOF
# Database configuration
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=roadmetricsdb
DB_USER=batch_user
DB_PASSWORD=your_secure_password

# AWS configuration
S3_BUCKET=road-metrics-data
AWS_REGION=us-east-1
EOF

# Set up cron job for daily processing
echo "Setting up cron job..."
(crontab -l 2>/dev/null || echo "") | grep -v "data_aggregation.py" | cat - > /tmp/crontab.tmp
echo "0 2 * * * cd /opt/road-metrics/batch && source ../config/batch.env && python3 data_aggregation.py >> /opt/road-metrics/logs/batch.log 2>&1" >> /tmp/crontab.tmp
crontab /tmp/crontab.tmp
rm /tmp/crontab.tmp

# Create log file
echo "Setting up logging..."
touch /opt/road-metrics/logs/batch.log
chmod 644 /opt/road-metrics/logs/batch.log

# Set up CloudWatch for log monitoring
echo "Setting up CloudWatch agent..."
sudo yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
cat > /tmp/cloudwatch-config.json << EOF
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/opt/road-metrics/logs/batch.log",
            "log_group_name": "road-metrics-batch-logs",
            "log_stream_name": "{instance_id}-batch",
            "retention_in_days": 14
          }
        ]
      }
    }
  },
  "metrics": {
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60,
        "totalcpu": true
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["disk_used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      }
    }
  }
}
EOF

sudo mv /tmp/cloudwatch-config.json /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
sudo amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

echo "Setup complete! Road Metrics AI batch processor is ready."
echo "Don't forget to update the database credentials in /opt/road-metrics/config/batch.env" 