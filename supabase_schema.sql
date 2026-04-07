-- ============================================================
-- BDR Intelligence: Clinic Lookup Schema
-- Run this in Supabase SQL Editor (Project > SQL Editor > New Query)
-- ============================================================

-- Enable fuzzy search extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- 1. tam_locations — primary clinic registry (Google Maps)
-- ============================================================
CREATE TABLE IF NOT EXISTS tam_locations (
    place_id            TEXT PRIMARY KEY,
    company_name        TEXT,
    address             TEXT,
    city                TEXT,
    state               TEXT,
    gm_zip5             TEXT,
    phone               TEXT,
    website             TEXT,
    domain              TEXT,
    reviews             INTEGER,
    rating              NUMERIC(3,1),
    practitioner_count  INTEGER,
    npi_org             TEXT,
    npi_org_name        TEXT,
    competitor_detected BOOLEAN DEFAULT FALSE,
    competitor_primary_platform TEXT,
    metro               TEXT
);

CREATE INDEX IF NOT EXISTS idx_tam_locations_name_trgm
    ON tam_locations USING GIN (company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tam_locations_city ON tam_locations (city);
CREATE INDEX IF NOT EXISTS idx_tam_locations_state ON tam_locations (state);
CREATE INDEX IF NOT EXISTS idx_tam_locations_npi_org ON tam_locations (npi_org);

-- Full-text search vector
ALTER TABLE tam_locations ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        to_tsvector('english',
            coalesce(company_name, '') || ' ' ||
            coalesce(city, '') || ' ' ||
            coalesce(state, '') || ' ' ||
            coalesce(gm_zip5, '')
        )
    ) STORED;
CREATE INDEX IF NOT EXISTS idx_tam_locations_fts ON tam_locations USING GIN (search_vector);

-- ============================================================
-- 2. tam_contacts — best contact per clinic
-- ============================================================
CREATE TABLE IF NOT EXISTS tam_contacts (
    place_id                TEXT PRIMARY KEY REFERENCES tam_locations(place_id),
    contact_first_name      TEXT,
    contact_last_name       TEXT,
    contact_full_name       TEXT,
    name_source             TEXT,
    best_email              TEXT,
    email_type              TEXT,
    best_phone              TEXT,
    linkedin_url            TEXT,
    linkedin_validated      BOOLEAN,
    practitioner_npi        TEXT,
    company_email           TEXT,
    personal_email          TEXT,
    dir_email               TEXT,
    website                 TEXT,
    domain                  TEXT,
    loc_count               INTEGER,
    -- City benchmark snapshots (from city at time of export)
    cva_median              NUMERIC,
    cva_top25               NUMERIC,
    pva_median              NUMERIC,
    pva_top25               NUMERIC,
    visits_week_median      NUMERIC,
    visits_week_top25       NUMERIC,
    np_month_median         NUMERIC,
    np_month_top25          NUMERIC,
    reacts_median           NUMERIC,
    reacts_top25            NUMERIC,
    react_value             NUMERIC,
    -- Pre-built email campaigns
    email1_subject          TEXT,
    email1_body             TEXT,
    email2_subject          TEXT,
    email2_body             TEXT,
    email3_subject          TEXT,
    email3_body             TEXT
);

-- ============================================================
-- 3. city_benchmarks — market performance by city
-- ============================================================
CREATE TABLE IF NOT EXISTS city_benchmarks (
    city                TEXT PRIMARY KEY,
    loc_count           INTEGER,
    cva_median          NUMERIC,
    cva_top25           NUMERIC,
    pva_median          NUMERIC,
    pva_top25           NUMERIC,
    visits_week_median  NUMERIC,
    visits_week_top25   NUMERIC,
    np_month_median     NUMERIC,
    np_month_top25      NUMERIC,
    reacts_median       NUMERIC,
    reacts_top25        NUMERIC,
    noshow_median       NUMERIC,
    cash_pct_median     NUMERIC,
    react_value         NUMERIC
);

-- ============================================================
-- 4. npi_practitioners — individual chiropractors (Type 1 NPI)
-- ============================================================
CREATE TABLE IF NOT EXISTS npi_practitioners (
    npi                         TEXT PRIMARY KEY,
    provider_first_name         TEXT,
    provider_last_name          TEXT,
    provider_middle_name        TEXT,
    provider_credential_text    TEXT,
    provider_gender_code        TEXT,
    practice_address_line1      TEXT,
    practice_address_line2      TEXT,
    practice_city               TEXT,
    practice_state              TEXT,
    practice_zip                TEXT,
    practice_phone              TEXT,
    practice_fax                TEXT,
    provider_enumeration_date   DATE,
    healthcare_provider_taxonomies TEXT,
    is_sole_proprietor          TEXT
);

CREATE INDEX IF NOT EXISTS idx_npi_practitioners_zip ON npi_practitioners (practice_zip);
CREATE INDEX IF NOT EXISTS idx_npi_practitioners_state ON npi_practitioners (practice_state);

-- ============================================================
-- 5. npi_organizations — clinic organizations (Type 2 NPI)
-- ============================================================
CREATE TABLE IF NOT EXISTS npi_organizations (
    npi                             TEXT PRIMARY KEY,
    organization_name               TEXT,
    organization_dba                TEXT,
    practice_address_line1          TEXT,
    practice_address_line2          TEXT,
    practice_city                   TEXT,
    practice_state                  TEXT,
    practice_zip                    TEXT,
    practice_phone                  TEXT,
    practice_fax                    TEXT,
    provider_enumeration_date       DATE,
    healthcare_provider_taxonomies  TEXT,
    authorized_official_first_name  TEXT,
    authorized_official_last_name   TEXT,
    authorized_official_telephone   TEXT
);

