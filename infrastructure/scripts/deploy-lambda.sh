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

echo "Deploying to stage: $STAGE in region: $REGION"

# Move to the backend directory
cd "$(dirname "$0")/../../backend"

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt --target ./package

# Create a deployment package
echo "Creating deployment package..."
mkdir -p package
cp -r app package/
cp main.py package/
cp requirements.txt package/

# Move to package directory
cd package

# Create a zip file
echo "Creating zip file..."
zip -r ../deployment.zip .

# Move back to backend directory
cd ..

# Deploy using AWS CLI
echo "Deploying Lambda functions..."
aws lambda update-function-code \
  --function-name "roadmetrics-api-$STAGE" \
  --zip-file fileb://deployment.zip \
  --region "$REGION"

# Clean up
echo "Cleaning up..."
rm -rf package
rm deployment.zip

echo "Deployment completed successfully!" 