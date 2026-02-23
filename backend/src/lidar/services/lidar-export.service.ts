/**
 * LiDAR Export Service
 * Handles export of session data, BOM, and reports in various formats
 */

import * as XLSX from 'xlsx';
import {
  SessionBomResponse,
  BomMaterial,
  BomCutItem,
  BomHardware,
  FloorPlanData,
  RoomDimensions,
  WallData,
} from '../types/lidar.types';

import prisma from '../../config/db';
export interface ExportOptions {
  includeFloorPlan?: boolean;
  includeBom?: boolean;
  includeWalls?: boolean;
  includeModules?: boolean;
  format?: 'json' | 'excel' | 'pdf';
}

export interface SessionExportData {
  session: {
    id: string;
    name: string | null;
    status: string;
    createdAt: Date;
  };
  floorPlan?: FloorPlanData | null;
  roomDimensions?: RoomDimensions | null;
  walls?: WallData[];
  modules?: Array<{
    id: string;
    name: string;
    dimensions: { width: number; height: number; depth: number };
    position: { x: number; y: number; z: number };
  }>;
  bom?: SessionBomResponse | null;
}

export class LidarExportService {
  /**
   * Export session data as JSON
   */
  async exportSessionJSON(sessionId: string, options: ExportOptions = {}): Promise<SessionExportData> {
    const session = await prisma.lidarSession.findUnique({
      where: { id: sessionId },
      include: {
        processedData: true,
        walls: true,
        placedModules: {
          include: {
            template: true,
          },
        },
        bom: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const exportData: SessionExportData = {
      session: {
        id: session.id,
        name: session.name,
        status: session.status,
        createdAt: session.createdAt,
      },
    };

    if (options.includeFloorPlan !== false && session.processedData) {
      exportData.floorPlan = session.processedData.floorPlanJson as unknown as FloorPlanData;
      exportData.roomDimensions = session.processedData.roomDimensions as unknown as RoomDimensions;
    }

    if (options.includeWalls !== false) {
      exportData.walls = session.walls.map((w) => ({
        wallIndex: w.wallIndex,
        startPoint: w.startPoint as unknown as { x: number; y: number },
        endPoint: w.endPoint as unknown as { x: number; y: number },
        length: w.length,
        height: w.height || undefined,
        normalVector: w.normalVector as unknown as { x: number; y: number } | undefined,
      }));
    }

    if (options.includeModules !== false) {
      exportData.modules = session.placedModules.map((m) => ({
        id: m.id,
        name: m.template?.name || 'Unknown Module',
        dimensions: m.dimensions as unknown as { width: number; height: number; depth: number },
        position: m.position as unknown as { x: number; y: number; z: number },
      }));
    }

    if (options.includeBom !== false && session.bom) {
      exportData.bom = {
        id: session.bom.id,
        sessionId: session.bom.sessionId,
        materials: session.bom.materials as unknown as BomMaterial[],
        cutList: session.bom.cutList as unknown as BomCutItem[],
        hardware: session.bom.hardware as unknown as BomHardware[],
        summary: session.bom.summary as unknown as {
          totalModules: number;
          totalAreaSqm: number;
          totalPlywoodSheets: number;
          totalHardwareItems: number;
        },
        generatedAt: session.bom.generatedAt,
      };
    }

    return exportData;
  }

  /**
   * Export BOM as Excel workbook
   */
  async exportBomExcel(sessionId: string): Promise<Buffer> {
    const session = await prisma.lidarSession.findUnique({
      where: { id: sessionId },
      include: {
        bom: true,
        processedData: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.bom) {
      throw new Error('BOM not generated for this session');
    }

    const bom = session.bom;
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['LiDAR Session Bill of Materials'],
      [''],
      ['Session Name', session.name || 'Unnamed Session'],
      ['Session ID', session.id],
      ['Generated At', bom.generatedAt.toISOString()],
      [''],
      ['Summary'],
      ['Total Modules', (bom.summary as any).totalModules],
      ['Total Area (sq.m)', (bom.summary as any).totalAreaSqm],
      ['Total Plywood Sheets', (bom.summary as any).totalPlywoodSheets],
      ['Total Hardware Items', (bom.summary as any).totalHardwareItems],
    ];

    if (session.processedData?.roomDimensions) {
      const dims = session.processedData.roomDimensions as unknown as RoomDimensions;
      summaryData.push(
        [''],
        ['Room Dimensions'],
        ['Width (mm)', dims.width],
        ['Depth (mm)', dims.depth],
        ['Height (mm)', dims.height],
        ['Area (sq.m)', dims.area]
      );
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Materials Sheet
    const materials = bom.materials as unknown as BomMaterial[];
    const materialsHeader = ['Category', 'Specification', 'Quantity', 'Unit', 'Dimensions'];
    const materialsData = materials.map((m) => [
      m.category,
      m.specification,
      m.quantity,
      m.unit,
      m.dimensions || '',
    ]);
    const materialsSheet = XLSX.utils.aoa_to_sheet([materialsHeader, ...materialsData]);
    XLSX.utils.book_append_sheet(workbook, materialsSheet, 'Materials');

    // Cut List Sheet
    const cutList = bom.cutList as unknown as BomCutItem[];
    const cutListHeader = [
      'Module ID',
      'Part',
      'Quantity',
      'Width (mm)',
      'Height (mm)',
      'Depth (mm)',
      'Thickness (mm)',
      'Material',
      'Edge Banding',
    ];
    const cutListData = cutList.map((c) => [
      c.moduleId.slice(0, 8) + '...',
      c.part,
      c.quantity,
      c.dimensions.width,
      c.dimensions.height,
      c.dimensions.depth,
      c.dimensions.thickness,
      c.material,
      c.edgeBanding?.join(', ') || '',
    ]);
    const cutListSheet = XLSX.utils.aoa_to_sheet([cutListHeader, ...cutListData]);
    XLSX.utils.book_append_sheet(workbook, cutListSheet, 'Cut List');

    // Hardware Sheet
    const hardware = bom.hardware as unknown as BomHardware[];
    const hardwareHeader = ['Item', 'Specification', 'Quantity', 'Unit'];
    const hardwareData = hardware.map((h) => [
      h.item,
      h.specification,
      h.quantity,
      h.unit,
    ]);
    const hardwareSheet = XLSX.utils.aoa_to_sheet([hardwareHeader, ...hardwareData]);
    XLSX.utils.book_append_sheet(workbook, hardwareSheet, 'Hardware');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  /**
   * Export session data as Excel workbook
   */
  async exportSessionExcel(sessionId: string): Promise<Buffer> {
    const exportData = await this.exportSessionJSON(sessionId, {
      includeFloorPlan: true,
      includeBom: true,
      includeWalls: true,
      includeModules: true,
    });

    const workbook = XLSX.utils.book_new();

    // Session Info Sheet
    const sessionInfo = [
      ['LiDAR Session Export'],
      [''],
      ['Session ID', exportData.session.id],
      ['Name', exportData.session.name || 'Unnamed'],
      ['Status', exportData.session.status],
      ['Created', exportData.session.createdAt.toISOString()],
    ];

    if (exportData.roomDimensions) {
      sessionInfo.push(
        [''],
        ['Room Dimensions'],
        ['Width (mm)', String(exportData.roomDimensions.width)],
        ['Depth (mm)', String(exportData.roomDimensions.depth)],
        ['Height (mm)', String(exportData.roomDimensions.height)],
        ['Area (sq.m)', String(exportData.roomDimensions.area)]
      );
    }

    const sessionSheet = XLSX.utils.aoa_to_sheet(sessionInfo);
    XLSX.utils.book_append_sheet(workbook, sessionSheet, 'Session Info');

    // Walls Sheet
    if (exportData.walls && exportData.walls.length > 0) {
      const wallsHeader = [
        'Wall #',
        'Start X (mm)',
        'Start Y (mm)',
        'End X (mm)',
        'End Y (mm)',
        'Length (mm)',
        'Height (mm)',
      ];
      const wallsData = exportData.walls.map((w) => [
        w.wallIndex + 1,
        Math.round(w.startPoint.x),
        Math.round(w.startPoint.y),
        Math.round(w.endPoint.x),
        Math.round(w.endPoint.y),
        Math.round(w.length),
        w.height || 2800,
      ]);
      const wallsSheet = XLSX.utils.aoa_to_sheet([wallsHeader, ...wallsData]);
      XLSX.utils.book_append_sheet(workbook, wallsSheet, 'Walls');
    }

    // Modules Sheet
    if (exportData.modules && exportData.modules.length > 0) {
      const modulesHeader = [
        'Module Name',
        'Width (mm)',
        'Height (mm)',
        'Depth (mm)',
        'Position X',
        'Position Y',
        'Position Z',
      ];
      const modulesData = exportData.modules.map((m) => [
        m.name,
        m.dimensions.width,
        m.dimensions.height,
        m.dimensions.depth,
        Math.round(m.position.x),
        Math.round(m.position.y),
        Math.round(m.position.z),
      ]);
      const modulesSheet = XLSX.utils.aoa_to_sheet([modulesHeader, ...modulesData]);
      XLSX.utils.book_append_sheet(workbook, modulesSheet, 'Modules');
    }

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  /**
   * Generate HTML for PDF export (to be rendered by Puppeteer or similar)
   */
  async generatePdfHtml(sessionId: string): Promise<string> {
    const exportData = await this.exportSessionJSON(sessionId, {
      includeFloorPlan: true,
      includeBom: true,
      includeWalls: true,
      includeModules: true,
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>LiDAR Session Report - ${exportData.session.name || exportData.session.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; padding: 40px; }
    h1 { font-size: 28px; color: #1a365d; margin-bottom: 10px; }
    h2 { font-size: 20px; color: #2c5282; margin: 30px 0 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
    h3 { font-size: 16px; color: #4a5568; margin: 20px 0 10px; }
    .header { border-bottom: 3px solid #3182ce; padding-bottom: 20px; margin-bottom: 30px; }
    .subtitle { color: #718096; font-size: 14px; }
    .info-grid { display: grid; grid-template-columns: 150px 1fr; gap: 8px 20px; margin: 15px 0; }
    .info-label { color: #718096; font-weight: 500; }
    .info-value { color: #1a202c; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
    th { background: #edf2f7; color: #4a5568; font-weight: 600; text-align: left; padding: 12px 8px; border: 1px solid #e2e8f0; }
    td { padding: 10px 8px; border: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f7fafc; }
    .summary-box { background: #ebf8ff; border: 1px solid #90cdf4; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .summary-item { text-align: center; }
    .summary-value { font-size: 24px; font-weight: 700; color: #2b6cb0; }
    .summary-label { font-size: 12px; color: #4a5568; margin-top: 4px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #a0aec0; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏠 LiDAR Session Report</h1>
    <p class="subtitle">Generated on ${new Date().toLocaleString()}</p>
  </div>

  <h2>Session Information</h2>
  <div class="info-grid">
    <span class="info-label">Session Name:</span>
    <span class="info-value">${exportData.session.name || 'Unnamed Session'}</span>
    <span class="info-label">Session ID:</span>
    <span class="info-value">${exportData.session.id}</span>
    <span class="info-label">Status:</span>
    <span class="info-value">${exportData.session.status}</span>
    <span class="info-label">Created:</span>
    <span class="info-value">${exportData.session.createdAt.toLocaleString()}</span>
  </div>

  ${exportData.roomDimensions ? `
  <h2>Room Dimensions</h2>
  <div class="summary-box">
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-value">${Math.round(exportData.roomDimensions.width)}</div>
        <div class="summary-label">Width (mm)</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${Math.round(exportData.roomDimensions.depth)}</div>
        <div class="summary-label">Depth (mm)</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${Math.round(exportData.roomDimensions.height)}</div>
        <div class="summary-label">Height (mm)</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${exportData.roomDimensions.area.toFixed(2)}</div>
        <div class="summary-label">Area (m²)</div>
      </div>
    </div>
  </div>
  ` : ''}

  ${exportData.walls && exportData.walls.length > 0 ? `
  <h2>Detected Walls (${exportData.walls.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Wall #</th>
        <th>Start Point</th>
        <th>End Point</th>
        <th>Length (mm)</th>
        <th>Height (mm)</th>
      </tr>
    </thead>
    <tbody>
      ${exportData.walls.map((w) => `
        <tr>
          <td>${w.wallIndex + 1}</td>
          <td>(${Math.round(w.startPoint.x)}, ${Math.round(w.startPoint.y)})</td>
          <td>(${Math.round(w.endPoint.x)}, ${Math.round(w.endPoint.y)})</td>
          <td>${Math.round(w.length)}</td>
          <td>${w.height || 2800}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  ${exportData.modules && exportData.modules.length > 0 ? `
  <h2>Placed Modules (${exportData.modules.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Module</th>
        <th>Width (mm)</th>
        <th>Height (mm)</th>
        <th>Depth (mm)</th>
        <th>Position</th>
      </tr>
    </thead>
    <tbody>
      ${exportData.modules.map((m) => `
        <tr>
          <td>${m.name}</td>
          <td>${m.dimensions.width}</td>
          <td>${m.dimensions.height}</td>
          <td>${m.dimensions.depth}</td>
          <td>(${Math.round(m.position.x)}, ${Math.round(m.position.y)}, ${Math.round(m.position.z)})</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  ${exportData.bom ? `
  <h2>Bill of Materials Summary</h2>
  <div class="summary-box">
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-value">${exportData.bom.summary.totalModules}</div>
        <div class="summary-label">Total Modules</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${exportData.bom.summary.totalAreaSqm.toFixed(2)}</div>
        <div class="summary-label">Area (m²)</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${exportData.bom.summary.totalPlywoodSheets}</div>
        <div class="summary-label">Plywood Sheets</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${exportData.bom.summary.totalHardwareItems}</div>
        <div class="summary-label">Hardware Items</div>
      </div>
    </div>
  </div>

  <h3>Materials</h3>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Specification</th>
        <th>Quantity</th>
        <th>Unit</th>
      </tr>
    </thead>
    <tbody>
      ${exportData.bom.materials.map((m) => `
        <tr>
          <td>${m.category}</td>
          <td>${m.specification}</td>
          <td>${m.quantity.toFixed(2)}</td>
          <td>${m.unit}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h3>Hardware</h3>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Specification</th>
        <th>Quantity</th>
        <th>Unit</th>
      </tr>
    </thead>
    <tbody>
      ${exportData.bom.hardware.map((h) => `
        <tr>
          <td>${h.item}</td>
          <td>${h.specification}</td>
          <td>${h.quantity}</td>
          <td>${h.unit}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <div class="footer">
    <p>Generated by Nestup LiDAR System | Session ID: ${exportData.session.id}</p>
    <p>This document was automatically generated. For support, contact support@nestup.com</p>
  </div>
</body>
</html>
`;

    return html;
  }
}

// Export singleton instance
export const lidarExportService = new LidarExportService();
