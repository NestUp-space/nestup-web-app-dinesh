import { ModelDefinition, ModelInputParameter, ModelBomItem, BomItemType } from '@prisma/client';
import { ModelRepository } from '../repositories/model.repository';
import { uploadToS3 } from '../../utils/s3'; // For S3 uploads
import { 
  CreateModelDefinitionDto, 
  UpdateModelDefinitionDto,
  CreateModelInputParameterDto, 
  UpdateModelInputParameterDto,
  CreateModelBomItemDto,
  UpdateModelBomItemDto,
  ModelBomItemDto
} from '../dtos/model.dto';
import { JavaScriptFunctionService } from './javascript-function.service'; // Removed ExecutedScriptResult
import { z } from 'zod';
import { GLOBAL_CONSTANTS } from '../config/globalConstants';

// Define the expected output schema for a plank item script
const PlankOutputSchema = z.object({
  plankId: z.string().min(1),
  name: z.string().min(1),
  width: z.number(),
  height: z.number(),
  thickness: z.number(),
  materialCode: z.string(),
  grainDirection: z.string(),
  edgeBanding: z.object({
    top: z.string().optional(),
    bottom: z.string().optional(),
    left: z.string().optional(),
    right: z.string().optional(),
  }).optional(),
  processingDetails: z.string().optional(),
});

export class ModelService {
  private modelRepository: ModelRepository;
  private jsFunctionService: JavaScriptFunctionService;

  constructor() {
    this.modelRepository = new ModelRepository();
    this.jsFunctionService = new JavaScriptFunctionService();
    console.log('ModelService initialized');
  }

  private generateDefaultSampleInputsFromParams(
    inputParameters: Array<{ inputName: string; defaultValue?: string | number | boolean | null; inputType: string; [key: string]: any } | null> | undefined | null
  ): Record<string, any> | null {
    if (!inputParameters || inputParameters.length === 0) {
      return null;
    }
    const defaultInputs: Record<string, any> = {};
    let hasAtLeastOneDefault = false;
    for (const param of inputParameters) {
      if (param && param.defaultValue !== undefined && param.defaultValue !== null && param.inputName) {
        let value = param.defaultValue;
        // Attempt to parse based on inputType
        if (param.inputType === 'NUMBER') {
          const num = parseFloat(String(value));
          if (!isNaN(num)) {
            value = num;
          } else {
            // If parsing fails, skip this default value or handle as error
            console.warn(`Could not parse defaultValue "${param.defaultValue}" as NUMBER for input "${param.inputName}". Skipping.`);
            continue;
          }
        } else if (param.inputType === 'BOOLEAN') {
          if (typeof value === 'string') {
            value = value.toLowerCase() === 'true';
          } else {
            value = Boolean(value);
          }
        }
        // For other types like STRING, TEXT, SELECT, etc., use the defaultValue as is.
        defaultInputs[param.inputName] = value;
        hasAtLeastOneDefault = true;
      }
    }
    return hasAtLeastOneDefault ? defaultInputs : null;
  }

  private async validateBomItemScripts(
    bomItems: ModelBomItemDto[] | undefined,
    sampleRuntimeInputs: any
  ): Promise<void> {
    if (!bomItems || bomItems.length === 0) {
      return;
    }
    // Check if sampleRuntimeInputs is provided and is a non-null object
    if (!sampleRuntimeInputs || typeof sampleRuntimeInputs !== 'object') {
      const hasScripts = bomItems.some(b => b.itemLogicScript && typeof b.itemLogicScript === 'string' && b.itemLogicScript.trim() !== '');
      if (hasScripts) {
        // If scripts are present, inputs are mandatory and must be an object.
        throw new Error('Sample runtime inputs (must be an object) are required to test item logic scripts.');
      }
      return; // No scripts, or no inputs and no scripts that need them.
    }
    // Now, sampleRuntimeInputs is a non-null object. Check if it's empty.
    if (Object.keys(sampleRuntimeInputs).length === 0) {
      const hasScripts = bomItems.some(b => b.itemLogicScript && typeof b.itemLogicScript === 'string' && b.itemLogicScript.trim() !== '');
      if (hasScripts) {
        // If scripts are present, an empty inputs object is problematic.
        throw new Error('Sample runtime inputs object cannot be empty if item logic scripts are present.');
      }
      return; // Empty inputs object, but no scripts that need them.
    }

    for (const bomItem of bomItems) {
      const scriptToExecute = typeof bomItem.itemLogicScript === 'string' ? bomItem.itemLogicScript : null;
      if (scriptToExecute && scriptToExecute.trim() !== '') {
          try {
            console.log(`Testing script for BOM item: ${bomItem.itemName}`);
            // Changed executeItemScript to executeFunction
            // Assuming sampleRuntimeInputs is the context for the script
            const result = await this.jsFunctionService.executeItemScript(
              scriptToExecute,
              {
                runtimeInputs: sampleRuntimeInputs,
              globalConstants: {
                ...GLOBAL_CONSTANTS, // Spread all global constants
                plankDetails: bomItem.details || {} // Add plank-specific details
              }
            }
          );

          if (!result) {
            throw new Error(`Script for item "${bomItem.itemName}" did not produce a result.`);
          }
          
          if (bomItem.itemType === 'PLANK') {
            PlankOutputSchema.parse(result);
          } else {
            console.warn(`Script output validation not yet implemented for BOM item type: ${bomItem.itemType}`);
          }
          console.log(`Script for item "${bomItem.itemName}" tested successfully. Output:`, result);

        } catch (error: any) {
          console.error(`Validation failed for BOM item "${bomItem.itemName}": ${error.message}`);
          throw new Error(`Validation failed for BOM item "${bomItem.itemName}": ${error.message}`);
        }
      }
    }
  }

