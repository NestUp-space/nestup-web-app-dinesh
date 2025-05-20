import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { ServiceResponse } from '@/common/models/serviceResponse'; 
import { handleServiceResponse } from '@/common/utils/httpHandlers'; 

interface GlobalConstants {
  [key: string]: string | number | boolean | null;
}

let loadedGlobalConstants: GlobalConstants | null = null;
const constantsFilePath = path.join(process.cwd(), 'src/catalogue/config/globalConstants.json');

function getGlobalConstants(): ServiceResponse<GlobalConstants | null> {
  if (loadedGlobalConstants === null) {
    try {
      if (!fs.existsSync(constantsFilePath)) {
        console.error('globalConstants.json not found at path:', constantsFilePath);
        return ServiceResponse.failure<GlobalConstants | null>('Global constants file not found.', null, 404);
      }
      const fileContent = fs.readFileSync(constantsFilePath, 'utf-8');
      loadedGlobalConstants = JSON.parse(fileContent) as GlobalConstants;
      console.log('Global constants loaded successfully.');
    } catch (error: any) {
      console.error('Failed to load or parse globalConstants.json:', error.message);
      // Return a service response indicating failure but don't set loadedGlobalConstants to {} here,
      // let the caller decide how to handle the error state.
      return ServiceResponse.failure<GlobalConstants | null>(`Failed to load global constants: ${error.message}`, null, 500);
    }
  }
  // If loadedGlobalConstants is still null here, it means it failed to load on a previous attempt within this function call.
  // However, the design is that it's loaded once. If it's null, the initial load must have failed.
  // For subsequent calls if it's already loaded (even if it was an empty object due to prior error), it will be returned.
  // To ensure it tries to load if null:
  if (loadedGlobalConstants === null) { // Should not happen if logic above is correct, but as a safeguard
     return ServiceResponse.failure<GlobalConstants | null>('Global constants not loaded.', null, 500);
  }

  return ServiceResponse.success<GlobalConstants | null>('Global constants retrieved successfully.', loadedGlobalConstants);
}


export class CatalogueMetaController {
  constructor() {
    // Pre-load constants at service instantiation if desired, or rely on lazy loading in get
    // getGlobalConstants(); // Optional: pre-load on controller instantiation
    console.log('CatalogueMetaController initialized');
  }

  public async getGlobalConstants(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    const serviceResponse = getGlobalConstants();
    handleServiceResponse(serviceResponse, res);
  }
}
