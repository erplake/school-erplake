from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, Date, DateTime, ForeignKey, Float
from datetime import datetime, date
from typing import Optional, List
from ...core.db import Base


class TransportBus(Base):
    __tablename__ = 'transport_buses'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    model: Mapped[Optional[str]] = mapped_column(String(120))
    capacity: Mapped[Optional[int]] = mapped_column(Integer)
    driver_staff_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # FK to staff.id later if needed
    route_name: Mapped[Optional[str]] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(30), default='Idle')  # On Trip | Idle | Maintenance | Reserved
    last_service_date: Mapped[Optional[date]] = mapped_column(Date())
    service_interval_days: Mapped[Optional[int]] = mapped_column(Integer, default=180)
    odometer_km: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    insurance_expiry: Mapped[Optional[date]] = mapped_column(Date())
    permit_expiry: Mapped[Optional[date]] = mapped_column(Date())
    fitness_expiry: Mapped[Optional[date]] = mapped_column(Date())
    puc_expiry: Mapped[Optional[date]] = mapped_column(Date())
    notes: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    service_logs: Mapped[List['TransportServiceLog']] = relationship('TransportServiceLog', back_populates='bus', cascade='all,delete')
    incidents: Mapped[List['TransportIncident']] = relationship('TransportIncident', back_populates='bus', cascade='all,delete')


class TransportServiceLog(Base):
    __tablename__ = 'transport_service_logs'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    bus_id: Mapped[int] = mapped_column(ForeignKey('transport_buses.id', ondelete='CASCADE'), index=True)
    date: Mapped[date] = mapped_column(Date())
    odometer_km: Mapped[Optional[int]] = mapped_column(Integer)
    work: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    bus: Mapped['TransportBus'] = relationship('TransportBus', back_populates='service_logs')


class TransportIncident(Base):
    __tablename__ = 'transport_incidents'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    bus_id: Mapped[int] = mapped_column(ForeignKey('transport_buses.id', ondelete='CASCADE'), index=True)
    date: Mapped[date] = mapped_column(Date())
    note: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    bus: Mapped['TransportBus'] = relationship('TransportBus', back_populates='incidents')


class TransportGpsPing(Base):
    __tablename__ = 'transport_gps_pings'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    bus_id: Mapped[int] = mapped_column(ForeignKey('transport_buses.id', ondelete='CASCADE'), index=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    speed_kph: Mapped[Optional[float]] = mapped_column(Float)
    pinged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
