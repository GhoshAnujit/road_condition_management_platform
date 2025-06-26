from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from app.models.defect import DefectType, SeverityLevel

class DefectBase(BaseModel):
    defect_type: DefectType
    severity: SeverityLevel
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    notes: Optional[str] = None

class DefectCreate(DefectBase):
    pass

class DefectUpdate(BaseModel):
    defect_type: Optional[DefectType] = None
    severity: Optional[SeverityLevel] = None
    notes: Optional[str] = None

class DefectInDB(DefectBase):
    id: int
    vehicle_id: Optional[str] = None
    reported_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Defect(DefectInDB):
    pass

class DefectUploadPayload(BaseModel):
    vehicle_id: str
    timestamp: datetime
    coordinates: List[float]
    defect_type: str
    severity: Optional[SeverityLevel] = SeverityLevel.MEDIUM
    notes: Optional[str] = None
    
    @validator('coordinates')
    def validate_coordinates(cls, v):
        if len(v) != 2:
            raise ValueError('coordinates must be [latitude, longitude]')
        lat, lng = v
        if lat < -90 or lat > 90:
            raise ValueError('latitude must be between -90 and 90')
        if lng < -180 or lng > 180:
            raise ValueError('longitude must be between -180 and 180')
        return v

class DefectStatistics(BaseModel):
    total_count: int
    by_type: dict
    by_severity: dict
    by_time: dict 