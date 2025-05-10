import { CatalogueItemDefinition, CatalogueItemInputParameter, CatalogueItemBomItem, BomItemType } from '@prisma/client'; // Added BomItemType
import { CatalogueItemRepository } from '../repositories/catalogue-item.repository';
import { 
  CreateCatalogueItemDefinitionDto, 
  UpdateCatalogueItemDefinitionDto,
  CreateCatalogueItemInputParameterDto, 
  UpdateCatalogueItemInputParameterDto,
  CreateCatalogueItemBomItemDto,
  UpdateCatalogueItemBomItemDto,
  CatalogueItemBomItemDto
} from '../dtos/catalogue.dto';
import { JavaScriptFunctionService, ExecutedScriptResult } from './javascript-function.service'; // Import the JS service
import { z } from 'zod'; // For output validation

// Define the expected output schema for a plank item script
const PlankOutputSchema = z.object({
  plankId: z.string().min(1),
  name: z.string().min(1),
  width: z.number(),
  height: z.number(),
  thickness: z.number(),
  materialCode: z.string(),
  grainDirection: z.string(), // Could be an enum: z.enum(['Vertical', 'Horizontal', 'N/A'])
  // Add other optional or required fields as needed
  edgeBanding: z.object({
    top: z.string().optional(),
    bottom: z.string().optional(),
    left: z.string().optional(),
    right: z.string().optional(),
  }).optional(),
  processingDetails: z.string().optional(),
});


export class CatalogueItemService {
  private catalogueItemRepository: CatalogueItemRepository;
  private jsFunctionService: JavaScriptFunctionService;

  constructor() {
    this.catalogueItemRepository = new CatalogueItemRepository();
    this.jsFunctionService = new JavaScriptFunctionService();
    console.log('CatalogueItemService initialized');
  }

