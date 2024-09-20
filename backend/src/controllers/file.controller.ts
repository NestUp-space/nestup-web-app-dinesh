import { Request, Response } from 'express';
import { uploadFileService, getFilesService } from '../services/file.service';
import multer from 'multer';  // Import multer directly for its types

// Extend Request type to include file from Multer
interface CustomRequest extends Request {
  file?: Express.Multer.File;  // Use Express.Multer.File type for the file
}

export const uploadFile = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileMetadata = await uploadFileService(Number(req.body.taskId), req.file);
    res.status(201).json({ file: fileMetadata });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getFiles = async (req: Request, res: Response) => {
  try {
    const files = await getFilesService(Number(req.params.taskId));
    res.status(200).json({ files });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
