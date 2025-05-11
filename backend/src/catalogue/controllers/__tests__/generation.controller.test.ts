import { describe, it, expect, beforeEach, vi, MockInstance } from 'vitest';
import { mockDeep, DeepMockProxy } from 'vitest-mock-extended';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Material, ProjectModelInstance, ModelDefinition, ModelBomItem, BomItemType } from '@prisma/client';

import { GenerationController } from '../generation.controller';
import { ProjectModelInstanceService } from '../../services/project-model-instance.service'; // Corrected filename
import { JavaScriptFunctionService, ExecutedScriptResult } from '../../services/javascript-function.service';
import { PlankListGeneratorService } from '../../services/plank-list-generator.service';

// Mock Prisma Client
const prismaMock = mockDeep<PrismaClient>();
vi.mock('@prisma/client', async (importOriginal) => {
  const original = await importOriginal<typeof import('@prisma/client')>();
  return {
    ...original,
    PrismaClient: vi.fn(() => prismaMock),
  };
});

// Mock services
vi.mock('../../services/project-model-instance.service'); // Corrected filename
vi.mock('../../services/javascript-function.service');
vi.mock('../../services/plank-list-generator.service');

describe('GenerationController', () => {
  let generationController: GenerationController;
  let mockRequest: DeepMockProxy<Request>;
  let mockResponse: DeepMockProxy<Response>;
  let mockNext: NextFunction;

  // Mocks for service instances
  let mockProjectModelInstanceService: DeepMockProxy<ProjectModelInstanceService>; // Corrected type
  let mockJsFunctionService: DeepMockProxy<JavaScriptFunctionService>;
  let mockPlankListGeneratorService: DeepMockProxy<PlankListGeneratorService>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Re-initialize mocks for services before each test
    mockProjectModelInstanceService = mockDeep<ProjectModelInstanceService>(); // Corrected type
    mockJsFunctionService = mockDeep<JavaScriptFunctionService>();
    mockPlankListGeneratorService = mockDeep<PlankListGeneratorService>();

    // @ts-ignore - Mock constructor implementation
    ProjectModelInstanceService.mockImplementation(() => mockProjectModelInstanceService); // Corrected service name
    // @ts-ignore
    JavaScriptFunctionService.mockImplementation(() => mockJsFunctionService);
    // @ts-ignore
    PlankListGeneratorService.mockImplementation(() => mockPlankListGeneratorService);
    
    generationController = new GenerationController();

    mockRequest = mockDeep<Request>();
    mockResponse = mockDeep<Response>();
    mockNext = vi.fn() as NextFunction;

    // Setup mockResponse chainable methods
    mockResponse.status.mockReturnThis();
    mockResponse.json.mockReturnThis();
    mockResponse.send.mockReturnThis();
    mockResponse.setHeader.mockReturnThis();
  });

  describe('generatePlankList', () => {
    it('should generate a plank list CSV successfully with material enrichment', async () => {
      // Arrange
      const projectCatalogueItemInstanceId = 'test-instance-id';
      const projectId = 1;
      mockRequest.body = { projectCatalogueItemInstanceId };

      const mockExposedMaterial: Material = {
        id: 1, projectId, materialId: 'EXM001', plyThickness: 18, innerLaminateCode: 'ILC01', outerLaminateCode: 'OLC01', overallThickness: 19, plyType: 'HDHMR', grainDirection: 'Vertical', edgebandingInnerCode: 'EBI01', edgebandingExposedCode: 'EBE01', createdAt: new Date(), updatedAt: new Date()
      };
      const mockInnerMaterial: Material = {
        id: 2, projectId, materialId: 'INM001', plyThickness: 18, innerLaminateCode: 'ILC02', outerLaminateCode: 'OLC02', overallThickness: 19, plyType: 'MR Plywood', grainDirection: 'Horizontal', edgebandingInnerCode: 'EBI02', edgebandingExposedCode: 'EBE02', createdAt: new Date(), updatedAt: new Date()
      };

      const mockBomItem: ModelBomItem = {
        id: 'bom-item-1', modelDefinitionId: 'model-def-1', itemName: 'Test Plank', itemType: BomItemType.PLANK, itemDescription: 'A test plank', details: null, itemLogicScript: 'return { plankId: "P1", name: "Test Plank", width: 100, height: 200, thickness: runtimeInputs.exposedMaterialDefinition.overallThickness, materialCode: runtimeInputs.exposedMaterialDefinition.materialId, grainDirection: "Vertical" };', addonModelId: null
      };
      
      const mockInstance: ProjectModelInstance & { modelDefinition: ModelDefinition & { bomItems: ModelBomItem[] } } = {
        id: projectCatalogueItemInstanceId,
        projectId,
        modelDefinitionId: 'model-def-1',
        runtimeInputsJson: { exposedMaterialId: 'EXM001', innerMaterialId: 'INM001', someOtherParam: 500 },
        createdAt: new Date(),
        updatedAt: new Date(),
        modelDefinition: {
          id: 'model-def-1', name: 'Test Model', description: null, imageUrl: null, sampleRuntimeInputsJson: null, expectedOutputSchemaJson: null, createdAt: new Date(), updatedAt: new Date(),
          bomItems: [mockBomItem]
        }
      };
      
      // Mock Prisma calls via the global prismaMock
      // This is how the controller uses prisma directly
      (prismaMock.projectModelInstance.findUnique as MockInstance).mockResolvedValue(mockInstance);
      (prismaMock.material.findUnique as MockInstance)
        .mockResolvedValueOnce(mockExposedMaterial) // For exposedMaterialId
        .mockResolvedValueOnce(mockInnerMaterial);  // For innerMaterialId
        // Assuming backPanelMaterialId is not in runtimeInputsJson for this test

      const mockScriptOutput: ExecutedScriptResult = { plankId: "P1", name: "Test Plank", width: 100, height: 200, thickness: 19, materialCode: 'EXM001', grainDirection: "Vertical" };
      mockJsFunctionService.executeItemScript.mockResolvedValue(mockScriptOutput);

      const mockCsvData = "PlankID,Name,Description,Width,Height,MaterialCode,GrainDirection\nP1,Test Plank,A test plank,100,200,EXM001,Vertical";
      mockPlankListGeneratorService.generatePlankListCsv.mockReturnValue(mockCsvData);
      
      (prismaMock.generatedPlankList.create as MockInstance).mockResolvedValue({ id: 'gl-1', projectCatalogueItemInstanceId, csvContent: mockCsvData, filePath: null, generatedAt: new Date() });

      // Act
      await generationController.generatePlankList(mockRequest, mockResponse, mockNext);

      // Assert
      expect(prismaMock.projectModelInstance.findUnique).toHaveBeenCalledWith({
        where: { id: projectCatalogueItemInstanceId },
        include: { modelDefinition: { include: { bomItems: true } } },
      });
      expect(prismaMock.material.findUnique).toHaveBeenCalledWith({ where: { projectId_materialId: { projectId, materialId: 'EXM001' } } });
      expect(prismaMock.material.findUnique).toHaveBeenCalledWith({ where: { projectId_materialId: { projectId, materialId: 'INM001' } } });
      
      const expectedEnrichedInputs = {
        exposedMaterialId: 'EXM001',
        innerMaterialId: 'INM001',
        someOtherParam: 500,
        exposedMaterialDefinition: mockExposedMaterial,
        innerMaterialDefinition: mockInnerMaterial,
      };
      expect(mockJsFunctionService.executeItemScript).toHaveBeenCalledWith(mockBomItem.itemLogicScript, expect.objectContaining(expectedEnrichedInputs));
      
      expect(mockPlankListGeneratorService.generatePlankListCsv).toHaveBeenCalledWith([
        expect.objectContaining({ ...mockScriptOutput, name: "Test Plank", itemDescription: 'A test plank' })
      ]);
      expect(prismaMock.generatedPlankList.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(mockCsvData);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', `attachment; filename="plank_list_${projectCatalogueItemInstanceId}.csv"`);
    });

    it('should return 404 if instance not found', async () => {
      mockRequest.body = { projectCatalogueItemInstanceId: 'not-found-id' };
      (prismaMock.projectModelInstance.findUnique as MockInstance).mockResolvedValue(null);

      await generationController.generatePlankList(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Project catalogue item instance or its definition/BOM not found.' });
    });
    
    // Add more tests:
    // - Material ID in runtimeInputs but material not found in DB
    // - Script execution error
    // - Script output validation failure (if PlankOutputSchema was stricter and script returned invalid data)
    // - Empty resolvedPlanks (leading to empty CSV)

  });

  describe('testItemScript', () => {
    // Basic test for testItemScript
    it('should successfully test a script', async () => {
      const script = 'return { test: "ok" };';
      const inputs = { param1: 10 };
      mockRequest.body = { itemLogicScript: script, sampleRuntimeInputs: inputs };
      mockJsFunctionService.executeItemScript.mockResolvedValue({ test: "ok" });

      await generationController.testItemScript(mockRequest, mockResponse, mockNext);

      expect(mockJsFunctionService.executeItemScript).toHaveBeenCalledWith(script, inputs);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ test: "ok" });
    });

    it('should return 400 if itemLogicScript is empty', async () => {
      mockRequest.body = { itemLogicScript: '', sampleRuntimeInputs: {} };
      await generationController.testItemScript(mockRequest, mockResponse, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'itemLogicScript is required.' });
    });
    
    it('should return 400 if script execution fails (e.g. service throws)', async () => {
        const script = 'throw new Error("bad script");';
        const inputs = {};
        mockRequest.body = { itemLogicScript: script, sampleRuntimeInputs: inputs };
        mockJsFunctionService.executeItemScript.mockRejectedValue(new Error("Script execution failed: bad script"));

        await generationController.testItemScript(mockRequest, mockResponse, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "Script test failed: Script execution failed: bad script" });
    });

  });
});
