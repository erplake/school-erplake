from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field
from datetime import date, datetime
from typing import Optional


class BusBase(BaseModel):
    code: str
    model: Optional[str] = None
    capacity: Optional[int] = None
    driver_staff_id: Optional[int] = None
    route_name: Optional[str] = None
    status: Optional[str] = Field(default='Idle', pattern='^(On Trip|Idle|Maintenance|Reserved)$')
    last_service_date: Optional[date] = None
    service_interval_days: Optional[int] = 180
    odometer_km: Optional[int] = 0
    insurance_expiry: Optional[date] = None
    permit_expiry: Optional[date] = None
    fitness_expiry: Optional[date] = None
    puc_expiry: Optional[date] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, extra='ignore')


class BusCreate(BusBase):
    pass


class BusUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra='ignore')
    model: Optional[str] = None
    capacity: Optional[int] = None
    driver_staff_id: Optional[int] = None
    route_name: Optional[str] = None
    status: Optional[str] = Field(default=None, pattern='^(On Trip|Idle|Maintenance|Reserved)$')
    last_service_date: Optional[date] = None
    service_interval_days: Optional[int] = None
    odometer_km: Optional[int] = None
    insurance_expiry: Optional[date] = None
    permit_expiry: Optional[date] = None
    fitness_expiry: Optional[date] = None
    puc_expiry: Optional[date] = None
    notes: Optional[str] = None


class BusOut(BusBase):
    id: int
    created_at: datetime
    # Using Optional[...] instead of 3.10+ union syntax for Python 3.9 compatibility
    updated_at: Optional[datetime] = None


class ServiceLogCreate(BaseModel):
    bus_id: int
    date: date
    odometer_km: Optional[int] = None
    work: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, extra='ignore')


class ServiceLogOut(ServiceLogCreate):
    id: int
    created_at: datetime


class IncidentCreate(BaseModel):
    bus_id: int
    date: date
    note: str
    model_config = ConfigDict(from_attributes=True, extra='ignore')


class IncidentOut(IncidentCreate):
    id: int
    created_at: datetime


class GpsPingCreate(BaseModel):
    bus_id: int
    lat: float
    lng: float
    speed_kph: Optional[float] = None


class GpsPingOut(GpsPingCreate):
    id: int
    pinged_at: datetime
