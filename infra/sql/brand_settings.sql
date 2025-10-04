-- Idempotent DDL for brand settings table
CREATE TABLE IF NOT EXISTS brand_settings (
    id uuid PRIMARY KEY,
    school_name varchar NOT NULL DEFAULT 'My School',
    principal_name varchar NULL,
    phone_primary varchar NULL,
    phone_transport varchar NULL,
    email_contact varchar NULL,
    location_address varchar NULL,
    address_line1 varchar NULL,
    address_line2 varchar NULL,
    city varchar NULL,
    state varchar NULL,
    country varchar NULL,
    postal_code varchar NULL,
    logo_url varchar NULL,
    website_url varchar NULL,
    tagline varchar NULL,
    social_links jsonb NULL,
    updated_by varchar NULL,
    updated_at timestamptz DEFAULT now()
);
