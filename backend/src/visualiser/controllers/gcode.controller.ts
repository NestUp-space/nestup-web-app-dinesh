/**
 * G-Code Controller
 * Handles POST /api/visualiser/gcode
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GCodeService } from '../services/gcode.service';
import type { GCodeInput } from '../validations/visualiser.validation';

/**
 * Generate CNC G-code and return a base64 ZIP.
 * POST /api/visualiser/gcode
 */
export const generateGCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input: GCodeInput = req.body;

    const result = await GCodeService.generateGCode(
      input.nestResults,
      input.customerDetails
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'G-code generated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
