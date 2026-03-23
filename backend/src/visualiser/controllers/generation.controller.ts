/**
 * Generation Controller
 * Handles POST /api/visualiser/generate
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenerationService } from '../services/generation.service';
import type { GenerateInput } from '../validations/visualiser.validation';

/**
 * Run the full file generation pipeline.
 * POST /api/visualiser/generate
 */
export const generate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input: GenerateInput = req.body;

    const result = GenerationService.runPipeline(input);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Pipeline generation completed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
