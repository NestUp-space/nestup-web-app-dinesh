import { Request, Response } from 'express';
import { uploadFileService, getFilesService } from '../services/file.service';
// import multer from 'multer'; // Removed direct import, types should be available via @types/multer

// Extend Request type to include file from Multer
// Ensure Express namespace is available or import Multer directly if needed.
// If Express.Multer.File is not found, it might require:
// import { File as MulterFile } from 'multer';
// and then use MulterFile.
interface CustomRequest extends Request {
  file?: Express.Multer.File; 
}

export const uploadFile = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileMetadata = await uploadFileService(Number(req.body.taskId), req.file);
    return res.status(201).json({ file: fileMetadata }); // Added return
  } catch (error) {
    // It's better to send a generic error message in production for security.
    console.error("Error uploading file:", error); // Log the actual error
    return res.status(500).json({ message: 'Error uploading file' }); // Added return and changed to 500
  }
};

export const getFiles = async (req: Request, res: Response) => {
  try {
    const files = await getFilesService(Number(req.params.taskId));
    return res.status(200).json({ files }); // Added return
  } catch (error) {
    console.error("Error getting files:", error); // Log the actual error
    return res.status(500).json({ message: 'Error retrieving files' }); // Added return and changed to 500
  }
};
