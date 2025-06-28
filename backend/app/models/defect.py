from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from geoalchemy2 import Geography

from app.db.session import Base

# Enum defining the types of road defects that can be reported
# These values must match the database enum type values
class DefectType(str, enum.Enum):
    POTHOLE = "pothole"
    CRACK = "crack"
    DAMAGED_PAVEMENT = "damaged_pavement"
    WATER_LOGGING = "water_logging"
    MISSING_MANHOLE = "missing_manhole"
    OTHER = "other"

# Enum defining the severity levels for defects
# Used to prioritize repairs and visualize defects on the map
class SeverityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# SQLAlchemy model for the defects table
# Represents a road defect report with location and metadata
class Defect(Base):
    __tablename__ = "defects"

    # Primary key and identifier for each defect
    id = Column(Integer, primary_key=True, index=True)
    
    # Optional identifier for the vehicle that reported the defect
    # Used when defects are reported automatically by vehicles
    vehicle_id = Column(String, index=True, nullable=True)
    
    # Type of defect (pothole, crack, etc.) using the DefectType enum
    defect_type = Column(
        Enum(DefectType), nullable=False, default=DefectType.OTHER
    )
    
    # Severity level of the defect using the SeverityLevel enum
    severity = Column(
        Enum(SeverityLevel), nullable=False, default=SeverityLevel.MEDIUM
    )
    
    # Geographic coordinates of the defect
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # PostGIS geography column for spatial queries and operations
    # Stored as a POINT geometry with WGS84 spatial reference (SRID 4326)
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    
    # Optional text notes about the defect
    notes = Column(Text, nullable=True)
    
    # Timestamps for creation and updates
    # reported_at is set automatically to the current time when a defect is created
    reported_at = Column(DateTime(timezone=True), server_default=func.now())
    # updated_at is automatically updated whenever the defect record is modified
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Optional relationship to user if authentication is implemented
    # This would link defects to the users who reported them
    # reported_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    # user = relationship("User", back_populates="reported_defects") 