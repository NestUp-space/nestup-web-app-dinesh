import { Request, Response, NextFunction } from 'express';
import { ProjectModelInstanceService } from '../services/project-model-instance.service'; // Updated import
// import { RuleService } from '../services/rule.service'; // RuleService is effectively replaced by JSFunctionService for item logic
import { JavaScriptFunctionService, ExecutedScriptResult } from '../services/javascript-function.service'; // Import ExecutedScriptResult
import { PlankListGeneratorService } from '../services/plank-list-generator.service';
import { GeneratePlankListDto, TestItemScriptDto } from '../dtos/model.dto'; // Updated DTO path
import { PrismaClient, ModelBomItem, BomItemType, Material, ProjectModelInstance } from '@prisma/client'; // Updated Prisma types
import { z } from 'zod'; // For output validation

const prisma = new PrismaClient();

// Define the expected output schema for a plank item script (consistent with ModelService)
const PlankOutputSchema = z.object({
  plankId: z.string().min(1).optional(), // Made optional as script might not always provide it
  name: z.string().min(1).optional(), // Made optional as script might not always provide it
  width: z.number().optional(),
  height: z.number().optional(),
  thickness: z.number().optional(),
  materialCode: z.string().optional(),
  grainDirection: z.string().optional(), 
  edgeBanding: z.object({
    top: z.string().optional(),
    bottom: z.string().optional(),
    left: z.string().optional(),
    right: z.string().optional(),
  }).optional(),
  processingDetails: z.string().optional(),
}).catchall(z.any()); // Allow other properties returned by script

export class GenerationController {
  private projectModelInstanceService: ProjectModelInstanceService; // Updated type
  // private ruleService: RuleService; // Potentially deprecated or for fallback
  private jsFunctionService: JavaScriptFunctionService;
  private plankListGeneratorService: PlankListGeneratorService;

  constructor() {
    this.projectModelInstanceService = new ProjectModelInstanceService(); // Updated instantiation
    // this.ruleService = new RuleService();
    this.jsFunctionService = new JavaScriptFunctionService();
    this.plankListGeneratorService = new PlankListGeneratorService();
    console.log('GenerationController initialized');
  }

  generatePlankList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: GeneratePlankListDto = req.body;
      const { projectModelInstanceId } = dto; // Updated DTO destructuring to match expected DTO if it changes

      const instanceWithIncludes = await prisma.projectModelInstance.findUnique({ // Updated Prisma model
        where: { id: projectModelInstanceId }, // Updated variable name
        include: {
          modelDefinition: {
            include: {
              bomItems: true,
            },
          },
        },
      });

      if (!instanceWithIncludes || !instanceWithIncludes.modelDefinition || !instanceWithIncludes.modelDefinition.bomItems) {
        return res.status(404).json({ message: 'Project model instance or its definition/BOM not found.' }); // Updated message
      }
      const instance = instanceWithIncludes as ProjectModelInstance & { modelDefinition: { bomItems: ModelBomItem[] }}; // Updated bomItems type
      
      const originalRuntimeInputs = instance.runtimeInputsJson as any || {};
      const projectId = instance.projectId;
      
      // Prepare enriched runtime inputs with material definitions
      const enrichedRuntimeInputs: any = { ...originalRuntimeInputs };

      // Define keys for material IDs expected in originalRuntimeInputs
      const materialIdKeys = {
        exposed: 'exposedMaterialId',
        inner: 'innerMaterialId',
        backPanel: 'backPanelMaterialId',
      };
      
      // Define keys for the definitions to be added to enrichedRuntimeInputs
      const materialDefinitionKeys = {
        exposed: 'exposedMaterialDefinition',
        inner: 'innerMaterialDefinition',
        backPanel: 'backPanelMaterialDefinition',
      };

      // Fetch and add material definitions
      for (const [type, idKey] of Object.entries(materialIdKeys)) {
        const materialId = originalRuntimeInputs[idKey];
        if (materialId && typeof materialId === 'string') {
          try {
            const materialDefinition = await prisma.material.findUnique({
              where: { projectId_materialId: { projectId, materialId } },
            });
            if (materialDefinition) {
              enrichedRuntimeInputs[materialDefinitionKeys[type as keyof typeof materialDefinitionKeys]] = materialDefinition;
              console.log(`DEBUG: Added ${type} material definition for ID ${materialId}`);
            } else {
              console.warn(`WARN: Material with ID ${materialId} for type ${type} not found in project ${projectId}.`);
            }
          } catch (dbError) {
            console.error(`ERROR: Failed to fetch material ID ${materialId} for project ${projectId}:`, dbError);
          }
        }
      }
      