  private async validateBomItemScripts(
    bomItems: CatalogueItemBomItemDto[] | undefined,
    sampleRuntimeInputs: any
  ): Promise<void> {
    if (!bomItems || bomItems.length === 0) {
      return; // No scripts to validate
    }
    if (!sampleRuntimeInputs || typeof sampleRuntimeInputs !== 'object' || Object.keys(sampleRuntimeInputs).length === 0) {
      // If scripts exist but no sample inputs, we can't test.
      // Depending on policy, either warn, allow, or throw error.
      // For now, let's throw if there are scripts but no samples to test them.
      const hasScripts = bomItems.some(b => b.itemLogicScript && b.itemLogicScript.trim() !== '');
      if (hasScripts) {
        throw new Error('Sample runtime inputs are required to test item logic scripts.');
      }
      return; 
    }

    for (const bomItem of bomItems) {
      if (bomItem.itemLogicScript && bomItem.itemLogicScript.trim() !== '') {
        try {
          console.log(`Testing script for BOM item: ${bomItem.itemName}`);
          const result = await this.jsFunctionService.executeItemScript(
            bomItem.itemLogicScript,
            sampleRuntimeInputs
          );

          if (!result) {
            throw new Error(`Script for item "${bomItem.itemName}" did not produce a result.`);
          }
          
          // Validate the result against the expected schema (e.g., PlankOutputSchema)
          // This is a basic validation. More specific validation per itemType might be needed.
          if (bomItem.itemType === 'PLANK') { // Assuming PLANK type for now
            PlankOutputSchema.parse(result); // This will throw if validation fails
          } else {
            // TODO: Add validation for other BomItemTypes if they have scripts
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


  async findAllCatalogueItemDefinitions(): Promise<CatalogueItemDefinition[]> {
    return this.catalogueItemRepository.findAll();
  }

  async findCatalogueItemDefinitionById(id: string): Promise<CatalogueItemDefinition | null> {
    return this.catalogueItemRepository.findById(id);
  }

  async createCatalogueItemDefinition(data: CreateCatalogueItemDefinitionDto): Promise<CatalogueItemDefinition> {
    let parsedSampleRuntimeInputs = null;
    if (data.sampleRuntimeInputsJson) {
      try {
        parsedSampleRuntimeInputs = JSON.parse(data.sampleRuntimeInputsJson);
      } catch (e) {
        throw new Error('Invalid JSON format for Sample Runtime Inputs.');
      }
    }

    // Validate scripts before saving
    await this.validateBomItemScripts(data.bomItems, parsedSampleRuntimeInputs);

    const catalogueItemDataForRepo = {
      name: data.name, // Changed from modelType
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null, // Changed from screenshotUrl
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
        itemLogicScript: b.itemLogicScript ?? null,
        addonModelId: b.addonModelId ?? null, // Consider if this should be addonCatalogueItemId
      })),
    };
    
    if (catalogueItemDataForRepo.inputParameters && catalogueItemDataForRepo.inputParameters.length === 0) {
      delete catalogueItemDataForRepo.inputParameters;
    }
    if (catalogueItemDataForRepo.bomItems && catalogueItemDataForRepo.bomItems.length === 0) {
      delete catalogueItemDataForRepo.bomItems;
    }

    return this.catalogueItemRepository.create(catalogueItemDataForRepo);
  }

  async updateCatalogueItemDefinition(id: string, data: UpdateCatalogueItemDefinitionDto): Promise<CatalogueItemDefinition | null> {
    let parsedSampleRuntimeInputs = undefined; // Important: undefined means "don't update if not provided"
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
    
    // If bomItems or sampleRuntimeInputs are being updated, we need to re-validate scripts.
    // Fetch current sample inputs if only scripts are changing but not the sample inputs themselves.
    let effectiveSampleInputs = parsedSampleRuntimeInputs;
    if (data.bomItems && !data.hasOwnProperty('sampleRuntimeInputsJson')) {
        const currentCatalogueItem = await this.catalogueItemRepository.findById(id);
        effectiveSampleInputs = currentCatalogueItem?.sampleRuntimeInputsJson ?? null;
    }
    if (data.bomItems) { // Only validate if bomItems are part of the update payload
        await this.validateBomItemScripts(data.bomItems, effectiveSampleInputs);
    }


    const catalogueItemDataForRepoUpdate: any = {};
    if (data.name !== undefined) catalogueItemDataForRepoUpdate.name = data.name; // Changed from modelType
    if (data.hasOwnProperty('description')) catalogueItemDataForRepoUpdate.description = data.description ?? null;
    if (data.hasOwnProperty('imageUrl')) catalogueItemDataForRepoUpdate.imageUrl = data.imageUrl ?? null; // Changed from screenshotUrl
    if (data.hasOwnProperty('sampleRuntimeInputsJson')) {
        catalogueItemDataForRepoUpdate.sampleRuntimeInputsJson = parsedSampleRuntimeInputs;
    }

    if (data.inputParameters !== undefined) {
      catalogueItemDataForRepoUpdate.inputParameters = data.inputParameters.map(p => {
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

    if (data.bomItems !== undefined) {
      // Ensure that each item in bomItems has the required fields for creation
      catalogueItemDataForRepoUpdate.bomItems = data.bomItems
        .filter(b => b && b.itemName && b.itemType) // Filter out items missing essential fields
        .map(b => ({
          itemName: b.itemName!, // Asserting non-null due to filter
          itemType: b.itemType!, // Asserting non-null due to filter
          itemDescription: b.itemDescription ?? null,
          itemLogicScript: b.itemLogicScript ?? null,
          addonModelId: b.addonModelId ?? null,
        }));
    }
    
    return this.catalogueItemRepository.update(id, catalogueItemDataForRepoUpdate);
  }

  async deleteCatalogueItemDefinition(id: string): Promise<CatalogueItemDefinition | null> {
    return this.catalogueItemRepository.delete(id);
  }

  // --- CatalogueItemInputParameter Service Methods ---
  async createInputParameter(catalogueItemDefinitionId: string, data: CreateCatalogueItemInputParameterDto): Promise<CatalogueItemInputParameter> {
    const catalogueItemExists = await this.catalogueItemRepository.findById(catalogueItemDefinitionId);
    if (!catalogueItemExists) {
      throw new Error(`CatalogueItemDefinition with id ${catalogueItemDefinitionId} not found.`);
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
    return this.catalogueItemRepository.createInputParameter(catalogueItemDefinitionId, paramDataToCreate);
  }

  async findInputParametersByCatalogueItemDefinitionId(catalogueItemDefinitionId: string): Promise<CatalogueItemInputParameter[]> {
    return this.catalogueItemRepository.findInputParametersByModelId(catalogueItemDefinitionId); // Repository method still uses modelDefinitionId internally for FK
  }

  async findInputParameterById(id: string): Promise<CatalogueItemInputParameter | null> {
    return this.catalogueItemRepository.findInputParameterById(id);
  }
  
  async updateInputParameter(id: string, data: UpdateCatalogueItemInputParameterDto): Promise<CatalogueItemInputParameter | null> { // Corrected DTO type
    const updateData: Partial<Omit<CatalogueItemInputParameter, 'id' | 'modelDefinitionId' | 'modelDefinition'>> = {};
    if (data.inputName !== undefined) updateData.inputName = data.inputName;
    if (data.displayLabel !== undefined) updateData.displayLabel = data.displayLabel ?? null;
    if (data.inputType !== undefined) updateData.inputType = data.inputType;
    if (data.hasOwnProperty('defaultValue')) updateData.defaultValue = data.defaultValue ?? null;
    if (data.hasOwnProperty('options')) {
      const opts = data.options;
      if (opts === null || opts === undefined) {
        updateData.options = null; // Keep as null if explicitly set to null
      } else {
        try { updateData.options = JSON.parse(opts); } catch(e) { updateData.options = opts; }
      }
    }
    if (data.hasOwnProperty('unit')) updateData.unit = data.unit ?? null;
    if (data.hasOwnProperty('description')) updateData.description = data.description ?? null;

    return this.catalogueItemRepository.updateInputParameter(id, updateData);
  }

  async deleteInputParameter(id: string): Promise<CatalogueItemInputParameter | null> {
    return this.catalogueItemRepository.deleteInputParameter(id);
  }

  // --- CatalogueItemBomItem Service Methods ---
  async createBomItem(catalogueItemDefinitionId: string, data: CreateCatalogueItemBomItemDto): Promise<CatalogueItemBomItem> {
    const catalogueItemExists = await this.catalogueItemRepository.findById(catalogueItemDefinitionId);
    if (!catalogueItemExists) {
      throw new Error(`CatalogueItemDefinition with id ${catalogueItemDefinitionId} not found.`);
    }
    const bomItemDataToCreate = {
        itemName: data.itemName,
        itemType: data.itemType,
        itemDescription: data.itemDescription ?? null,
        itemLogicScript: data.itemLogicScript ?? null,
        addonModelId: data.addonModelId ?? null, // Consider if this should be addonCatalogueItemId
    };
    return this.catalogueItemRepository.createBomItem(catalogueItemDefinitionId, bomItemDataToCreate);
  }

  async findBomItemsByCatalogueItemDefinitionId(catalogueItemDefinitionId: string): Promise<CatalogueItemBomItem[]> {
    return this.catalogueItemRepository.findBomItemsByModelId(catalogueItemDefinitionId); // Repository method still uses modelDefinitionId internally for FK
  }

  async findBomItemById(id: string): Promise<CatalogueItemBomItem | null> {
    return this.catalogueItemRepository.findBomItemById(id);
  }

  async updateBomItem(id: string, data: UpdateCatalogueItemBomItemDto): Promise<CatalogueItemBomItem | null> {
    const updateData: Partial<Omit<CatalogueItemBomItem, 'id' | 'modelDefinitionId' | 'modelDefinition'>> = {};
    
    if (data.itemName !== undefined) updateData.itemName = data.itemName;
    if (data.itemType !== undefined) updateData.itemType = data.itemType;
    if (data.hasOwnProperty('itemDescription')) updateData.itemDescription = data.itemDescription ?? null;
    if (data.hasOwnProperty('itemLogicScript')) updateData.itemLogicScript = data.itemLogicScript ?? null;
    if (data.hasOwnProperty('addonModelId')) updateData.addonModelId = data.addonModelId ?? null; // Consider if this should be addonCatalogueItemId

    return this.catalogueItemRepository.updateBomItem(id, updateData);
  }

  async deleteBomItem(id: string): Promise<CatalogueItemBomItem | null> {
    return this.catalogueItemRepository.deleteBomItem(id);
  }
}