-- ============================================================
-- 6. npi_practitioners_geocoded — practitioners with lat/lng
-- ============================================================
CREATE TABLE IF NOT EXISTS npi_practitioners_geocoded (
    npi             TEXT PRIMARY KEY,
    name            TEXT,
    latitude_biz    NUMERIC,
    longitude_biz   NUMERIC,
    h3_r10_biz      TEXT,
    matched_address_biz TEXT,
    provider_first_name TEXT,
    provider_last_name  TEXT,
    provider_credential_text TEXT,
    phone           TEXT,
    street          TEXT,
    city            TEXT,
    state           TEXT,
    zip             TEXT
);

CREATE INDEX IF NOT EXISTS idx_npi_geocoded_zip ON npi_practitioners_geocoded (zip);

-- ============================================================
-- 7. npi_changes — recent practice change log
-- ============================================================
CREATE TABLE IF NOT EXISTS npi_changes (
    npi                 TEXT PRIMARY KEY,
    last_update_date    DATE,
    address_changed     BOOLEAN,
    owner_changed       BOOLEAN,
    phone_changed       BOOLEAN,
    name_changed        BOOLEAN,
    current_address     TEXT,
    old_address         TEXT,
    current_city        TEXT,
    old_city            TEXT
);

-- ============================================================
-- 8. reviews_classified — Google reviews with AI pain tags
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews_classified (
    id              BIGSERIAL PRIMARY KEY,
    place_id        TEXT REFERENCES tam_locations(place_id),
    title           TEXT,
    stars           INTEGER,
    text            TEXT,
    pain_categories TEXT,   -- pipe-delimited: SCHEDULING|BILLING|etc
    confidence      TEXT,
    signal_strength TEXT,
    summary         TEXT
);

CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON reviews_classified (place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_stars ON reviews_classified (stars);
CREATE INDEX IF NOT EXISTS idx_reviews_signal ON reviews_classified (signal_strength);

-- ============================================================
-- 9. competitor_chirotouch — confirmed ChiroTouch users
-- ============================================================
CREATE TABLE IF NOT EXISTS competitor_chirotouch (
    chirotouch_client_id    TEXT PRIMARY KEY,
    chirotouch_name         TEXT,
    match_type              TEXT,
    match_confidence        NUMERIC,
    confidence_tier         TEXT,
    tam_place_id            TEXT REFERENCES tam_locations(place_id),
    tam_name                TEXT,
    tam_address             TEXT,
    tam_gm_city             TEXT,
    tam_gm_state            TEXT,
    tam_gm_zip5             TEXT,
    tam_phone               TEXT,
    tam_website             TEXT,
    tam_domain              TEXT,
    uses_chirotouch         BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_chirotouch_place_id ON competitor_chirotouch (tam_place_id);

-- ============================================================
-- 10. chd_new_patient_appointments — CHD customer NP volume
-- ============================================================
CREATE TABLE IF NOT EXISTS chd_new_patient_appointments (
    id              BIGSERIAL PRIMARY KEY,
    network_string  TEXT,
    network_name    TEXT,
    location_id     TEXT,
    location_name   TEXT,
    location_zip    TEXT,
    location_status TEXT,
    jan             INTEGER,
    feb             INTEGER,
    mar             INTEGER,
    apr             INTEGER,
    may             INTEGER,
    jun             INTEGER,
    jul             INTEGER,
    aug             INTEGER,
    sep             INTEGER,
    oct             INTEGER,
    nov             INTEGER,
    dec             INTEGER,
    total_2025      INTEGER
);

-- ============================================================
-- 11. chd_total_appointments — CHD customer total volume
-- ============================================================
CREATE TABLE IF NOT EXISTS chd_total_appointments (
    id              BIGSERIAL PRIMARY KEY,
    network_string  TEXT,
    network_name    TEXT,
    location_id     TEXT,
    location_name   TEXT,
    location_zip    TEXT,
    location_status TEXT,
    jan             INTEGER,
    feb             INTEGER,
    mar             INTEGER,
    apr             INTEGER,
    may             INTEGER,
    jun             INTEGER,
    jul             INTEGER,
    aug             INTEGER,
    sep             INTEGER,
    oct             INTEGER,
    nov             INTEGER,
    dec             INTEGER,
    total_2025      INTEGER
);

-- ============================================================
-- Fuzzy search RPC function (used by clinic-search API)
-- ============================================================
CREATE OR REPLACE FUNCTION search_clinics_fuzzy(query TEXT, max_results INT DEFAULT 20)
RETURNS TABLE (
    place_id            TEXT,
    company_name        TEXT,
    address             TEXT,
    city                TEXT,
    state               TEXT,
    gm_zip5             TEXT,
    rating              NUMERIC,
    reviews             INTEGER,
    practitioner_count  INTEGER,
    similarity          REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.place_id,
        l.company_name,
        l.address,
        l.city,
        l.state,
        l.gm_zip5,
        l.rating,
        l.reviews,
        l.practitioner_count,
        similarity(l.company_name, query) AS similarity
    FROM tam_locations l
    WHERE
        similarity(l.company_name, query) > 0.15
        OR l.company_name ILIKE '%' || query || '%'
        OR l.city ILIKE '%' || query || '%'
    ORDER BY similarity(l.company_name, query) DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 12. chd_appointment_types — appointment type diversity
-- ============================================================
CREATE TABLE IF NOT EXISTS chd_appointment_types (
    id                          BIGSERIAL PRIMARY KEY,
    network_string              TEXT,
    network_name                TEXT,
    location_id                 TEXT,
    location_name               TEXT,
    location_zip                TEXT,
    location_status             TEXT,
    unique_appointment_types_count INTEGER,
    appointment_types_list      TEXT
);
