-- Add secondary and tertiary category fields to listings
ALTER TABLE listings 
ADD COLUMN secondary_category text,
ADD COLUMN tertiary_category text;

-- Add index for category searches
CREATE INDEX idx_listings_secondary_category ON listings(secondary_category);
CREATE INDEX idx_listings_tertiary_category ON listings(tertiary_category);