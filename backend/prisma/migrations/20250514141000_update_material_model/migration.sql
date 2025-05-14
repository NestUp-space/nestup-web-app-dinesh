-- Update Material model to remove edgebanding and enforce Y/N grain direction
ALTER TABLE "Material" 
DROP COLUMN "edgebandingInnerCode",
DROP COLUMN "edgebandingExposedCode",
ALTER COLUMN "grainDirection" SET NOT NULL,
ADD CONSTRAINT "grain_direction_check" 
  CHECK ("grainDirection" IN ('Y', 'N'));
