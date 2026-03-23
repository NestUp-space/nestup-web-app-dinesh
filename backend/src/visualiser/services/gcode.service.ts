/**
 * G-Code Service — CNC ZIP from nest results (server-side).
 */

import JSZip from 'jszip';
import { generateGCode } from '../pipeline/gcodeGenerator';
import type { CustomerDetails, GCodeResponse, NestResult } from '../types/visualiser.types';

function safeProjectName(customer: CustomerDetails | undefined): string {
  const raw = customer?.customerName?.trim() || 'CNC_Project';
  return raw.replace(/[/\\?%*:|"<>]/g, '_');
}

export class GCodeService {
  static async generateGCode(
    nestResults: NestResult[],
    customerDetails: CustomerDetails
  ): Promise<GCodeResponse> {
    const projectName = safeProjectName(customerDetails);
    const gcodeResults = generateGCode(nestResults, projectName);

    if (gcodeResults.length === 0) {
      return { zipBase64: '', fileCount: 0, fileNames: [] };
    }

    const zip = new JSZip();
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const mainFolderName = `${projectName}_G_CODES_${timestamp}`;
    const mainFolder = zip.folder(mainFolderName)!;

    const materialFolders = new Map<string, JSZip>();
    const thicknessFolders = new Map<string, JSZip>();

    gcodeResults.forEach((result) => {
      const matKey = result.materialFolder;
      const thickKey = `${matKey}_${result.thicknessFolder}`;

      if (!materialFolders.has(matKey)) {
        materialFolders.set(matKey, mainFolder.folder(matKey)!);
      }
      if (!thicknessFolders.has(thickKey)) {
        const matFolder = materialFolders.get(matKey)!;
        thicknessFolders.set(thickKey, matFolder.folder(result.thicknessFolder)!);
      }
      const thickFolder = thicknessFolders.get(thickKey)!;
      thickFolder.file(result.fileName, result.content);
    });

    const flatFolder = mainFolder.folder('ALL_NC_FILES_FLAT')!;
    gcodeResults.forEach((result) => {
      flatFolder.file(result.fileName, result.content);
    });

    const summary = [
      'CNC G-CODE GENERATION SUMMARY',
      '=========================================',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'FILES GENERATED:',
      ...gcodeResults.map(
        (r) => `- ${r.fileName} (Sheet: ${r.sheetName}, Planks: ${r.plankCount})`
      ),
      '',
      `Total Files: ${gcodeResults.length}`,
    ].join('\n');
    mainFolder.file('GENERATION_SUMMARY.txt', summary);

    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    const buffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);

    return {
      zipBase64: buffer.toString('base64'),
      fileCount: gcodeResults.length,
      fileNames: gcodeResults.map((r) => r.fileName),
    };
  }
}
