-- Add designer and project manager columns to Project table if they don't exist
DO $$
BEGIN
    -- Check if designerId column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Project' AND column_name = 'designerId'
    ) THEN
        -- Add designerId column
        ALTER TABLE "Project" ADD COLUMN "designerId" INTEGER;
        
        -- Add foreign key constraint
        ALTER TABLE "Project" ADD CONSTRAINT "Project_designerId_fkey" 
        FOREIGN KEY ("designerId") REFERENCES "User"(id) ON DELETE SET NULL;
    END IF;

    -- Check if projectManagerId column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Project' AND column_name = 'projectManagerId'
    ) THEN
        -- Add projectManagerId column
        ALTER TABLE "Project" ADD COLUMN "projectManagerId" INTEGER;
        
        -- Add foreign key constraint
        ALTER TABLE "Project" ADD CONSTRAINT "Project_projectManagerId_fkey" 
        FOREIGN KEY ("projectManagerId") REFERENCES "User"(id) ON DELETE SET NULL;
    END IF;
END
$$;
