from __future__ import annotations
from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from enum import Enum

class IntegrationProvider(str, Enum):
    gupshup = 'gupshup'
    razorpay = 'razorpay'
    social_linkedin = 'social_linkedin'
    social_facebook = 'social_facebook'
    social_google_reviews = 'social_google_reviews'

class IntegrationSettingsUpdate(BaseModel):
    provider: IntegrationProvider
    enabled: Optional[bool]
    config: Optional[dict]

class IntegrationSettingsOut(BaseModel):
    id: UUID
    provider: IntegrationProvider
    enabled: bool
    config: Optional[dict]
    updated_by: Optional[str]
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BrandSettingsUpdate(BaseModel):
    school_name: Optional[str]
    principal_name: Optional[str]
    phone_primary: Optional[str]
    phone_transport: Optional[str]
    email_contact: Optional[str]
    location_address: Optional[str]
    address_line1: Optional[str]
    address_line2: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    postal_code: Optional[str]
    logo_url: Optional[str]
    website_url: Optional[str]
    tagline: Optional[str]
    social_links: Optional[dict]

class BrandSettingsOut(BaseModel):
    id: UUID
    school_name: str
    principal_name: Optional[str]
    phone_primary: Optional[str]
    phone_transport: Optional[str]
    email_contact: Optional[str]
    location_address: Optional[str]
    address_line1: Optional[str]
    address_line2: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    postal_code: Optional[str]
    logo_url: Optional[str]
    website_url: Optional[str]
    tagline: Optional[str]
    social_links: Optional[dict]
    updated_by: Optional[str]
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConfigEntryUpsert(BaseModel):
    key: str
    value_json: dict
    is_secret: Optional[bool] = False

class ConfigEntryOut(BaseModel):
    id: int
    key: str
    value_json: dict
    is_secret: bool
    updated_by: Optional[int] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class IntegrationCredentialCreate(BaseModel):
    provider: str
    label: Optional[str] = None
    credentials: dict

class IntegrationCredentialOut(BaseModel):
    id: int
    provider: str
    label: Optional[str]
    credentials: dict
    rotated_at: Optional[datetime]
    created_at: Optional[datetime]
    model_config = ConfigDict(from_attributes=True)
