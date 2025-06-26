from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from geoalchemy2 import Geography

from app.db.session import Base

class DefectType(str, enum.Enum):
    POTHOLE = "pothole"
    CRACK = "crack"
    DAMAGED_PAVEMENT = "damaged_pavement"
    WATER_LOGGING = "water_logging"
    MISSING_MANHOLE = "missing_manhole"
    OTHER = "other"

class SeverityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Defect(Base):
    __tablename__ = "defects"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String, index=True, nullable=True)
    defect_type = Column(
        Enum(DefectType), nullable=False, default=DefectType.OTHER
    )
    severity = Column(
        Enum(SeverityLevel), nullable=False, default=SeverityLevel.MEDIUM
    )
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Store as geography type for spatial operations
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    
    notes = Column(Text, nullable=True)
    reported_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Optional relationship to user if authentication is implemented
    # reported_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    # user = relationship("User", back_populates="reported_defects") 