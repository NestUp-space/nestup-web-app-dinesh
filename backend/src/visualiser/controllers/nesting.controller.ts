/**
 * Nesting Controller
 * Handles POST /api/visualiser/nest
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NestingService } from '../services/nesting.service';
import type { NestInput } from '../validations/visualiser.validation';

/**
 * Run nesting algorithm against a plank list.
 * POST /api/visualiser/nest
 */
export const nest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input: NestInput = req.body;

    const results = NestingService.nest({
      plankList: input.plankList,
      algorithm: input.algorithm,
      algorithmParams: input.algorithmParams,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Nesting completed successfully',
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