  async findAllModels(): Promise<ModelDefinition[]> {
    return this.modelRepository.findAll();
  }

  async findModelById(id: string): Promise<ModelDefinition | null> {
    return this.modelRepository.findById(id);
  }

  async createModel(data: CreateModelDefinitionDto): Promise<ModelDefinition> {
    let parsedSampleRuntimeInputs = null;
    if (data.sampleRuntimeInputsJson) {
      try {
        parsedSampleRuntimeInputs = JSON.parse(data.sampleRuntimeInputsJson);
      } catch (e) {
        throw new Error('Invalid JSON format for Sample Runtime Inputs.');
      }
    }

    // Only validate scripts if sample inputs were provided and there are BOM items with scripts
    if (parsedSampleRuntimeInputs && data.bomItems && data.bomItems.some(b => b.itemLogicScript && b.itemLogicScript.trim() !== '')) {
      await this.validateBomItemScripts(data.bomItems, parsedSampleRuntimeInputs);
    }

    const modelDataForRepo = {
      name: data.name,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      sampleRuntimeInputsJson: parsedSampleRuntimeInputs,
      inputParameters: data.inputParameters?.map(p => {
        let parsedOptions: any = undefined;
        if (p.options) {
          try { parsedOptions = JSON.parse(p.options); }
          catch (e) { 
            console.warn("Invalid JSON for input parameter options, storing as string or null", p.options);
            parsedOptions = p.options;
          }
        }
        return {
          inputName: p.inputName,
          displayLabel: p.displayLabel ?? null,
          inputType: p.inputType,
          defaultValue: p.defaultValue ?? null,
          options: parsedOptions, 
          unit: p.unit ?? null,
          description: p.description ?? null,
        };
      }),
      bomItems: data.bomItems?.map(b => ({
        itemName: b.itemName,
        itemType: b.itemType, 
        itemDescription: b.itemDescription ?? null,
        details: b.details ?? null, // Added details
        itemLogicScript: b.itemLogicScript ?? null,
        addonModelId: b.addonModelId ?? null,
      })),
    };
    
    if (modelDataForRepo.inputParameters && modelDataForRepo.inputParameters.length === 0) {
      delete modelDataForRepo.inputParameters;
    }
    if (modelDataForRepo.bomItems && modelDataForRepo.bomItems.length === 0) {
      delete modelDataForRepo.bomItems;
    }

    return this.modelRepository.create(modelDataForRepo);
  }

