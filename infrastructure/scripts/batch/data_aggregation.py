#!/usr/bin/env python3
"""
Road Metrics AI - Data Aggregation Batch Process

This script performs daily aggregation of road defect data, generating statistics
and reports that are stored in S3 and the database.

Usage:
    python data_aggregation.py [--date YYYY-MM-DD]

Dependencies:
    - pandas
    - sqlalchemy
    - boto3
    - psycopg2-binary
"""

import os
import sys
import logging
import argparse
from datetime import datetime, timedelta
import json
import pandas as pd
import boto3
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("/var/log/road-metrics-batch.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("data_aggregation")

# Configuration - In production, use AWS Secrets Manager or Parameter Store
DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": os.environ.get("DB_PORT", "5432"),
    "database": os.environ.get("DB_NAME", "roadmetricsdb"),
    "user": os.environ.get("DB_USER", "postgres"),
    "password": os.environ.get("DB_PASSWORD", "password")
}

S3_BUCKET = os.environ.get("S3_BUCKET", "road-metrics-data")

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Road Metrics AI Data Aggregation")
    parser.add_argument(
        "--date", 
        type=str,
        help="Date to process in YYYY-MM-DD format (default: yesterday)"
    )
    return parser.parse_args()

def get_db_connection():
    """Create a database connection."""
    try:
        connection_string = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
        engine = create_engine(connection_string)
        logger.info("Database connection established")
        return engine
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

def fetch_daily_defects(engine, date):
    """Fetch defects reported on the specified date."""
    try:
        query = f"""
        SELECT 
            id, defect_type, severity, latitude, longitude, 
            reported_at, notes, vehicle_id
        FROM 
            defects
        WHERE 
            DATE(reported_at) = '{date}'
        """
        df = pd.read_sql(query, engine)
        logger.info(f"Fetched {len(df)} defects for {date}")
        return df
    except SQLAlchemyError as e:
        logger.error(f"Database query error: {e}")
        raise

def generate_daily_statistics(df):
    """Generate statistics from daily defect data."""
    if df.empty:
        logger.warning("No data available for statistics generation")
        return {
            "total_count": 0,
            "by_type": {},
            "by_severity": {},
            "date": df.name
        }
    
    # Count by defect type
    type_counts = df['defect_type'].value_counts().to_dict()
    
    # Count by severity
    severity_counts = df['severity'].value_counts().to_dict()
    
    # Create statistics object
    stats = {
        "total_count": len(df),
        "by_type": type_counts,
        "by_severity": severity_counts,
        "date": df.name
    }
    
    logger.info(f"Generated statistics: {len(df)} total defects")
    return stats

def save_to_s3(data, bucket, key):
    """Save data to S3 bucket."""
    try:
        s3_client = boto3.client('s3')
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=json.dumps(data, default=str),
            ContentType='application/json'
        )
        logger.info(f"Saved data to S3: {bucket}/{key}")
    except Exception as e:
        logger.error(f"Failed to save to S3: {e}")
        raise

def update_statistics_table(engine, stats):
    """Update the statistics table in the database."""
    try:
        # Convert stats to JSON string for storage
        stats_json = json.dumps(stats, default=str)
        
        # Check if entry for this date already exists
        check_query = f"""
        SELECT id FROM defect_statistics WHERE date = '{stats['date']}'
        """
        with engine.connect() as conn:
            result = conn.execute(text(check_query))
            existing_id = result.scalar()
            
            if existing_id:
                # Update existing record
                update_query = f"""
                UPDATE defect_statistics 
                SET statistics = '{stats_json}'::jsonb, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = {existing_id}
                """
                conn.execute(text(update_query))
                logger.info(f"Updated statistics for {stats['date']}")
            else:
                # Insert new record
                insert_query = f"""
                INSERT INTO defect_statistics (date, statistics, created_at, updated_at)
                VALUES ('{stats['date']}', '{stats_json}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """
                conn.execute(text(insert_query))
                logger.info(f"Inserted new statistics for {stats['date']}")
            
            conn.commit()
    except Exception as e:
        logger.error(f"Failed to update statistics table: {e}")
        raise

def main():
    """Main execution function."""
    args = parse_args()
    
    # Determine the date to process
    if args.date:
        process_date = args.date
    else:
        yesterday = datetime.now() - timedelta(days=1)
        process_date = yesterday.strftime("%Y-%m-%d")
    
    logger.info(f"Starting data aggregation for {process_date}")
    
    try:
        # Connect to database
        engine = get_db_connection()
        
        # Fetch defects for the specified date
        df = fetch_daily_defects(engine, process_date)
        df.name = process_date  # Set name attribute for reference in other functions
        
        # Generate statistics
        stats = generate_daily_statistics(df)
        
        # Save to S3
        s3_key = f"statistics/daily/{process_date}.json"
        save_to_s3(stats, S3_BUCKET, s3_key)
        
        # Update database statistics table
        update_statistics_table(engine, stats)
        
        logger.info(f"Data aggregation completed successfully for {process_date}")
        return 0
    except Exception as e:
        logger.error(f"Data aggregation failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 