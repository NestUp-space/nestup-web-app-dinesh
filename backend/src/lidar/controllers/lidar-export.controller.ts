/**
 * LiDAR Export Controller
 * Handles HTTP requests for export operations
 */

import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { lidarExportService } from '../services/lidar-export.service';
import { lidarSessionService } from '../services/lidar-session.service';
import { CustomRequest } from '../../middlewares/auth.middleware';

/**
 * Export session data as JSON
 * GET /api/lidar/sessions/:id/export/json
 */
export const exportSessionJson = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.id;
    const userId = req.user?.id;

    // Verify session access
    const session = await lidarSessionService.getSession(sessionId, userId || undefined);
    if (!session) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Session not found',
      });
      return;
    }

    const exportData = await lidarExportService.exportSessionJSON(sessionId, {
      includeFloorPlan: req.query.floorPlan !== 'false',
      includeBom: req.query.bom !== 'false',
      includeWalls: req.query.walls !== 'false',
      includeModules: req.query.modules !== 'false',
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error('Error exporting session JSON:', error);
    if (error instanceof Error) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

/**
 * Export session data as Excel file
 * GET /api/lidar/sessions/:id/export/excel
 */
export const exportSessionExcel = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.id;
    const userId = req.user?.id;

    // Verify session access
    const session = await lidarSessionService.getSession(sessionId, userId || undefined);
    if (!session) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Session not found',
      });
      return;
    }

    const buffer = await lidarExportService.exportSessionExcel(sessionId);

    const fileName = `session_${session.name || sessionId}_${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error('Error exporting session Excel:', error);
    if (error instanceof Error) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

/**
 * Export BOM as Excel file
 * GET /api/lidar/sessions/:id/bom/export/excel
 */
export const exportBomExcel = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.id;
    const userId = req.user?.id;

    // Verify session access
    const session = await lidarSessionService.getSession(sessionId, userId || undefined);
    if (!session) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Session not found',
      });
      return;
    }

    const buffer = await lidarExportService.exportBomExcel(sessionId);

    const fileName = `bom_${session.name || sessionId}_${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error('Error exporting BOM Excel:', error);
    if (error instanceof Error) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

/**
 * Export session as PDF (returns HTML to be rendered)
 * GET /api/lidar/sessions/:id/export/pdf
 */
export const exportSessionPdf = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.id;
    const userId = req.user?.id;

    // Verify session access
    const session = await lidarSessionService.getSession(sessionId, userId || undefined);
    if (!session) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Session not found',
      });
      return;
    }

    const html = await lidarExportService.generatePdfHtml(sessionId);

    // Check if client wants HTML (for browser printing) or JSON response
    if (req.query.format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } else {
      // Return as JSON with HTML content for client-side PDF generation
      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          html,
          fileName: `report_${session.name || sessionId}_${Date.now()}.pdf`,
        },
      });
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (error instanceof Error) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};
