import logging
import json
from datetime import datetime, timedelta
from sqlalchemy import create_engine, func, and_
from sqlalchemy.orm import sessionmaker
import boto3

from app.core.config import settings
from app.db.session import Base
from app.models.defect import Defect, DefectType, SeverityLevel

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def get_db_session():
    """Create and return a database session."""
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()

def aggregate_defect_data():
    """
    Aggregate defect data for analytics.
    This could be expanded to generate reports, update dashboards, etc.
    """
    session = get_db_session()
    try:
        # Get data for the past 30 days
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        # Count defects by type
        defect_counts = {}
        for defect_type in DefectType:
            count = session.query(func.count(Defect.id)).filter(
                and_(
                    Defect.defect_type == defect_type,
                    Defect.reported_at >= thirty_days_ago
                )
            ).scalar()
            defect_counts[defect_type.value] = count
        
        # Get most severe areas (areas with critical defects)
        critical_areas = session.query(
            Defect.latitude, 
            Defect.longitude,
            func.count(Defect.id).label('defect_count')
        ).filter(
            and_(
                Defect.severity == SeverityLevel.CRITICAL,
                Defect.reported_at >= thirty_days_ago
            )
        ).group_by(
            Defect.latitude, 
            Defect.longitude
        ).order_by(
            func.count(Defect.id).desc()
        ).limit(10).all()
        
        # Format the results
        critical_areas_list = [
            {
                'latitude': area[0],
                'longitude': area[1],
                'defect_count': area[2]
            }
            for area in critical_areas
        ]
        
        # Create a summary report
        report = {
            'generated_at': datetime.now().isoformat(),
            'period': '30 days',
            'defect_counts': defect_counts,
            'critical_areas': critical_areas_list
        }
        
        # Store the report in S3
        s3 = boto3.client('s3', region_name=settings.AWS_REGION)
        report_key = f'reports/{datetime.now().strftime("%Y-%m-%d")}_defect_report.json'
        
        s3.put_object(
            Bucket=settings.S3_BUCKET,
            Key=report_key,
            Body=json.dumps(report),
            ContentType='application/json'
        )
        
        logger.info(f"Report generated and stored at {report_key}")
        return report
        
    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}")
        raise
    finally:
        session.close()

def handler(event, context):
    """AWS Lambda handler for batch processing."""
    logger.info("Starting batch processing job")
    try:
        report = aggregate_defect_data()
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Batch processing completed successfully',
                'report_summary': {
                    'generated_at': report['generated_at'],
                    'defect_types': len(report['defect_counts']),
                    'critical_areas': len(report['critical_areas'])
                }
            })
        }
    except Exception as e:
        logger.error(f"Batch processing failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Batch processing failed',
                'error': str(e)
            })
        } 