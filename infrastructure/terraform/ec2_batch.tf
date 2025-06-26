# EC2 Batch Processing Infrastructure for Road Metrics AI
# This file defines the EC2 instance and related resources for running batch processing jobs

# Security group for the EC2 instance
resource "aws_security_group" "batch_processor_sg" {
  name        = "road-metrics-batch-processor-sg"
  description = "Security group for Road Metrics AI batch processing"

  # SSH access from allowed IPs
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # In production, restrict to specific IPs
  }

  # Outbound internet access
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "road-metrics-batch-processor-sg"
    Project = "RoadMetricsAI"
  }
}

# IAM role for EC2 instance
resource "aws_iam_role" "batch_processor_role" {
  name = "road-metrics-batch-processor-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "road-metrics-batch-processor-role"
    Project = "RoadMetricsAI"
  }
}

# IAM policy for accessing RDS and S3
resource "aws_iam_policy" "batch_processor_policy" {
  name        = "road-metrics-batch-processor-policy"
  description = "Policy for Road Metrics AI batch processing"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "rds:Connect",
          "rds:Query"
        ]
        Effect   = "Allow"
        Resource = "*" # In production, restrict to specific RDS ARN
      },
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          "arn:aws:s3:::road-metrics-data/*",
          "arn:aws:s3:::road-metrics-data"
        ]
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "batch_processor_policy_attachment" {
  role       = aws_iam_role.batch_processor_role.name
  policy_arn = aws_iam_policy.batch_processor_policy.arn
}

# Instance profile
resource "aws_iam_instance_profile" "batch_processor_profile" {
  name = "road-metrics-batch-processor-profile"
  role = aws_iam_role.batch_processor_role.name
}

# EC2 instance for batch processing
resource "aws_instance" "batch_processor" {
  ami                    = "ami-0c55b159cbfafe1f0" # Amazon Linux 2 AMI (adjust for your region)
  instance_type          = "t3.medium"             # Adjust based on processing needs
  key_name               = var.key_name            # SSH key pair name
  vpc_security_group_ids = [aws_security_group.batch_processor_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.batch_processor_profile.name

  root_block_device {
    volume_size = 30 # GB
    volume_type = "gp3"
  }

  user_data = <<-EOF
    #!/bin/bash
    # Update system packages
    yum update -y
    
    # Install Python and pip
    yum install -y python3 python3-pip git
    
    # Install required Python packages
    pip3 install boto3 pandas sqlalchemy psycopg2-binary requests schedule
    
    # Create directory for batch scripts
    mkdir -p /opt/road-metrics/batch
    
    # Clone repository (if using Git)
    # git clone https://github.com/yourusername/road-metrics-ai.git /opt/road-metrics/repo
    
    # Set up cron job for daily processing
    echo "0 2 * * * python3 /opt/road-metrics/batch/data_aggregation.py >> /var/log/road-metrics-batch.log 2>&1" | crontab -
    
    # Create log file
    touch /var/log/road-metrics-batch.log
    chmod 644 /var/log/road-metrics-batch.log
  EOF

  tags = {
    Name = "road-metrics-batch-processor"
    Project = "RoadMetricsAI"
  }
}

# CloudWatch alarm for high CPU utilization
resource "aws_cloudwatch_metric_alarm" "batch_processor_cpu_alarm" {
  alarm_name          = "road-metrics-batch-processor-cpu-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization"
  
  dimensions = {
    InstanceId = aws_instance.batch_processor.id
  }
}

# Output the EC2 instance public IP
output "batch_processor_public_ip" {
  value = aws_instance.batch_processor.public_ip
} 