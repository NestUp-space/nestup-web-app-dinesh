import { PrismaClient } from '@prisma/client';

interface PlankGenerationContext {
    boxNumber: string;
    modelDefinitionId: string;
    inputs: Record<string, any>;
}

interface GeneratedPlank {
    plankIdentifier: string;
    boxNumber: string;
    packetNumber?: string;
    width?: number;
    height?: number;
    materialCode?: string;
    holes?: Array<{x: number, y: number, z: number, t: number}>;
    grooves?: Array<{x1: number, y1: number, x2: number, y2: number, z: number, t: number}>;
}

export class PlankGenerationService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async generatePlanksForBox(context: PlankGenerationContext): Promise<GeneratedPlank[]> {
        try {
            // Fetch the model definition and its BOM items
            const modelDefinition = await this.prisma.modelDefinition.findUnique({
                where: { id: context.modelDefinitionId },
                include: {
                    bomItems: {
                        where: { itemType: 'PLANK' }
                    }
                }
            });

            if (!modelDefinition) {
                throw new Error(`Model definition ${context.modelDefinitionId} not found`);
            }

            const planks: GeneratedPlank[] = [];

            // Process each BOM item that is a plank
            for (const bomItem of modelDefinition.bomItems) {
                // Execute the item's logic script to get plank details
                const plankDetails = await this.executeBomItemLogicScript(
                    bomItem.itemLogicScript || '',
                    context.inputs,
                    bomItem.details || {}
                );

                // Create a plank with box number prefix
                const plank: GeneratedPlank = {
                    plankIdentifier: `${context.boxNumber}-${plankDetails.identifier || bomItem.itemName}`,
                    boxNumber: context.boxNumber,
                    packetNumber: plankDetails.packetNumber,
                    width: plankDetails.width,
                    height: plankDetails.height,
                    materialCode: plankDetails.materialCode,
                    holes: plankDetails.holes,
                    grooves: plankDetails.grooves
                };

                planks.push(plank);
            }

            return planks;

        } catch (error) {
            console.error('Error generating planks for box:', error);
            throw error;
        }
    }

    async generatePlanksForProject(projectId: number): Promise<GeneratedPlank[]> {
        try {
            // Fetch all model instances for the project, ordered by uiDisplayOrder
            const modelInstances = await this.prisma.projectModelInstance.findMany({
                where: { projectId },
                orderBy: { uiDisplayOrder: 'asc' },
                include: {
                    modelDefinition: true
                }
            });

            const allPlanks: GeneratedPlank[] = [];

            // Generate planks for each box/instance
            for (let i = 0; i < modelInstances.length; i++) {
                const instance = modelInstances[i];
                const boxNumber = (i + 1).toString(); // Box numbers start from 1

                const planks = await this.generatePlanksForBox({
                    boxNumber,
                    modelDefinitionId: instance.modelDefinitionId,
                    inputs: instance.runtimeInputsJson as Record<string, any>
                });

                allPlanks.push(...planks);
            }

            return allPlanks;

        } catch (error) {
            console.error('Error generating planks for project:', error);
            throw error;
        }
    }

    private async executeBomItemLogicScript(
        script: string,
        inputs: Record<string, any>,
        itemDetails: any
    ): Promise<any> {
        try {
            // Create a safe execution context
            const context = {
                inputs,
                itemDetails,
                result: {} as any
            };

            // Execute the script in a safe context
            const scriptFunction = new Function('context', `
                with(context) {
                    ${script}
                }
                return context.result;
            `);

            return scriptFunction(context);

        } catch (error) {
            console.error('Error executing BOM item logic script:', error);
            throw new Error('Failed to execute plank generation logic');
        }
    }
}
