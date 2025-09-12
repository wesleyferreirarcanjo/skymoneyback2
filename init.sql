-- Create database if it doesn't exist
SELECT 'CREATE DATABASE skymoneyback'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'skymoneyback')\gexec

-- Connect to the database
\c skymoneyback;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
DO $$ BEGIN
    CREATE TYPE users_role_enum AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE users_status_enum AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'APPROVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;