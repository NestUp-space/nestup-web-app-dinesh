import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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
const modelsDirectory = path.join(__dirname, '..', 'bim', 'models');

export class BimService {
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

  // Placeholder for the plank list generation logic.
  // This will be significantly more complex and requires detailed rules for each modelType.
  public async generatePlankList(
    modelName: string,
    inputs: Record<string, any>,
    boxNumber: string, // Added based on plank ID requirement
    packetNumber: string // Added based on plank ID requirement
  ): Promise<Array<Record<string, any>>> { // Corrected return type
    console.log(`Generating plank list for ${modelName} with inputs:`, inputs, `Box: ${boxNumber}, Packet: ${packetNumber}`);

    // Find the model file
    // Ensure modelName is derived correctly if it contains spaces, e.g., "Simple Box" -> "simplebox.json"
    const modelFileBaseName = modelName.toLowerCase().replace(/\s+/g, '');
    const modelFileName = `${modelFileBaseName}.json`;
    const modelFilePath = path.join(modelsDirectory, modelFileName);

    try {
      const fileContent = await fs.readFile(modelFilePath, 'utf-8');
      const modelData = JSON.parse(fileContent);

      if (!modelData.planks || !Array.isArray(modelData.planks)) {
        throw new Error(`Model ${modelName} does not have a valid 'planks' definition.`);
      }

      const generatedPlanks: Array<Record<string, any>> = [];

      // Geometric calculation logic per modelType
      // This is a simplified example for "Simple Box"
      if (modelData.modelType === "Simple Box") {
        const { 
          boxHeight, boxWidth, boxDepth, 
          outerMaterialCode, innerMaterialCode, backMaterialCode 
          // TODO: Handle leftAdjacency, rightAdjacency, door, numberOfShelves for more accurate calcs
        } = inputs;

        // Validate required inputs
        if (boxHeight == null || boxWidth == null || boxDepth == null) {
          throw new Error("Missing required dimensions (boxHeight, boxWidth, boxDepth) for Simple Box.");
        }
        
        // Example: Back Plank
        const backPlankDef = modelData.planks.find((p: any) => p.name === "Back Plank");
        if (backPlankDef) {
          generatedPlanks.push({
            plankId: `B${boxNumber}P${packetNumber}${backPlankDef.plankId.substring(backPlankDef.plankId.indexOf('_'))}`, // e.g., B1P1_Back
            name: backPlankDef.name,
            width: boxWidth,
            height: boxHeight,
            materialCode: backMaterialCode || outerMaterialCode, // Fallback logic for material
            // grainDirection: backPlankDef.grainDirection, // Or determined by logic
          });
        }

        // Example: Left Plank
        const leftPlankDef = modelData.planks.find((p: any) => p.name === "Left Plank");
        if (leftPlankDef) {
          generatedPlanks.push({
            plankId: `B${boxNumber}P${packetNumber}${leftPlankDef.plankId.substring(leftPlankDef.plankId.indexOf('_'))}`,
            name: leftPlankDef.name,
            width: boxDepth, // Typically depth for side planks
            height: boxHeight,
            materialCode: outerMaterialCode,
          });
        }
        
        // Example: Right Plank
        const rightPlankDef = modelData.planks.find((p: any) => p.name === "Right Plank");
        if (rightPlankDef) {
          generatedPlanks.push({
            plankId: `B${boxNumber}P${packetNumber}${rightPlankDef.plankId.substring(rightPlankDef.plankId.indexOf('_'))}`,
            name: rightPlankDef.name,
            width: boxDepth,
            height: boxHeight,
            materialCode: outerMaterialCode,
          });
        }

        // Example: Top Plank
        const topPlankDef = modelData.planks.find((p: any) => p.name === "Top Plank");
        if (topPlankDef) {
          generatedPlanks.push({
            plankId: `B${boxNumber}P${packetNumber}${topPlankDef.plankId.substring(topPlankDef.plankId.indexOf('_'))}`,
            name: topPlankDef.name,
            width: boxWidth, 
            height: boxDepth, // Top/bottom planks often use depth for their 'height' dimension
            materialCode: outerMaterialCode,
          });
        }

        // Example: Bottom Plank
        const bottomPlankDef = modelData.planks.find((p: any) => p.name === "Bottom Plank");
        if (bottomPlankDef) {
          generatedPlanks.push({
            plankId: `B${boxNumber}P${packetNumber}${bottomPlankDef.plankId.substring(bottomPlankDef.plankId.indexOf('_'))}`,
            name: bottomPlankDef.name,
            width: boxWidth,
            height: boxDepth,
            materialCode: outerMaterialCode,
          });
        }
        // TODO: Add logic for shelves if inputs.numberOfShelves > 0
        // TODO: Add logic for door if inputs.door.hasDoor is true

      } else if (modelData.modelType === "L-Shaped Box") {
        // TODO: Implement logic for L-Shaped Box
        throw new Error("Plank generation for L-Shaped Box is not yet implemented.");
      } else {
        throw new Error(`Unsupported modelType for plank generation: ${modelData.modelType}`);
      }

      if (generatedPlanks.length === 0 && modelData.planks.length > 0) {
        // This might happen if input validation is too strict or mapping logic is incomplete
        console.warn("No planks were generated, though model definition exists.");
      }
      
      return generatedPlanks;

    } catch (error) {
      console.error(`Error generating plank list for ${modelName}:`, error);
      throw new Error(`Failed to generate plank list for ${modelName}. Details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
