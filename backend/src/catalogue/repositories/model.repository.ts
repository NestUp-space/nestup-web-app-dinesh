import { PrismaClient, ModelDefinition, ModelInputParameter, ModelBomItem, ProjectModelInstance } from '@prisma/client'; // Removed Prisma from import
// Import DTOs or specific types for creation/update data if needed
// e.g., import { CreateModelDefinitionData } from '../dtos/model.dto';

const prisma = new PrismaClient();

export class ModelRepository {
  constructor() {
    console.log('ModelRepository initialized');
  }

  async findAll(): Promise<ModelDefinition[]> {
    return prisma.modelDefinition.findMany({
      include: { inputParameters: true, bomItems: true },
    });
  }

  async findById(id: string): Promise<ModelDefinition | null> {
    return prisma.modelDefinition.findUnique({
      where: { id },
      include: { inputParameters: true, bomItems: true },
    });
  }

  async create(data: {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    sampleRuntimeInputsJson?: any; // Added to match Prisma schema
    expectedOutputSchemaJson?: any; // Added to match Prisma schema
    inputParameters?: Omit<ModelInputParameter, 'id' | 'modelDefinitionId' | 'modelDefinition'>[]; 
    bomItems?: Omit<ModelBomItem, 'id' | 'modelDefinitionId' | 'modelDefinition'>[]; 
  }): Promise<ModelDefinition> {
    return prisma.modelDefinition.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        sampleRuntimeInputsJson: data.sampleRuntimeInputsJson,
        expectedOutputSchemaJson: data.expectedOutputSchemaJson,
        inputParameters: data.inputParameters ? {
          create: data.inputParameters.map(param => ({
            inputName: param.inputName,
            displayLabel: param.displayLabel,
            inputType: param.inputType,
            defaultValue: param.defaultValue,
            options: param.options === null ? undefined : param.options,
            unit: param.unit,
            description: param.description,
          })),
        } : undefined,
        bomItems: data.bomItems ? {
          create: data.bomItems.map(item => ({
            itemName: item.itemName,
            itemType: item.itemType,
            itemDescription: item.itemDescription,
            itemLogicScript: item.itemLogicScript,
            addonModelId: item.addonModelId, // This should be addonCatalogueItemId if schema changes
            details: item.details === null ? undefined : item.details,
          })),
        } : undefined,
      },
      include: {
        inputParameters: true,
        bomItems: true,
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    description?: string | null;
    imageUrl?: string | null;
    sampleRuntimeInputsJson?: any;
    expectedOutputSchemaJson?: any;
    inputParameters?: Omit<ModelInputParameter, 'id' | 'modelDefinitionId' | 'modelDefinition'>[]; 
    bomItems?: Array<Omit<ModelBomItem, 'id' | 'modelDefinitionId' | 'modelDefinition'> & { itemLogicScript?: string | null }>; 
  }): Promise<ModelDefinition | null> {
    const { inputParameters, bomItems, ...modelData } = data;

    return prisma.$transaction(async (tx) => {
      await tx.modelDefinition.update({ // Result not assigned to unused updatedModel
        where: { id },
        data: modelData,
      });

      if (inputParameters !== undefined) {
        await tx.modelInputParameter.deleteMany({
          where: { modelDefinitionId: id }, // Reverted to modelDefinitionId for Prisma Client type compatibility
        });
        if (inputParameters.length > 0) {
          await tx.modelInputParameter.createMany({
            data: inputParameters.map(param => ({
              ...param,
              options: param.options === null ? undefined : param.options,
              modelDefinitionId: id, // Reverted to modelDefinitionId for Prisma Client type compatibility
            })),
          });
        }
      }

      if (bomItems !== undefined) {
        await tx.modelBomItem.deleteMany({
          where: { modelDefinitionId: id }, // Reverted to modelDefinitionId for Prisma Client type compatibility
        });
        if (bomItems.length > 0) {
          await tx.modelBomItem.createMany({
            data: bomItems.map(item => ({
              itemName: item.itemName,
              itemType: item.itemType,
              itemDescription: item.itemDescription,
              itemLogicScript: item.itemLogicScript,
              addonModelId: item.addonModelId, 
              details: item.details === null ? undefined : item.details,
              modelDefinitionId: id, // Reverted to modelDefinitionId for Prisma Client type compatibility
            })),
          });
        }
      }

      return tx.modelDefinition.findUnique({
        where: { id },
        include: {
          inputParameters: true,
          bomItems: true,
        },
      });
    });
  }

  async delete(id: string): Promise<ModelDefinition | null> {
    return prisma.modelDefinition.delete({ where: { id } });
  }

  // --- ModelInputParameter specific methods ---

  async createInputParameter(modelDefinitionId: string, data: Omit<ModelInputParameter, 'id' | 'modelDefinitionId' | 'modelDefinition'>): Promise<ModelInputParameter> { 
    const { options, ...restOfData } = data;
    return prisma.modelInputParameter.create({
      data: {
        ...restOfData,
        options: options === null ? undefined : options,
        modelDefinitionId, 
      },
    });
  }

  async findInputParameterById(id: string): Promise<ModelInputParameter | null> {
    return prisma.modelInputParameter.findUnique({
      where: { id },
    });
  }

  async findInputParametersByModelId(modelDefinitionId: string): Promise<ModelInputParameter[]> { 
    return prisma.modelInputParameter.findMany({
      where: { modelDefinitionId }, 
    });
  }

  async updateInputParameter(id: string, data: Partial<Omit<ModelInputParameter, 'id' | 'modelDefinitionId' | 'modelDefinition'>>): Promise<ModelInputParameter | null> { 
    const { options, ...restOfData } = data;
    const updateData: any = { ...restOfData };

    if (data.hasOwnProperty('options')) {
      updateData.options = options === null ? undefined : options;
    }
    
    return prisma.modelInputParameter.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteInputParameter(id: string): Promise<ModelInputParameter | null> {
    return prisma.modelInputParameter.delete({
      where: { id },
    });
  }

  // --- ModelBomItem specific methods ---

  async createBomItem(modelDefinitionId: string, data: Omit<ModelBomItem, 'id' | 'modelDefinitionId' | 'modelDefinition'> & { itemLogicScript?: string | null }): Promise<ModelBomItem> { 
    const { itemLogicScript, details, ...restOfData } = data;
    return prisma.modelBomItem.create({
      data: {
        ...restOfData,
        details: details === null ? undefined : details,
        itemLogicScript: itemLogicScript,
        modelDefinitionId,
      },
    });
  }

  async findBomItemById(id: string): Promise<ModelBomItem | null> {
    return prisma.modelBomItem.findUnique({
      where: { id },
    });
  }

  async findBomItemsByModelId(modelDefinitionId: string): Promise<ModelBomItem[]> { 
    return prisma.modelBomItem.findMany({
      where: { modelDefinitionId }, 
    });
  }

  async updateBomItem(id: string, data: Partial<Omit<ModelBomItem, 'id' | 'modelDefinitionId' | 'modelDefinition'> & { itemLogicScript?: string | null }>): Promise<ModelBomItem | null> { 
    const { itemLogicScript, details, ...restOfData } = data;
    const updateData: any = { ...restOfData };

    if (data.hasOwnProperty('itemLogicScript')) {
      updateData.itemLogicScript = itemLogicScript;
    }
    if (data.hasOwnProperty('details')) {
      updateData.details = details === null ? undefined : details;
    }
    
    return prisma.modelBomItem.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteBomItem(id: string): Promise<ModelBomItem | null> {
    return prisma.modelBomItem.delete({
      where: { id },
    });
  }

  // --- ProjectModelInstance specific methods ---
  async findProjectModelInstancesByProjectId(projectId: number): Promise<ProjectModelInstance[]> {
    return prisma.projectModelInstance.findMany({
      where: { projectId },
      include: {
        modelDefinition: true, // Include related model definition
        // Add other relations if needed, e.g., generatedPlankLists
      },
    });
  }
}