  async updateModel(id: string, data: UpdateModelDefinitionDto): Promise<ModelDefinition | null> {
    let parsedSampleRuntimeInputs = undefined;
    if (data.hasOwnProperty('sampleRuntimeInputsJson')) {
        if (data.sampleRuntimeInputsJson === null) {
            parsedSampleRuntimeInputs = null;
        } else if (data.sampleRuntimeInputsJson) {
            try {
                parsedSampleRuntimeInputs = JSON.parse(data.sampleRuntimeInputsJson);
            } catch (e) {
                throw new Error('Invalid JSON format for Sample Runtime Inputs.');
            }
        }
    }
    
    let effectiveSampleInputs = parsedSampleRuntimeInputs;
    // Explicitly type currentModelForInputs to include relations
    let currentModelForInputs: (ModelDefinition & { inputParameters: ModelInputParameter[], bomItems: ModelBomItem[] }) | null = null; 

    if (data.bomItems && !data.hasOwnProperty('sampleRuntimeInputsJson')) {
        currentModelForInputs = await this.modelRepository.findById(id) as (ModelDefinition & { inputParameters: ModelInputParameter[], bomItems: ModelBomItem[] }) | null; // findById includes relations
        effectiveSampleInputs = currentModelForInputs?.sampleRuntimeInputsJson ?? null;
    }

    let processedBomItemsForValidation: ModelBomItemDto[] | undefined = undefined;
    if (data.bomItems !== undefined) {
      processedBomItemsForValidation = data.bomItems
        .filter(b => b && b.itemName && b.itemType)
        .map(b => ({
          itemName: b.itemName!, 
          itemType: b.itemType!, 
          itemDescription: b.itemDescription ?? null,
          details: b.details ?? null, // Added details
          itemLogicScript: typeof b.itemLogicScript === 'string' ? b.itemLogicScript : null,
          addonModelId: b.addonModelId ?? null,
        }));
      
      if (processedBomItemsForValidation && processedBomItemsForValidation.length > 0) {
        const hasScripts = processedBomItemsForValidation.some(b => b.itemLogicScript && b.itemLogicScript.trim() !== '');
        
        if (hasScripts && (!effectiveSampleInputs || typeof effectiveSampleInputs !== 'object' || Object.keys(effectiveSampleInputs).length === 0)) {
          console.warn(`[ModelService.updateModel] sampleRuntimeInputs are missing or invalid for model ${id} during update with scripts. Attempting to generate from inputParameters.`);
          
          let modelInputParamsForDefaults: Array<{ inputName: string; defaultValue?: any; inputType: string; [key: string]: any }> | undefined | null = undefined;
          
          if (data.inputParameters) { // Prefer params from payload if available
            modelInputParamsForDefaults = data.inputParameters.map(p => ({
              ...p,
              inputName: p.inputName!, // Assuming inputName is required in DTO, or add filter
              inputType: p.inputType as string, // Cast enum to string
            }));
          } else {
            // If not in payload, try to get from currentModelForInputs (if fetched) or fetch model again
            if (!currentModelForInputs) {
              currentModelForInputs = await this.modelRepository.findById(id) as (ModelDefinition & { inputParameters: ModelInputParameter[], bomItems: ModelBomItem[] }) | null;
            }
            // The inputParameters on the model are stored directly as an array of objects
            if (currentModelForInputs && currentModelForInputs.inputParameters) { // This check should now be safe
              modelInputParamsForDefaults = currentModelForInputs.inputParameters.map(p => ({
                inputName: p.inputName,
                defaultValue: p.defaultValue,
                inputType: p.inputType as string, // Cast enum to string
                // Pass along other properties from ModelInputParameter if generateDefaultSampleInputsFromParams might use them
                displayLabel: p.displayLabel,
                options: p.options,
                unit: p.unit,
                description: p.description,
              }));
            }
          }
          
          if (modelInputParamsForDefaults) {
            const generatedDefaults = this.generateDefaultSampleInputsFromParams(modelInputParamsForDefaults);
            if (generatedDefaults && Object.keys(generatedDefaults).length > 0) {
              effectiveSampleInputs = generatedDefaults;
              console.log(`[ModelService.updateModel] Used generated default sample inputs for validation for model ${id}:`, effectiveSampleInputs);
            } else {
              console.warn(`[ModelService.updateModel] Could not generate default sample inputs, or generated inputs were empty for model ${id}. Validation might still fail if scripts require inputs.`);
            }
          } else {
            console.warn(`[ModelService.updateModel] No inputParameters found to generate default sample inputs for model ${id}.`);
          }
        }
        await this.validateBomItemScripts(processedBomItemsForValidation, effectiveSampleInputs);
      }
    }

    const modelDataForRepoUpdate: any = {};
    if (data.name !== undefined) modelDataForRepoUpdate.name = data.name;
    if (data.hasOwnProperty('description')) modelDataForRepoUpdate.description = data.description ?? null;
    if (data.hasOwnProperty('imageUrl')) modelDataForRepoUpdate.imageUrl = data.imageUrl ?? null;
    if (data.hasOwnProperty('sampleRuntimeInputsJson')) {
        modelDataForRepoUpdate.sampleRuntimeInputsJson = parsedSampleRuntimeInputs;
    }

    if (data.inputParameters !== undefined) {
      modelDataForRepoUpdate.inputParameters = data.inputParameters.map(p => {
        if (!p) return null; 
        let parsedOptions: any = undefined;
        if (p.options) {
          try { parsedOptions = JSON.parse(p.options); } catch (e) { parsedOptions = p.options; }
        }
        return {
          inputName: p.inputName!, 
          displayLabel: p.displayLabel ?? null,
          inputType: p.inputType!, 
          defaultValue: p.defaultValue ?? null,
          options: parsedOptions,
          unit: p.unit ?? null,
          description: p.description ?? null,
        };
      }).filter(p => p && p.inputName); 
    }

    if (processedBomItemsForValidation !== undefined) {
      modelDataForRepoUpdate.bomItems = processedBomItemsForValidation;
    }
    
    return this.modelRepository.update(id, modelDataForRepoUpdate);
  }

