import fs from 'fs/promises';
import path from 'path';

// Define __dirname for ES modules
const __dirname = path.dirname(__filename);

interface ModelTemplateInput {
  [key: string]: any; // Keeping this generic for now
}

export interface ModelTemplate {
  name: string;
  description: string;
  inputs: ModelTemplateInput;
  // Add other fields from JSON if needed by frontend, e.g., screenshotUrl
  screenshotUrl?: string; 
}

// Adjusted path to be relative to this file's location in dist/ after compilation
// Assuming dist/services/bim.service.js and models are in dist/bim/models/
// Or, more robustly, calculate from project root if possible, or ensure paths are correct post-build.
// For development, this path works if src/ is the execution context or transpiled paths align.
// With tsup config `publicDir: "src/bim/models"`, models are copied to the root of `dist`.
// If __dirname is dist/services, we need to go up two levels to dist/ and then access models.
// However, publicDir copies the *contents* of src/bim/models to dist.
// For development, this path works if src/ is the execution context or transpiled paths align.
const modelsDirectory = path.join(__dirname, '..', 'bim', 'models'); // For getModelTemplates
const rulesPath = path.join(__dirname, '..', 'bim', 'rules', 'globalRules.json'); // Path to globalRules

// Import the actual plank list generator
import { generatePlankList as dispatchToGenerator } from '../bim/generators/plankListGenerator'; // Corrected path
import { ModelDefinition, GlobalRules, Plank } from '../bim/types/bim.types'; // Ensure Plank is imported if service method returns it

export class BimService {
  private globalRules!: GlobalRules; // To be loaded in constructor

  constructor() {
    this.loadGlobalRules();
  }

  private async loadGlobalRules(): Promise<void> {
    try {
      const rulesFileContent = await fs.readFile(rulesPath, 'utf-8');
      this.globalRules = JSON.parse(rulesFileContent) as GlobalRules;
    } catch (error) {
      console.error('Failed to load global rules:', error);
      // Fallback or throw error if rules are critical
      // For now, let it proceed, generatePlankList will fail if rules are missing
    }
  }
  /**
   * Retrieves all available BIM model templates.
   */
  public async getModelTemplates(): Promise<ModelTemplate[]> {
    try {
      const files = await fs.readdir(modelsDirectory);
      const modelTemplates: ModelTemplate[] = [];

      for (const file of files) {
        if (path.extname(file).toLowerCase() === '.json') {
          const filePath = path.join(modelsDirectory, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const jsonData = JSON.parse(fileContent);

          if (jsonData.modelType && jsonData.runtimeInputs) {
            modelTemplates.push({
              name: jsonData.modelType,
              description: jsonData.description || '',
              inputs: jsonData.runtimeInputs,
              screenshotUrl: jsonData.screenshotUrl,
            });
          } else {
            // Optional: Log a warning for malformed files
            console.warn(`BIM Model file ${file} is missing modelType or runtimeInputs.`);
          }
        }
      }
      return modelTemplates;
    } catch (error) {
      console.error('Error reading BIM model templates:', error);
      // Consider throwing a more specific error or an error with a status code
      throw new Error('Failed to retrieve BIM model templates.');
    }
  }

  public async generatePlankList(
    modelName: string,
    inputs: Record<string, any>,
    boxNumber: string,
    packetNumber: string
  ): Promise<Plank[]> { // Return type should be Plank[] from bim.types
    console.log(`BimService: Generating plank list for ${modelName} with inputs:`, inputs, `Box: ${boxNumber}, Packet: ${packetNumber}`);

    if (!this.globalRules) {
      await this.loadGlobalRules(); // Ensure rules are loaded
      if (!this.globalRules) { // Check again after attempting to load
         throw new Error('Global rules could not be loaded.');
      }
    }
    
    const modelFileBaseName = modelName.toLowerCase().replace(/\s+/g, '');
    const modelFileName = `${modelFileBaseName}.json`;
    // Corrected path to models directory relative to this service file
    const modelFilePath = path.join(__dirname, '..', 'bim', 'models', modelFileName);

    try {
      const fileContent = await fs.readFile(modelFilePath, 'utf-8');
      const modelDefinition = JSON.parse(fileContent) as ModelDefinition;

      if (modelDefinition.modelType !== modelName) {
        // This can happen if filename doesn't perfectly match modelType in JSON
        console.warn(`Model type mismatch: expected ${modelName}, found ${modelDefinition.modelType} in ${modelFileName}`);
        // Potentially throw error or try to proceed if confident
      }

      // Call the dispatched generator function
      const planks = dispatchToGenerator(modelDefinition, inputs, this.globalRules, boxNumber, packetNumber);
      return planks;

    } catch (error) {
      console.error(`Error in BimService.generatePlankList for ${modelName}:`, error);
      throw new Error(`Failed to generate plank list for ${modelName}. Details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
