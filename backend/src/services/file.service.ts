import prisma from '../config/db';  // Prisma client
import { uploadToS3 } from '../utils/s3';  // Utility function for S3 file upload

export const uploadFileService = async (taskId: number, file: any) => {
  const fileUrl = await uploadToS3(file);  // Upload the file to S3
  const fileRecord = await prisma.file.create({
    data: {
      taskId: taskId,
      fileUrl: fileUrl,
      uploadedBy: file.user_id,  // Assuming user_id is available in the request
    },
  });
  return fileRecord;
};

export const getFilesService = async (taskId: number) => {
  return await prisma.file.findMany({
    where: { taskId: taskId },
  });
};
