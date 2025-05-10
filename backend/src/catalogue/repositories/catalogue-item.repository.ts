import { PrismaClient, CatalogueItemDefinition, CatalogueItemInputParameter, CatalogueItemBomItem } from '@prisma/client';
// Import DTOs or specific types for creation/update data if needed
// e.g., import { CreateCatalogueItemDefinitionData } from '../dtos/catalogue.dto';

const prisma = new PrismaClient();

export class CatalogueItemRepository {
  constructor() {
    console.log('CatalogueItemRepository initialized');
  }

  async findAll(): Promise<CatalogueItemDefinition[]> {
    return prisma.catalogueItemDefinition.findMany({
      include: { inputParameters: true, bomItems: true },
    });
  }

  async findById(id: string): Promise<CatalogueItemDefinition | null> {
    return prisma.catalogueItemDefinition.findUnique({
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
    inputParameters?: Omit<CatalogueItemInputParameter, 'id' | 'modelDefinitionId' | 'modelDefinition'>[];
    bomItems?: Omit<CatalogueItemBomItem, 'id' | 'modelDefinitionId' | 'modelDefinition'>[];
  }): Promise<CatalogueItemDefinition> {
    return prisma.catalogueItemDefinition.create({
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
    inputParameters?: Omit<CatalogueItemInputParameter, 'id' | 'modelDefinitionId' | 'modelDefinition'>[];
    bomItems?: Array<Omit<CatalogueItemBomItem, 'id' | 'modelDefinitionId' | 'modelDefinition'> & { itemLogicScript?: string | null }>;
  }): Promise<CatalogueItemDefinition | null> {
    const { inputParameters, bomItems, ...catalogueItemData } = data;

    return prisma.$transaction(async (tx) => {
      const updatedCatalogueItem = await tx.catalogueItemDefinition.update({
        where: { id },
        data: catalogueItemData,
      });

      if (inputParameters !== undefined) {
        await tx.catalogueItemInputParameter.deleteMany({
          where: { modelDefinitionId: id },
        });
        if (inputParameters.length > 0) {
          await tx.catalogueItemInputParameter.createMany({
            data: inputParameters.map(param => ({
              ...param,
              options: param.options === null ? undefined : param.options,
              modelDefinitionId: id, // This ID refers to CatalogueItemDefinition
            })),
          });
        }
      }

      if (bomItems !== undefined) {
        await tx.catalogueItemBomItem.deleteMany({
          where: { modelDefinitionId: id },
        });
        if (bomItems.length > 0) {
          await tx.catalogueItemBomItem.createMany({
            data: bomItems.map(item => ({
              itemName: item.itemName,
              itemType: item.itemType,
              itemDescription: item.itemDescription,
              itemLogicScript: item.itemLogicScript,
              addonModelId: item.addonModelId, // This should be addonCatalogueItemId if schema changes
              modelDefinitionId: id, // This ID refers to CatalogueItemDefinition
            })),
          });
        }
      }

      return tx.catalogueItemDefinition.findUnique({
        where: { id },
        include: {
          inputParameters: true,
          bomItems: true,
        },
      });
    });
  }

  async delete(id: string): Promise<CatalogueItemDefinition | null> {
    return prisma.catalogueItemDefinition.delete({ where: { id } });
  }

  // --- CatalogueItemInputParameter specific methods ---

  async createInputParameter(modelDefinitionId: string, data: Omit<CatalogueItemInputParameter, 'id' | 'modelDefinitionId' | 'modelDefinition'>): Promise<CatalogueItemInputParameter> {
    const { options, ...restOfData } = data;
    return prisma.catalogueItemInputParameter.create({
      data: {
        ...restOfData,
        options: options === null ? undefined : options,
        modelDefinitionId, // This ID refers to CatalogueItemDefinition
      },
    });
  }

  async findInputParameterById(id: string): Promise<CatalogueItemInputParameter | null> {
    return prisma.catalogueItemInputParameter.findUnique({
      where: { id },
    });
  }

  async findInputParametersByModelId(modelDefinitionId: string): Promise<CatalogueItemInputParameter[]> {
    return prisma.catalogueItemInputParameter.findMany({
      where: { modelDefinitionId }, // This ID refers to CatalogueItemDefinition
    });
  }

  async updateInputParameter(id: string, data: Partial<Omit<CatalogueItemInputParameter, 'id' | 'modelDefinitionId' | 'modelDefinition'>>): Promise<CatalogueItemInputParameter | null> {
    const { options, ...restOfData } = data;
    const updateData: any = { ...restOfData };

    if (data.hasOwnProperty('options')) {
      updateData.options = options === null ? undefined : options;
    }
    
    return prisma.catalogueItemInputParameter.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteInputParameter(id: string): Promise<CatalogueItemInputParameter | null> {
    return prisma.catalogueItemInputParameter.delete({
      where: { id },
    });
  }

  // --- CatalogueItemBomItem specific methods ---

  async createBomItem(modelDefinitionId: string, data: Omit<CatalogueItemBomItem, 'id' | 'modelDefinitionId' | 'modelDefinition'> & { itemLogicScript?: string | null }): Promise<CatalogueItemBomItem> {
    const { itemLogicScript, ...restOfData } = data;
    return prisma.catalogueItemBomItem.create({
      data: {
        ...restOfData,
        itemLogicScript: itemLogicScript,
        modelDefinitionId, // This ID refers to CatalogueItemDefinition
      },
    });
  }

  async findBomItemById(id: string): Promise<CatalogueItemBomItem | null> {
    return prisma.catalogueItemBomItem.findUnique({
      where: { id },
    });
  }

  async findBomItemsByModelId(modelDefinitionId: string): Promise<CatalogueItemBomItem[]> {
    return prisma.catalogueItemBomItem.findMany({
      where: { modelDefinitionId }, // This ID refers to CatalogueItemDefinition
    });
  }

  async updateBomItem(id: string, data: Partial<Omit<CatalogueItemBomItem, 'id' | 'modelDefinitionId' | 'modelDefinition'> & { itemLogicScript?: string | null }>): Promise<CatalogueItemBomItem | null> {
    const { itemLogicScript, ...restOfData } = data;
    const updateData: any = { ...restOfData };

    if (data.hasOwnProperty('itemLogicScript')) {
      updateData.itemLogicScript = itemLogicScript;
    }
    
    return prisma.catalogueItemBomItem.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteBomItem(id: string): Promise<CatalogueItemBomItem | null> {
    return prisma.catalogueItemBomItem.delete({
      where: { id },
    });
  }
}