      const resolvedPlanks: ExecutedScriptResult[] = [];

      for (const bomItem of instance.modelDefinition.bomItems) { // No need to cast if instance type is correct
        if (bomItem.itemType === BomItemType.PLANK) {
          if (bomItem.itemLogicScript && bomItem.itemLogicScript.trim() !== '') {
            try {
              console.log(`DEBUG: Executing script for BOM item: ${bomItem.itemName} with inputs:`, JSON.stringify(enrichedRuntimeInputs, null, 2));
              const scriptOutput = await this.jsFunctionService.executeItemScript(
                bomItem.itemLogicScript,
                enrichedRuntimeInputs // Use enriched inputs
              );

              if (scriptOutput) {
                // Validate output against PlankOutputSchema
                const validationResult = PlankOutputSchema.safeParse(scriptOutput);
                if (validationResult.success) {
                  // Ensure the name from bomItem is used if script doesn't provide one, or merge.
                  const plankData = {
                    ...validationResult.data, // Script output
                    name: validationResult.data.name || bomItem.itemName, // Prioritize script name, fallback to bomItem.itemName
                    itemDescription: bomItem.itemDescription, // Always take from bomItem for consistency
                  };
                  resolvedPlanks.push(plankData);
                } else {
                  console.warn(
                    `Script output validation failed for BOM item ${bomItem.itemName} (ID: ${bomItem.id}):`,
                    validationResult.error.flatten()
                  );
                }
              } else {
                console.warn(`Script for BOM item ${bomItem.itemName} (ID: ${bomItem.id}) did not return properties.`);
              }
            } catch (scriptError: any) {
              console.error(`Error executing script for BOM item ${bomItem.itemName} (ID: ${bomItem.id}): ${scriptError.message}`);
            }
          } else {
            console.warn(`BOM item ${bomItem.itemName} (ID: ${bomItem.id}) is a PLANK but has no itemLogicScript.`);
          }
        }
      }

      if (resolvedPlanks.length === 0) {
        const emptyCsvData = this.plankListGeneratorService.generatePlankListCsv([]);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="plank_list_${instance.id}_empty.csv"`);
        return res.status(200).send(emptyCsvData);
      }
      
      // Cast to the type expected by PlankListGeneratorService if necessary,
      // assuming ResolvedPlank in that service matches the structure we are pushing.
      const csvData = this.plankListGeneratorService.generatePlankListCsv(resolvedPlanks as any);


      // Store the generated plank list
      const generatedList = await prisma.generatedPlankList.create({
        data: {
          projectModelInstanceId: instance.id,
          csvContent: csvData, 
          // filePath: Can be set if saving to a file system/S3
        },
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="plank_list_${instance.id}.csv"`);
      res.status(200).send(csvData);

    } catch (error) {
      next(error);
    }
  };

  // Placeholder for material estimate generation
  generateMaterialEstimate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Similar logic to plank list generation, but using a MaterialEstimatorService
      res.status(501).json({ message: 'Material estimate generation not implemented yet.' });
    } catch (error) {
      next(error);
    }
  };

  testItemScript = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: TestItemScriptDto = req.body; // Zod validation will be done by middleware
      const { itemLogicScript, sampleRuntimeInputs } = dto;

      if (!itemLogicScript || itemLogicScript.trim() === '') {
        return res.status(400).json({ message: 'itemLogicScript is required.' });
      }
      if (!sampleRuntimeInputs || typeof sampleRuntimeInputs !== 'object') {
        return res.status(400).json({ message: 'sampleRuntimeInputs must be a valid object.' });
      }

      const result = await this.jsFunctionService.executeItemScript(
        itemLogicScript,
        sampleRuntimeInputs
      );
      
      if (result === null) { // Indicates script execution failed internally in service without throwing an error that controller would catch
        return res.status(500).json({ message: 'Script execution failed to produce a result.' });
      }

      // TODO: Add Zod validation of 'result' against expected output schema here if desired for the test endpoint
      // For example, if it's always a Plank: PlankOutputSchema.parse(result);

      res.status(200).json(result);
    } catch (error: any) {
      // If jsFunctionService.executeItemScript throws, it will be caught here.
      console.error("Error in testItemScript controller:", error.message);
      res.status(400).json({ message: `Script test failed: ${error.message}` }); // Send specific error back
    }
  };
}
