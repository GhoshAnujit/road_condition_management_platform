from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
from geoalchemy2.functions import ST_MakePoint, ST_SetSRID, ST_Distance, ST_GeogFromText

from app.db.session import get_db
from app.models.defect import Defect as DefectModel, DefectType, SeverityLevel
from app.schemas.defect import (
    Defect, 
    DefectCreate, 
    DefectUpdate, 
    DefectUploadPayload,
    DefectStatistics
)

router = APIRouter()

@router.get("/", response_model=List[Defect])
def get_defects(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    defect_type: Optional[DefectType] = None,
    severity: Optional[SeverityLevel] = None,
    lat_min: Optional[float] = None,
    lat_max: Optional[float] = None,
    lng_min: Optional[float] = None,
    lng_max: Optional[float] = None
):
    """
    Retrieve all road defects with optional filtering.
    """
    query = db.query(DefectModel)
    
    # Apply filters if provided
    if defect_type:
        query = query.filter(DefectModel.defect_type == defect_type)
    if severity:
        query = query.filter(DefectModel.severity == severity)
    
    # Apply bounding box filter if provided
    if all([lat_min, lat_max, lng_min, lng_max]):
        query = query.filter(
            DefectModel.latitude >= lat_min,
            DefectModel.latitude <= lat_max,
            DefectModel.longitude >= lng_min,
            DefectModel.longitude <= lng_max
        )
    
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=Defect)
def create_defect(
    defect: DefectCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new road defect report.
    """
    # Create defect with geographic point data
    db_defect = DefectModel(
        defect_type=defect.defect_type,
        severity=defect.severity,
        latitude=defect.latitude,
        longitude=defect.longitude,
        location=ST_SetSRID(ST_MakePoint(defect.longitude, defect.latitude), 4326),
        notes=defect.notes
    )
    
    db.add(db_defect)
    db.commit()
    db.refresh(db_defect)
    return db_defect

@router.get("/{defect_id}", response_model=Defect)
def get_defect(
    defect_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific road defect by ID.
    """
    defect = db.query(DefectModel).filter(DefectModel.id == defect_id).first()
    if not defect:
        raise HTTPException(status_code=404, detail="Defect not found")
    return defect

@router.put("/{defect_id}", response_model=Defect)
def update_defect(
    defect_id: int,
    defect_update: DefectUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing road defect.
    """
    db_defect = db.query(DefectModel).filter(DefectModel.id == defect_id).first()
    if not db_defect:
        raise HTTPException(status_code=404, detail="Defect not found")
    
    # Update provided fields
    update_data = defect_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_defect, field, value)
    
    db.commit()
    db.refresh(db_defect)
    return db_defect

@router.delete("/{defect_id}")
def delete_defect(
    defect_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a road defect.
    """
    db_defect = db.query(DefectModel).filter(DefectModel.id == defect_id).first()
    if not db_defect:
        raise HTTPException(status_code=404, detail="Defect not found")
    
    db.delete(db_defect)
    db.commit()
    return {"success": True}

@router.post("/upload", response_model=Defect)
def upload_defect_data(
    payload: DefectUploadPayload,
    db: Session = Depends(get_db)
):
    """
    Upload road defect data from external source.
    """
    # Extract coordinates
    lat, lng = payload.coordinates
    
    # Map external defect type to internal enum
    # This is a simple mapping that can be expanded based on needs
    defect_type_mapping = {
        "minor pothole": DefectType.POTHOLE,
        "pothole": DefectType.POTHOLE,
        "crack": DefectType.CRACK,
        "damaged pavement": DefectType.DAMAGED_PAVEMENT,
        "water logging": DefectType.WATER_LOGGING,
        "missing manhole": DefectType.MISSING_MANHOLE
    }
    
    defect_type = defect_type_mapping.get(payload.defect_type.lower(), DefectType.OTHER)
    
    # Create defect with geographic point data
    db_defect = DefectModel(
        vehicle_id=payload.vehicle_id,
        defect_type=defect_type,
        severity=payload.severity,
        latitude=lat,
        longitude=lng,
        location=ST_SetSRID(ST_MakePoint(lng, lat), 4326),
        notes=payload.notes,
        reported_at=payload.timestamp
    )
    
    db.add(db_defect)
    db.commit()
    db.refresh(db_defect)
    return db_defect

@router.post("/upload/bulk", response_model=Dict[str, Any])
async def upload_bulk_defect_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload multiple road defect data entries from a JSON file.
    
    The JSON file should contain an array of objects with the following structure:
    [
        {
            "vehicle_id": "string",
            "timestamp": "ISO datetime string",
            "coordinates": [latitude, longitude],
            "defect_type": "string",
            "severity": "low|medium|high|critical" (optional, defaults to medium),
            "notes": "string" (optional)
        },
        ...
    ]
    """
    # Map external defect type to internal enum
    defect_type_mapping = {
        "minor pothole": DefectType.POTHOLE,
        "pothole": DefectType.POTHOLE,
        "crack": DefectType.CRACK,
        "damaged pavement": DefectType.DAMAGED_PAVEMENT,
        "water logging": DefectType.WATER_LOGGING,
        "missing manhole": DefectType.MISSING_MANHOLE
    }
    
    # Read and parse JSON file
    try:
        contents = await file.read()
        data = json.loads(contents)
        
        if not isinstance(data, list):
            raise HTTPException(status_code=400, detail="JSON file must contain an array of defect objects")
        
        # Process each defect entry
        success_count = 0
        failed_entries = []
        
        for idx, entry in enumerate(data):
            try:
                # Validate required fields
                if not all(k in entry for k in ["vehicle_id", "timestamp", "coordinates", "defect_type"]):
                    failed_entries.append({
                        "index": idx,
                        "error": "Missing required fields"
                    })
                    continue
                
                # Parse timestamp
                try:
                    timestamp = datetime.fromisoformat(entry["timestamp"].replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    failed_entries.append({
                        "index": idx,
                        "error": "Invalid timestamp format"
                    })
                    continue
                
                # Validate coordinates
                coordinates = entry["coordinates"]
                if not isinstance(coordinates, list) or len(coordinates) != 2:
                    failed_entries.append({
                        "index": idx,
                        "error": "Coordinates must be [latitude, longitude]"
                    })
                    continue
                
                lat, lng = coordinates
                if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
                    failed_entries.append({
                        "index": idx,
                        "error": "Invalid coordinates"
                    })
                    continue
                
                # Map defect type
                defect_type = defect_type_mapping.get(entry["defect_type"].lower(), DefectType.OTHER)
                
                # Map severity if provided
                severity = SeverityLevel.MEDIUM
                if "severity" in entry:
                    try:
                        severity = SeverityLevel(entry["severity"].lower())
                    except ValueError:
                        failed_entries.append({
                            "index": idx,
                            "error": "Invalid severity level"
                        })
                        continue
                
                # Create defect with geographic point data
                db_defect = DefectModel(
                    vehicle_id=entry["vehicle_id"],
                    defect_type=defect_type,
                    severity=severity,
                    latitude=lat,
                    longitude=lng,
                    location=ST_SetSRID(ST_MakePoint(lng, lat), 4326),
                    notes=entry.get("notes"),
                    reported_at=timestamp
                )
                
                db.add(db_defect)
                success_count += 1
                
            except Exception as e:
                failed_entries.append({
                    "index": idx,
                    "error": str(e)
                })
        
        # Commit all successful entries
        db.commit()
        
        return {
            "success": True,
            "processed_count": len(data),
            "success_count": success_count,
            "failed_count": len(failed_entries),
            "failed_entries": failed_entries
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.get("/statistics/summary", response_model=DefectStatistics)
def get_defect_statistics(
    db: Session = Depends(get_db)
):
    """
    Get statistics about reported defects.
    """
    # Total count
    total_count = db.query(DefectModel).count()
    
    # Count by type
    type_counts = {}
    for defect_type in DefectType:
        count = db.query(DefectModel).filter(DefectModel.defect_type == defect_type).count()
        type_counts[defect_type.value] = count
    
    # Count by severity
    severity_counts = {}
    for severity in SeverityLevel:
        count = db.query(DefectModel).filter(DefectModel.severity == severity).count()
        severity_counts[severity.value] = count
    
    # Simple time-based analysis (by month for the current year)
    current_year = datetime.now().year
    time_counts = {}
    for month in range(1, 13):
        count = db.query(DefectModel).filter(
            func.extract('year', DefectModel.reported_at) == current_year,
            func.extract('month', DefectModel.reported_at) == month
        ).count()
        time_counts[f"{current_year}-{month:02d}"] = count
    
    return {
        "total_count": total_count,
        "by_type": type_counts,
        "by_severity": severity_counts,
        "by_time": time_counts
    }

@router.get("/analytics/heatmap")
def get_heatmap_data(
    db: Session = Depends(get_db),
    defect_type: Optional[DefectType] = None,
    severity: Optional[SeverityLevel] = None,
    days: Optional[int] = None
):
    """
    Get data optimized for heatmap visualization.
    Returns defect points with weight based on severity.
    """
    query = db.query(
        DefectModel.latitude,
        DefectModel.longitude,
        DefectModel.defect_type,
        DefectModel.severity,
        DefectModel.reported_at
    )
    
    # Apply filters if provided
    if defect_type:
        query = query.filter(DefectModel.defect_type == defect_type)
    if severity:
        query = query.filter(DefectModel.severity == severity)
    if days:
        cutoff_date = datetime.now() - timedelta(days=days)
        query = query.filter(DefectModel.reported_at >= cutoff_date)
    
    defects = query.all()
    
    # Map severity to weight
    severity_weights = {
        SeverityLevel.LOW: 0.5,
        SeverityLevel.MEDIUM: 1.0,
        SeverityLevel.HIGH: 1.5,
        SeverityLevel.CRITICAL: 2.0
    }
    
    # Format data for heatmap
    heatmap_data = []
    for defect in defects:
        heatmap_data.append({
            "lat": defect.latitude,
            "lng": defect.longitude,
            "weight": severity_weights[defect.severity],
            "type": defect.defect_type.value,
            "reported_at": defect.reported_at.isoformat()
        })
    
    return {
        "points": heatmap_data,
        "count": len(heatmap_data)
    }

@router.get("/analytics/density")
def get_defect_density(
    db: Session = Depends(get_db),
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius: float = Query(..., gt=0, le=50000),  # radius in meters
    defect_type: Optional[DefectType] = None,
    severity: Optional[SeverityLevel] = None
):
    """
    Get defect density within a specified radius of a point.
    Returns count of defects and breakdown by type and severity.
    """
    # Create a point from the provided coordinates
    point = f"POINT({lng} {lat})"
    
    # Query defects within radius
    query = db.query(DefectModel).filter(
        ST_Distance(
            DefectModel.location, 
            ST_GeogFromText(point)
        ) <= radius
    )
    
    # Apply additional filters
    if defect_type:
        query = query.filter(DefectModel.defect_type == defect_type)
    if severity:
        query = query.filter(DefectModel.severity == severity)
    
    defects = query.all()
    
    # Count by type
    type_counts = {}
    for defect_type in DefectType:
        count = sum(1 for d in defects if d.defect_type == defect_type)
        type_counts[defect_type.value] = count
    
    # Count by severity
    severity_counts = {}
    for severity in SeverityLevel:
        count = sum(1 for d in defects if d.severity == severity)
        severity_counts[severity.value] = count
    
    return {
        "center": {
            "lat": lat,
            "lng": lng
        },
        "radius_meters": radius,
        "total_count": len(defects),
        "by_type": type_counts,
        "by_severity": severity_counts
    }

@router.get("/analytics/hotspots")
def get_defect_hotspots(
    db: Session = Depends(get_db),
    limit: int = 10,
    defect_type: Optional[DefectType] = None,
    severity: Optional[SeverityLevel] = None,
    days: Optional[int] = None
):
    """
    Identify hotspot areas with high concentration of defects.
    Uses clustering to group nearby defects.
    """
    # For simplicity, we'll use a basic approach:
    # Round coordinates to create grid cells and count defects in each cell
    
    # First, get all defects with optional filtering
    query = db.query(
        func.round(DefectModel.latitude, 3).label('lat_grid'),
        func.round(DefectModel.longitude, 3).label('lng_grid'),
        func.count().label('defect_count')
    )
    
    # Apply filters if provided
    if defect_type:
        query = query.filter(DefectModel.defect_type == defect_type)
    if severity:
        query = query.filter(DefectModel.severity == severity)
    if days:
        cutoff_date = datetime.now() - timedelta(days=days)
        query = query.filter(DefectModel.reported_at >= cutoff_date)
    
    # Group by grid cells and order by count
    hotspots = query.group_by('lat_grid', 'lng_grid').order_by(desc('defect_count')).limit(limit).all()
    
    return {
        "hotspots": [
            {
                "lat": float(h.lat_grid),
                "lng": float(h.lng_grid),
                "count": h.defect_count,
                # Approximate radius in meters (0.001 degree ≈ 111 meters)
                "radius": 111
            }
            for h in hotspots
        ]
    } 