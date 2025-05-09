import { ServiceResponse } from '../../common/models/serviceResponse';
import * as simpleBoxModel from '../models/simpleBox.json';
import * as lShapedBoxModel from '../models/lShapedBox.json';
import * as globalRules from '../rules/globalRules.json';
// import * as siteVisitTemplate from '../templates/siteVisitTemplate.json'; // Will be used later

// Import functions from generators and utils
import { generatePlankList } from '../generators/plankListGenerator'; // Updated path
import { formatCutListAsCsv, formatCutListAsJson, generateCutList } from '../generators/cutListGenerator'; // Updated path
import { formatGCodeAsString, generateGCode } from '../generators/gCodeGenerator'; // Updated path
import { generatePlanksSvg } from '../utils/visualizePlanks'; // Updated path

import { CutList, GlobalRules, MaterialProperties, ModelDefinition, ModelInfo, Plank } from '../types/bim.types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * @description Service for BIM process automation.
 */
export class BimService {
  private models: Map<string, ModelDefinition> = new Map();
  private globalRules: GlobalRules;

  constructor() {
    this.globalRules = globalRules as unknown as GlobalRules;
    this.loadModels();
  }

  /**
   * @description Loads all model definitions from the models directory
   */
  private loadModels(): void {
    // First, explicitly load the known models to ensure they're always available
    this.models.set('Simple Box', simpleBoxModel as unknown as ModelDefinition);
    this.models.set('L-Shaped Box', lShapedBoxModel as unknown as ModelDefinition);
    
    // Then, try to dynamically load any additional models from the directory
    try {
      const modelsDir = path.join(__dirname, '../models');
      if (fs.existsSync(modelsDir)) {
        const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.json'));
        modelFiles.forEach(file => {
          try {
            // Skip the models we've already loaded explicitly
            if (file === 'simpleBox.json' || file === 'lShapedBox.json') {
              return;
            }
            
            const modelPath = path.join(modelsDir, file);
            const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
            if (modelData.modelType) {
              this.models.set(modelData.modelType, modelData);
              console.log(`Loaded model: ${modelData.modelType}`);
            } else {
              console.warn(`Model file ${file} does not have a modelType property`);
            }
          } catch (error) {
            console.error(`Error loading model file ${file}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error loading models directory:', error);
    }
  }

  /**
   * @description Gets all available model types
   * @returns ServiceResponse with the list of model types
   */
  public getAvailableModelTypes(): ServiceResponse<string[]> {
    const modelTypes = Array.from(this.models.keys());
    return ServiceResponse.success('Available model types retrieved successfully.', modelTypes);
  }

  /**
   * @description Gets information about all available models
   * @returns ServiceResponse with the list of model info objects
   */
  public getAvailableModels(): ServiceResponse<ModelInfo[]> {
    const modelInfoList: ModelInfo[] = [];
    
    for (const [modelType, model] of this.models.entries()) {
      modelInfoList.push({
        modelType,
        description: model.description,
        screenshotUrl: model.screenshotUrl,
        runtimeInputs: model.runtimeInputs
      });
    }
    
    return ServiceResponse.success('Available models retrieved successfully.', modelInfoList);
  }

  /**
   * @description Processes site measurements.
   * @param measurements - The site measurements.
   * @returns ServiceResponse with status and message.
   */
  public processSiteMeasurements(measurements: unknown): ServiceResponse<unknown> {
    // TODO: Implement logic for processing site measurements
    console.log('Processing site measurements:', measurements);
    // Example: Validate measurements, store them, etc.
    return ServiceResponse.success('Site measurements processed successfully.', measurements);
  }

  /**
   * @description Creates a 3D design.
   * @param modelData - Data for the 3D model.
   * @returns ServiceResponse with status and message.
   */
  public create3DDesign(modelData: unknown): ServiceResponse<unknown> {
    // TODO: Implement logic for 3D design creation (e.g., calling SketchUp API)
    console.log('Creating 3D design with data:', modelData);
    // This would likely involve more complex operations in a real scenario
    return ServiceResponse.success('3D design creation initiated.', modelData);
  }

  /**
   * @description Generates a plank list for a given model and inputs.
   * @param modelType - The type of the model (e.g., "Simple Box").
   * @param inputs - The runtime inputs for the model.
   * @param boxNumber - The box number for plank ID generation.
   * @param packetNumber - The packet number for plank ID generation.
   * @returns ServiceResponse with the generated plank list or an error message.
   */
  public createPlankList(
    modelType: string, 
    inputs: any, 
    boxNumber?: string, // Optional for now, controller will ensure they are passed
    packetNumber?: string // Optional for now
  ): ServiceResponse<Plank[] | null> {
    try {
      // Get the model definition
      const model = this.getModelDefinition(modelType);
      if (!model) {
        return ServiceResponse.failure(`Model type "${modelType}" not found.`, null);
      }

      // Generate the plank list
      // The imported generatePlankList function needs to be able to use boxNumber and packetNumber
      const planks = generatePlankList(model, inputs, this.globalRules, boxNumber, packetNumber);
      return ServiceResponse.success('Plank list generated successfully.', planks);
    } catch (error) {
      console.error('Error generating plank list:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error generating plank list.',
        null
      );
    }
  }

  /**
   * @description Generates a cut list from a plank list.
   * @param plankList - The list of planks.
   * @param materialPropertiesMap - Optional map of material properties by code.
   * @returns ServiceResponse with the generated cut list or an error message.
   */
  public generateCutList(plankList: Plank[], materialPropertiesMap?: { [materialCode: string]: MaterialProperties }): ServiceResponse<CutList | null> {
    try {
      // Get material properties for all materials used in the plank list
      const materialCodes = new Set<string>();
      plankList.forEach(plank => {
        if (plank.materialCode) {
          materialCodes.add(plank.materialCode);
        }
      });

      // Use provided material properties or get them from models
      const materialProperties: { [materialCode: string]: MaterialProperties } = materialPropertiesMap || {};
      
      if (!materialPropertiesMap) {
        materialCodes.forEach(code => {
          if (!materialProperties[code]) {
            // Try to find the material in any model's sampleOnsiteInputs
            let found = false;
            for (const model of this.models.values()) {
              if (model.sampleOnsiteInputs && model.sampleOnsiteInputs[code]) {
                materialProperties[code] = model.sampleOnsiteInputs[code];
                found = true;
                break;
              }
            }
            
            if (!found) {
              // Use default properties if not found
              materialProperties[code] = {
                innerLaminate: 'default',
                outerLaminate: 'default',
                plyThickness_mm: 16,
                overallMaterialThickness_mm: 18,
                plyType: 'HDHMR'
              };
            }
          }
        });
      }

      // Generate the cut list
      const cutList = generateCutList(plankList, materialProperties);
      return ServiceResponse.success('Cut list generated successfully.', cutList);
    } catch (error) {
      console.error('Error generating cut list:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error generating cut list.',
        null
      );
    }
  }

  /**
   * @description Generates G-code from a cut list.
   * @param cutList - The cut list.
   * @returns ServiceResponse with the generated G-code or an error message.
   */
  public generateGCode(cutList: CutList): ServiceResponse<string | null> {
    try {
      // Generate the G-code program
      const gCodeProgram = generateGCode(cutList);
      
      // Format the G-code as a string
      const gCodeString = formatGCodeAsString(gCodeProgram);
      
      return ServiceResponse.success('G-code generated successfully.', gCodeString);
    } catch (error) {
      console.error('Error generating G-code:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error generating G-code.',
        null
      );
    }
  }

  /**
   * @description Generates an SVG visualization of a plank list.
   * @param plankList - The list of planks.
   * @param title - The title for the visualization.
   * @returns ServiceResponse with the generated SVG or an error message.
   */
  public visualizePlanks(plankList: Plank[], title?: string): ServiceResponse<string | null> {
    try {
      // Generate the SVG
      const svg = generatePlanksSvg(plankList, { title });
      
      return ServiceResponse.success('Plank visualization generated successfully.', svg);
    } catch (error) {
      console.error('Error generating plank visualization:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error generating plank visualization.',
        null
      );
    }
  }

  /**
   * @description Formats a cut list as a CSV string for download.
   * @param cutList - The cut list.
   * @returns ServiceResponse with the formatted CSV or an error message.
   */
  public formatCutListAsCsv(cutList: CutList): ServiceResponse<string | null> {
    try {
      const csv = formatCutListAsCsv(cutList);
      return ServiceResponse.success('Cut list formatted as CSV successfully.', csv);
    } catch (error) {
      console.error('Error formatting cut list as CSV:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error formatting cut list as CSV.',
        null
      );
    }
  }

  /**
   * @description Formats a cut list as a JSON string for download.
   * @param cutList - The cut list.
   * @returns ServiceResponse with the formatted JSON or an error message.
   */
  public formatCutListAsJson(cutList: CutList): ServiceResponse<string | null> {
    try {
      const json = formatCutListAsJson(cutList);
      return ServiceResponse.success('Cut list formatted as JSON successfully.', json);
    } catch (error) {
      console.error('Error formatting cut list as JSON:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error formatting cut list as JSON.',
        null
      );
    }
  }

  /**
   * @description Retrieves global BIM rules.
   * @returns ServiceResponse with the global rules.
   */
  public getGlobalRules(): ServiceResponse<GlobalRules> {
    return ServiceResponse.success('Global BIM rules retrieved successfully.', this.globalRules);
  }

  /**
   * @description Retrieves a specific BIM model template.
   * @param modelType - The type of the model.
   * @returns ServiceResponse with the model template or an error message.
   */
  public getModelTemplate(modelType: string): ServiceResponse<ModelDefinition | null> {
    const model = this.getModelDefinition(modelType);
    
    if (model) {
      return ServiceResponse.success(`${modelType} model template retrieved successfully.`, model);
    }
    
    return ServiceResponse.failure(`Model type "${modelType}" not found.`, null);
  }

  /**
   * @description Gets a model definition by type.
   * @param modelType - The type of the model.
   * @returns The model definition or undefined if not found.
   */
  private getModelDefinition(modelType: string): ModelDefinition | undefined {
    return this.models.get(modelType);
  }

  /**
   * @description Gets information about a specific model.
   * @param modelType - The type of the model.
   * @returns ServiceResponse with the model info or an error message.
   */
  public getModelInfo(modelType: string): ServiceResponse<ModelInfo | null> {
    const model = this.getModelDefinition(modelType);
    
    if (model) {
      const modelInfo: ModelInfo = {
        modelType,
        description: model.description,
        screenshotUrl: model.screenshotUrl,
        runtimeInputs: model.runtimeInputs
      };
      
      return ServiceResponse.success(`${modelType} model info retrieved successfully.`, modelInfo);
    }
    
    return ServiceResponse.failure(`Model type "${modelType}" not found.`, null);
  }

  /**
   * @description Validates inputs for a specific model.
   * @param modelType - The type of the model.
   * @param inputs - The inputs to validate.
   * @returns ServiceResponse with validation result.
   */
  public validateModelInputs(modelType: string, inputs: any): ServiceResponse<{ valid: boolean; errors?: string[] }> {
    const model = this.getModelDefinition(modelType);
    
    if (!model) {
      return ServiceResponse.failure(`Model type "${modelType}" not found.`, { valid: false, errors: [`Model type "${modelType}" not found.`] });
    }
    
    const errors: string[] = [];
    
    // Check that all required inputs are provided
    for (const [key, value] of Object.entries(model.runtimeInputs)) {
      // Skip if the input is null in the template (indicating it's optional)
      if (value === null) {
        continue;
      }
      
      // Check if the input is missing or null/undefined
      if (inputs[key] === undefined || inputs[key] === null) {
        errors.push(`Missing required input: ${key}`);
      }
    }
    
    // If there are errors, return them
    if (errors.length > 0) {
      return ServiceResponse.failure('Validation failed.', { valid: false, errors });
    }
    
    // Otherwise, return success
    return ServiceResponse.success('Validation successful.', { valid: true });
  }
}

// Export a singleton instance
export const bimService = new BimService();
