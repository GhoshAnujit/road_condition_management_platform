#!/bin/bash

# Exit on any error
set -e

# Default values
STAGE="dev"
REGION="us-east-1"

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --stage)
      STAGE="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

BUCKET_NAME="roadmetrics-frontend-$STAGE"

echo "Deploying frontend to S3 bucket: $BUCKET_NAME in region: $REGION"

# Move to the frontend directory
cd "$(dirname "$0")/../../frontend"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building frontend application..."
npm run build

# Deploy to S3
echo "Deploying to S3..."
aws s3 sync build/ "s3://$BUCKET_NAME" \
  --delete \
  --region "$REGION"

# Invalidate CloudFront cache if needed
if [ "$STAGE" == "prod" ]; then
  echo "Invalidating CloudFront cache..."
  DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[0]=='roadmetrics.ai'].Id" --output text --region "$REGION")
  
  if [ -n "$DISTRIBUTION_ID" ]; then
    aws cloudfront create-invalidation \
      --distribution-id "$DISTRIBUTION_ID" \
      --paths "/*" \
      --region "$REGION"
  else
    echo "CloudFront distribution not found. Skipping cache invalidation."
  fi
fi

echo "Frontend deployment completed successfully!" 