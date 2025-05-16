// backend/src/utils/s3.ts

// import AWS from 'aws-sdk'; // Removed unused v2 import
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const { S3Client } = require('@aws-sdk/client-s3');
const s3 = new S3Client({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const uploadToS3 = async (file: any): Promise<string> => {
  const fileStream = fs.createReadStream(file.path);
  const fileExtension = path.extname(file.originalname);
  const key = `${uuidv4()}${fileExtension}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME as string,
    Key: key,
    Body: fileStream,
    ContentType: file.mimetype,
  };

  try {
    const uploadResult = await s3.upload(params).promise();
    return uploadResult.Location; // Return the URL of the uploaded file
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error('File upload failed');
  }
};
