import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucketName = process.env.GCP_BUCKET_NAME;

if (!bucketName) {
  throw new Error('GCP_BUCKET_NAME environment variable is not set.');
}

const bucket = storage.bucket(bucketName);

export const uploadFileToGCS = async (file: Express.Multer.File): Promise<string> => {
  const uniqueFilename = `${uuidv4()}-${file.originalname}`;
  const blob = bucket.file(uniqueFilename);
  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: file.mimetype,
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err: Error) => {
      reject(err);
    });

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

export const deleteFileFromGCS = async (fileName: string): Promise<void> => {
  try {
    await bucket.file(fileName).delete();
    console.log(`Successfully deleted ${fileName} from GCS.`);
  } catch (error) {
    console.error(`Failed to delete ${fileName} from GCS:`, error);
    throw error;
  }
};
