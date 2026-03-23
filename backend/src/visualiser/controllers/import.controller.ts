/**
 * Import Controller
 * Handles POST /api/visualiser/import
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ImportService } from '../services/import.service';

/**
 * Parse an uploaded CSV or Excel file into raw pipeline values.
 * POST /api/visualiser/import
 * Content-Type: multipart/form-data
 * Field: rawData (CSV or Excel file)
 */
export const importRawData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded. Send a CSV or Excel file in the "rawData" field.',
      });
      return;
    }

    const result = ImportService.parseFile(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'File parsed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
