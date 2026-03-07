import { Request, Response, NextFunction } from 'express';
// import { RuleService } from '../services/rule.service'; // RuleService is effectively replaced by JSFunctionService for item logic
import { JavaScriptFunctionService } from '../services/javascript-function.service'; // Import ExecutedScriptResult
import { PlankListGeneratorService } from '../services/plank-list-generator.service';
import { GeneratePlankListDto, TestItemScriptDto } from '../dtos/model.dto'; // Updated DTO path
import { ModelBomItem, BomItemType, ProjectModelInstance } from '@prisma/client'; // Updated Prisma types
import { z } from 'zod'; // For output validation
import prisma from '../../config/db';

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
  hole: z.union([
    z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
      t: z.union([z.string(), z.number()]),
    }),
    z.string()
  ]).optional(),
  groove: z.union([
    z.object({
      x1: z.number(),
      y1: z.number(),
      x2: z.number(),
      y2: z.number(),
      z: z.number(),
      t: z.union([z.string(), z.number()]),
    }),
    z.string()
  ]).optional(),
}).catchall(z.any()); // Allow other properties returned by script

export class GenerationController {
  // private ruleService: RuleService; // Potentially deprecated or for fallback
  private jsFunctionService: JavaScriptFunctionService;
  private plankListGeneratorService: PlankListGeneratorService;

  constructor() {
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
        res.status(404).json({ message: 'Project model instance or its definition/BOM not found.' }); // Updated message
        return;
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
      
      const resolvedPlanks: any[] = [];

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
        res.status(200).send(emptyCsvData);
        return;
      }
      
      // Cast to the type expected by PlankListGeneratorService if necessary,
      // assuming ResolvedPlank in that service matches the structure we are pushing.
      const csvData = this.plankListGeneratorService.generatePlankListCsv(resolvedPlanks as any);


      // Store the generated plank list
      await prisma.generatedPlankList.create({
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
  generateMaterialEstimate = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // Similar logic to plank list generation, but using a MaterialEstimatorService
      res.status(501).json({ message: 'Material estimate generation not implemented yet.' });
    } catch (error) {
      next(error);
    }
  };

  testItemScript = async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const dto: TestItemScriptDto = req.body; // Zod validation will be done by middleware
      const { itemLogicScript, sampleRuntimeInputs } = dto;

      if (!itemLogicScript || itemLogicScript.trim() === '') {
        res.status(400).json({ message: 'itemLogicScript is required.' });
        return;
      }
      if (!sampleRuntimeInputs || typeof sampleRuntimeInputs !== 'object') {
        res.status(400).json({ message: 'sampleRuntimeInputs must be a valid object.' });
        return;
      }

      const result = await this.jsFunctionService.executeItemScript(
        itemLogicScript,
        sampleRuntimeInputs
      );
      