  async deleteModel(id: string): Promise<ModelDefinition | null> {
    return this.modelRepository.delete(id);
  }

  // --- ModelInputParameter Service Methods ---
  async createInputParameter(modelDefinitionId: string, data: CreateModelInputParameterDto): Promise<ModelInputParameter> {
    const modelExists = await this.findModelById(modelDefinitionId);
    if (!modelExists) {
      throw new Error(`Model with id ${modelDefinitionId} not found.`);
    }
    let parsedOptions: any = undefined;
    if (data.options) {
        try { parsedOptions = JSON.parse(data.options); } catch(e) { parsedOptions = data.options; }
    }
    const paramDataToCreate = {
        inputName: data.inputName,
        displayLabel: data.displayLabel ?? null,
        inputType: data.inputType,
        defaultValue: data.defaultValue ?? null,
        options: parsedOptions,
        unit: data.unit ?? null,
        description: data.description ?? null,
    };
    return this.modelRepository.createInputParameter(modelDefinitionId, paramDataToCreate);
  }

  async findInputParametersByModelId(modelId: string): Promise<ModelInputParameter[]> {
    return this.modelRepository.findInputParametersByModelId(modelId);
  }

  async findInputParameterById(id: string): Promise<ModelInputParameter | null> {
    return this.modelRepository.findInputParameterById(id);
  }
  
  async updateInputParameter(id: string, data: UpdateModelInputParameterDto): Promise<ModelInputParameter | null> {
    const updateData: Partial<Omit<ModelInputParameter, 'id' | 'modelDefinitionId' | 'modelDefinition'>> = {};
    if (data.inputName !== undefined) updateData.inputName = data.inputName;
    if (data.displayLabel !== undefined) updateData.displayLabel = data.displayLabel ?? null;
    if (data.inputType !== undefined) updateData.inputType = data.inputType;
    if (data.hasOwnProperty('defaultValue')) updateData.defaultValue = data.defaultValue ?? null;
    if (data.hasOwnProperty('options')) {
      const opts = data.options;
      if (opts === null || opts === undefined) {
        updateData.options = null;
      } else {
        try { updateData.options = JSON.parse(opts); } catch(e) { updateData.options = opts; }
      }
    }
    if (data.hasOwnProperty('unit')) updateData.unit = data.unit ?? null;
    if (data.hasOwnProperty('description')) updateData.description = data.description ?? null;

    return this.modelRepository.updateInputParameter(id, updateData);
  }

  async deleteInputParameter(id: string): Promise<ModelInputParameter | null> {
    return this.modelRepository.deleteInputParameter(id);
  }

  // --- ModelBomItem Service Methods ---
  async createBomItem(modelDefinitionId: string, data: CreateModelBomItemDto): Promise<ModelBomItem> {
    const modelExists = await this.findModelById(modelDefinitionId);
    if (!modelExists) {
      throw new Error(`Model with id ${modelDefinitionId} not found.`);
    }
    const bomItemDataToCreate = {
        itemName: data.itemName,
        itemType: data.itemType,
        itemDescription: data.itemDescription ?? null,
        details: data.details ?? null, // Added details
        itemLogicScript: typeof data.itemLogicScript === 'string' ? data.itemLogicScript : null,
        addonModelId: data.addonModelId ?? null,
    };
    return this.modelRepository.createBomItem(modelDefinitionId, bomItemDataToCreate);
  }

  async findBomItemsByModelId(modelId: string): Promise<ModelBomItem[]> {
    return this.modelRepository.findBomItemsByModelId(modelId);
  }

