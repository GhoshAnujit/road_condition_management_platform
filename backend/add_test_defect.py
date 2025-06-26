from app.db.session import get_db
from app.models.defect import Defect, DefectType, SeverityLevel
from geoalchemy2.functions import ST_SetSRID, ST_MakePoint
from datetime import datetime

def add_test_defect():
    """Add a test defect to the database"""
    db = next(get_db())
    
    try:
        # Create a test defect
        test_defect = Defect(
            defect_type=DefectType.POTHOLE,
            severity=SeverityLevel.MEDIUM,
            latitude=37.7749,
            longitude=-122.4194,
            location=ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326),
            notes="Test defect added for debugging",
            reported_at=datetime.now()
        )
        
        # Add to database
        db.add(test_defect)
        db.commit()
        db.refresh(test_defect)
        
        print(f"Test defect added with ID: {test_defect.id}")
        print(f"Latitude: {test_defect.latitude}, Longitude: {test_defect.longitude}")
        print(f"Type: {test_defect.defect_type}, Severity: {test_defect.severity}")
        print(f"Reported at: {test_defect.reported_at}")
        
    except Exception as e:
        db.rollback()
        print(f"Error adding test defect: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_test_defect() 