ALTER TABLE leagues
ALTER COLUMN owner_user_id TYPE VARCHAR(255)
USING owner_user_id::VARCHAR;
