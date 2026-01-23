-- Insert the default hero background as the first slide if it doesn't exist
INSERT INTO hero_slides (image_url, sort_order, active)
SELECT '/hero-bg.jpg', 1, true
WHERE NOT EXISTS (
    SELECT 1 FROM hero_slides WHERE image_url = '/hero-bg.jpg'
);