      if (result === null) { // Indicates script execution failed internally in service without throwing an error that controller would catch
        res.status(500).json({ message: 'Script execution failed to produce a result.' });
        return;
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

  generateProjectPlankList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.body;

      if (!projectId || typeof projectId !== 'number') {
        res.status(400).json({ message: 'Valid projectId is required.' });
        return;
      }

      const projectInstances = await prisma.projectModelInstance.findMany({
        where: { projectId: projectId },
        include: {
          modelDefinition: {
            include: {
              bomItems: true,
            },
          },
        },
      });

      if (!projectInstances || projectInstances.length === 0) {
        res.status(404).json({ message: 'No model instances found for this project.' });
        return;
      }

      const allResolvedPlanks: any[] = [];

      for (const instance of projectInstances) {
        if (!instance.modelDefinition || !instance.modelDefinition.bomItems) {
          console.warn(`Instance ${instance.id} is missing model definition or BOM items. Skipping.`);
          continue;
        }
        
        const originalRuntimeInputs = instance.runtimeInputsJson as any || {};
        const currentInstanceProjectId = instance.projectId; // Use projectId from the instance itself for material fetching
      
        const enrichedRuntimeInputs: any = { ...originalRuntimeInputs };
        const materialIdKeys = {
          exposed: 'exposedMaterialId',
          inner: 'innerMaterialId',
          backPanel: 'backPanelMaterialId',
        };
        const materialDefinitionKeys = {
          exposed: 'exposedMaterialDefinition',
          inner: 'innerMaterialDefinition',
          backPanel: 'backPanelMaterialDefinition',
        };

        for (const [type, idKey] of Object.entries(materialIdKeys)) {
          const materialId = originalRuntimeInputs[idKey];
          if (materialId && typeof materialId === 'string') {
            try {
              const materialDefinition = await prisma.material.findUnique({
                where: { projectId_materialId: { projectId: currentInstanceProjectId, materialId } },
              });
              if (materialDefinition) {
                enrichedRuntimeInputs[materialDefinitionKeys[type as keyof typeof materialDefinitionKeys]] = materialDefinition;
              } else {
                 console.warn(`WARN: Material with ID ${materialId} for type ${type} not found in project ${currentInstanceProjectId} for instance ${instance.id}.`);
              }
            } catch (dbError) {
              console.error(`ERROR: Failed to fetch material ID ${materialId} for project ${currentInstanceProjectId} (instance ${instance.id}):`, dbError);
            }
          }
        }

        for (const bomItem of instance.modelDefinition.bomItems) {
          if (bomItem.itemType === BomItemType.PLANK) {
            if (bomItem.itemLogicScript && bomItem.itemLogicScript.trim() !== '') {
              try {
                const scriptOutput = await this.jsFunctionService.executeItemScript(
                  bomItem.itemLogicScript,
                  enrichedRuntimeInputs
                );
                if (scriptOutput) {
                  const validationResult = PlankOutputSchema.safeParse(scriptOutput);
                  if (validationResult.success) {
                    const plankData = {
                      ...validationResult.data,
                      name: validationResult.data.name || bomItem.itemName,
                      itemDescription: bomItem.itemDescription,
                    };
                    allResolvedPlanks.push(plankData);
                  } else {
                     console.warn(`Script output validation failed for BOM item ${bomItem.itemName} (ID: ${bomItem.id}, Instance: ${instance.id}):`, validationResult.error.flatten());
                  }
                } else {
                  console.warn(`Script for BOM item ${bomItem.itemName} (ID: ${bomItem.id}, Instance: ${instance.id}) did not return properties.`);
                }
              } catch (scriptError: any) {
                console.error(`Error executing script for BOM item ${bomItem.itemName} (ID: ${bomItem.id}, Instance: ${instance.id}): ${scriptError.message}`);
              }
            } else {
              console.warn(`BOM item ${bomItem.itemName} (ID: ${bomItem.id}, Instance: ${instance.id}) is a PLANK but has no itemLogicScript.`);
            }
          }
        }
      }

      if (allResolvedPlanks.length === 0) {
        // Consider if sending an empty CSV is better or a 204/404
        const emptyCsvData = this.plankListGeneratorService.generatePlankListCsv([]);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="project_plank_list_${projectId}_empty.csv"`);
        res.status(200).send(emptyCsvData);
        return;
      }

      const csvData = this.plankListGeneratorService.generatePlankListCsv(allResolvedPlanks as any);
      
      // Optional: Store the aggregated CSV in GeneratedDocument
      // This requires deciding on a file storage strategy (S3 or DB blob)
      // For now, just returning the CSV directly.
      // Example for future:
      // await prisma.generatedDocument.create({
      //   data: {
      //     documentType: 'PROJECT_PLANK_LIST_CSV',
      //     fileName: `project_plank_list_${projectId}.csv`,
      //     filePath: 'path/to/s3/or/identifier', // if storing elsewhere
      //     // csvContent: csvData, // if storing directly and schema supports
      //     projectId: projectId,
      //     // userId: req.user.id // if auth is used
      //   }
      // });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="project_plank_list_${projectId}.csv"`);
      res.status(200).send(csvData);

    } catch (error) {
      next(error);
    }
  };
}
