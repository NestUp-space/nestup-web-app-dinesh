-- AlterTable
ALTER TABLE "Subtask" ADD COLUMN     "actionRequired" TEXT,
ADD COLUMN     "metadataJson" TEXT,
ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "stage" TEXT,
ADD COLUMN     "uploaderRole" TEXT,
ADD COLUMN     "viewerRoles" TEXT;
