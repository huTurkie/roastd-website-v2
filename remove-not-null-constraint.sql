-- Remove NOT NULL constraint from link_code to allow null values
ALTER TABLE public.roast_sessions ALTER COLUMN link_code DROP NOT NULL;
