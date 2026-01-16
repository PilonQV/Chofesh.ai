-- Add dateOfBirth column to users table
ALTER TABLE users ADD COLUMN dateOfBirth DATE NULL AFTER ageVerifiedAt;
