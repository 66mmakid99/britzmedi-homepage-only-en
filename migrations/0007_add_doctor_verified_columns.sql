-- Add doctor name verification columns to blog_posts
ALTER TABLE blog_posts ADD COLUMN doctor_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE blog_posts ADD COLUMN doctor_verified_source TEXT;