  async findBomItemById(id: string): Promise<ModelBomItem | null> {
    return this.modelRepository.findBomItemById(id);
  }

  async updateBomItem(id: string, data: UpdateModelBomItemDto): Promise<ModelBomItem | null> {
    let itemTypeForUpdate: BomItemType;

    // Explicitly narrow the type of 'data' based on 'itemType'
    // This helps TypeScript understand the specific shape of 'data' and 'data.details'
    switch (data.itemType) {
      case BomItemType.PLANK:
        itemTypeForUpdate = data.itemType; // data is UpdatePlankBomItemSchema
        break;
      case BomItemType.HARDWARE:
        itemTypeForUpdate = data.itemType; // data is UpdateHardwareBomItemSchema
        break;
      case BomItemType.ADDON:
        itemTypeForUpdate = data.itemType; // data is UpdateAddonBomItemSchema
        break;
      default:
        // This case should be unreachable if Zod validation on itemType (as a discriminated union key) is effective.
        // If reached, it implies an itemType not covered by the BomItemType enum/literals.
        // data.itemType would be 'never' here if all legitimate types are handled in cases.
        // Accessing data.itemType when data is 'never' causes a TS error.
        throw new Error('Unhandled BOM item type encountered in service logic.');
    }

    const updateData: Partial<Omit<ModelBomItem, 'id' | 'modelDefinitionId' | 'modelDefinition'>> = {
      itemType: itemTypeForUpdate,
    };

    // Safely access properties that are optional in the DTO
    if (data.itemName !== undefined) updateData.itemName = data.itemName;
    if (data.hasOwnProperty('itemDescription')) updateData.itemDescription = data.itemDescription ?? null;
    if (data.hasOwnProperty('itemLogicScript')) updateData.itemLogicScript = data.itemLogicScript ?? null;
    if (data.hasOwnProperty('addonModelId')) updateData.addonModelId = data.addonModelId ?? null;
    
    if (data.hasOwnProperty('details')) {
      if (itemTypeForUpdate === BomItemType.PLANK && data.itemType === BomItemType.PLANK) { // Double check for TS narrowing
        const plankDetailsInput = data.details; // data.details is now correctly typed for PLANK
        if (plankDetailsInput === null) {
          updateData.details = null;
        } else if (plankDetailsInput) {
          const finalPlankDetails = { ...plankDetailsInput };
          if (finalPlankDetails.edgeBanding === undefined) {
            finalPlankDetails.edgeBanding = {}; // Ensure edgeBanding object exists
          }
          updateData.details = finalPlankDetails;
        }
        // If plankDetailsInput is undefined (because details was optional and not provided),
        // updateData.details will not be set, and Prisma will not update it.
      } else if ((itemTypeForUpdate === BomItemType.HARDWARE && data.itemType === BomItemType.HARDWARE) || (itemTypeForUpdate === BomItemType.ADDON && data.itemType === BomItemType.ADDON)) {
        updateData.details = data.details; // data.details is any | null | undefined
      }
    }

    return this.modelRepository.updateBomItem(id, updateData);
  }

  async deleteBomItem(id: string): Promise<ModelBomItem | null> {
    return this.modelRepository.deleteBomItem(id);
  }

  // --- Model Image Upload ---
  async uploadModelImage(modelId: string, file: Express.Multer.File): Promise<ModelDefinition | null> {
    const modelExists = await this.modelRepository.findById(modelId);
    if (!modelExists) {
      throw new Error(`Model with id ${modelId} not found.`);
    }

    // The uploadToS3 utility likely handles its own key generation or uses a default.
    // If specific naming for catalogue images is needed, uploadToS3 might need modification
    // or a new utility function specific for catalogue images.
    // For now, we assume uploadToS3(file) is sufficient.
    const imageUrl = await uploadToS3(file);

    // Update the model definition with the new image URL
    const updatedModel = await this.modelRepository.update(modelId, { imageUrl });
    
    return updatedModel;
  }

  async findProjectModelInstancesByProjectId(projectId: string): Promise<any[]> { // Replace any[] with the actual type
    // TODO: Implement logic to fetch project model instances by project ID
    // This will likely involve calling a method on this.modelRepository
    // For now, returning an empty array as a placeholder
    console.log(`[ModelService] Finding project model instances for project ID: ${projectId}`);
    return this.modelRepository.findProjectModelInstancesByProjectId(parseInt(projectId, 10));
  }
}
