import { getSignedUrl as signedUrl } from "@aws-sdk/s3-request-presigner";
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  GetObjectCommand,
  GetObjectCommandInput,
  DeleteObjectCommand,
  DeleteObjectCommandInput,
} from "@aws-sdk/client-s3";

import { aws } from "@config";

const { accessKeyId, secretAccessKey, s3Region } = aws;

const s3Client = new S3Client({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region: s3Region,
});

export const getSignedUrl = async (
  params: GetObjectCommandInput,
  expiresIn: number = 3600
) => {
  const command = new GetObjectCommand(params);
  return await signedUrl(s3Client, command, { expiresIn });
};

export const putObject = async (params: PutObjectCommandInput) =>
  await s3Client.send(new PutObjectCommand(params));

export const deleteObject = async (params: DeleteObjectCommandInput) =>
  await s3Client.send(new DeleteObjectCommand(params));

export default s3Client;
