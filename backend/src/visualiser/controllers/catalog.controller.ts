/**
 * Catalog Controller
 * Handles GET /api/visualiser/catalog
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CatalogService } from '../services/catalog.service';

/**
 * Fetch catalog data (models, plywood options, laminates).
 * GET /api/visualiser/catalog
 */
export const getCatalog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const fresh = req.query.fresh === 'true';

    const data = await CatalogService.getCatalog(fresh);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Catalog fetched successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};
