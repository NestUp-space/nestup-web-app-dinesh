import express, { Request, Response, NextFunction } from 'express';
import { ModelService } from '../services/model.service';
import { 
  CreateModelDefinitionSchema, 
  UpdateModelDefinitionSchema,
  CreateModelInputParameterSchema,
  UpdateModelInputParameterSchema,
  CreateBillOfMaterialItemSchema, // Added
  UpdateBillOfMaterialItemSchema  // Added
} from '../dtos/model.dto';
import { ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();
const modelService = new ModelService();

// Middleware for Zod validation
const validateData = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Validation failed',
        errors: error.errors,
      });
    } else {
      next(error);
    }
  }
};

// GET /model-definitions - List all model definitions
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const models = await modelService.findAllModelDefinitions();
    res.status(StatusCodes.OK).json(models);
  } catch (error) {
    console.error('Error fetching model definitions:', error);
    next(error); // Pass to global error handler
  }
});

// POST /model-definitions - Create a new model definition
router.post('/', validateData(CreateModelDefinitionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newModel = await modelService.createModelDefinition(req.body);
    res.status(StatusCodes.CREATED).json(newModel);
  } catch (error) {
    console.error('Error creating model definition:', error);
    next(error);
  }
});

// GET /model-definitions/:id - Get a specific model definition by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const model = await modelService.findModelDefinitionById(id);
    if (!model) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Model definition not found' });
    }
    res.status(StatusCodes.OK).json(model);
  } catch (error) {
    console.error(`Error fetching model definition ${req.params.id}:`, error);
    next(error);
  }
});

// PUT /model-definitions/:id - Update a model definition
router.put('/:id', validateData(UpdateModelDefinitionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updatedModel = await modelService.updateModelDefinition(id, req.body);
    if (!updatedModel) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Model definition not found' });
    }
    res.status(StatusCodes.OK).json(updatedModel);
  } catch (error) {
    console.error(`Error updating model definition ${req.params.id}:`, error);
    next(error);
  }
});

// DELETE /model-definitions/:id - Delete a model definition
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deletedModel = await modelService.deleteModelDefinition(id);
    if (!deletedModel) {
      // This might depend on whether delete returns the deleted item or null if not found
      // Assuming it returns null if not found or throws an error handled by catch
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Model definition not found or already deleted' });
    }
    res.status(StatusCodes.OK).json({ message: 'Model definition deleted successfully', model: deletedModel });
  } catch (error) {
    // Prisma's delete throws an error if record not found by default (P2025)
    // We can check for specific Prisma error codes if needed
    console.error(`Error deleting model definition ${req.params.id}:`, error);
    if ((error as any).code === 'P2025') { // Prisma specific error code for record not found
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Model definition not found' });
    }
    next(error);
  }
});

// --- ModelInputParameter Routes (nested under /model-definitions/:modelId/input-parameters) ---

// POST /model-definitions/:modelId/input-parameters - Create an input parameter for a model
router.post('/:modelId/input-parameters', validateData(CreateModelInputParameterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = req.params;
    const newInputParameter = await modelService.createInputParameter(modelId, req.body);
    res.status(StatusCodes.CREATED).json(newInputParameter);
  } catch (error) {
    console.error(`Error creating input parameter for model ${req.params.modelId}:`, error);
    if ((error as Error).message.includes('not found')) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: (error as Error).message });
    }
    next(error);
  }
});

// GET /model-definitions/:modelId/input-parameters - List all input parameters for a model
router.get('/:modelId/input-parameters', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = req.params;
    const parameters = await modelService.findInputParametersByModelId(modelId);
    res.status(StatusCodes.OK).json(parameters);
  } catch (error) {
    console.error(`Error fetching input parameters for model ${req.params.modelId}:`, error);
    next(error);
  }
});

// GET /model-definitions/:modelId/input-parameters/:paramId - Get a specific input parameter
router.get('/:modelId/input-parameters/:paramId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paramId } = req.params;
    // We might want to ensure paramId belongs to modelId, but findInputParameterById is simpler for now
    const parameter = await modelService.findInputParameterById(paramId);
    if (!parameter) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Input parameter not found' });
    }
    // Optional: Check if parameter.modelDefinitionId === modelId
    if (parameter.modelDefinitionId !== req.params.modelId) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Input parameter not found for this model' });
    }
    res.status(StatusCodes.OK).json(parameter);
  } catch (error) {
    console.error(`Error fetching input parameter ${req.params.paramId}:`, error);
    next(error);
  }
});

// PUT /model-definitions/:modelId/input-parameters/:paramId - Update an input parameter
router.put('/:modelId/input-parameters/:paramId', validateData(UpdateModelInputParameterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId, paramId } = req.params;
    // Optional: Check if parameter belongs to model before updating
    const existingParam = await modelService.findInputParameterById(paramId);
    if (!existingParam || existingParam.modelDefinitionId !== modelId) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Input parameter not found for this model to update.' });
    }

    const updatedParameter = await modelService.updateInputParameter(paramId, req.body);
    if (!updatedParameter) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Input parameter not found' });
    }
    res.status(StatusCodes.OK).json(updatedParameter);
  } catch (error) {
    console.error(`Error updating input parameter ${req.params.paramId}:`, error);
    next(error);
  }
});

// DELETE /model-definitions/:modelId/input-parameters/:paramId - Delete an input parameter
router.delete('/:modelId/input-parameters/:paramId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId, paramId } = req.params;
    // Optional: Check if parameter belongs to model before deleting
    const existingParam = await modelService.findInputParameterById(paramId);
    if (!existingParam || existingParam.modelDefinitionId !== modelId) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Input parameter not found for this model to delete.' });
    }
    
    const deletedParameter = await modelService.deleteInputParameter(paramId);
    if (!deletedParameter) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Input parameter not found' });
    }
    res.status(StatusCodes.OK).json({ message: 'Input parameter deleted successfully', parameter: deletedParameter });
  } catch (error) {
     if ((error as any).code === 'P2025') { // Prisma specific error code for record not found
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Input parameter not found' });
    }
    console.error(`Error deleting input parameter ${req.params.paramId}:`, error);
    next(error);
  }
});


// --- BillOfMaterialItem Routes (nested under /model-definitions/:modelId/bom-items) ---

// POST /model-definitions/:modelId/bom-items - Create a BOM item for a model
router.post('/:modelId/bom-items', validateData(CreateBillOfMaterialItemSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = req.params;
    const newBomItem = await modelService.createBomItem(modelId, req.body);
    res.status(StatusCodes.CREATED).json(newBomItem);
  } catch (error) {
    console.error(`Error creating BOM item for model ${req.params.modelId}:`, error);
    if ((error as Error).message.includes('not found')) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: (error as Error).message });
    }
    next(error);
  }
});

// GET /model-definitions/:modelId/bom-items - List all BOM items for a model
router.get('/:modelId/bom-items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = req.params;
    const bomItems = await modelService.findBomItemsByModelId(modelId);
    res.status(StatusCodes.OK).json(bomItems);
  } catch (error) {
    console.error(`Error fetching BOM items for model ${req.params.modelId}:`, error);
    next(error);
  }
});

// GET /model-definitions/:modelId/bom-items/:itemId - Get a specific BOM item
router.get('/:modelId/bom-items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const bomItem = await modelService.findBomItemById(itemId);
    if (!bomItem) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'BOM item not found' });
    }
    if (bomItem.modelDefinitionId !== req.params.modelId) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'BOM item not found for this model' });
    }
    res.status(StatusCodes.OK).json(bomItem);
  } catch (error) {
    console.error(`Error fetching BOM item ${req.params.itemId}:`, error);
    next(error);
  }
});

// PUT /model-definitions/:modelId/bom-items/:itemId - Update a BOM item
router.put('/:modelId/bom-items/:itemId', validateData(UpdateBillOfMaterialItemSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId, itemId } = req.params;
    const existingBomItem = await modelService.findBomItemById(itemId);
    if (!existingBomItem || existingBomItem.modelDefinitionId !== modelId) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'BOM item not found for this model to update.' });
    }

    const updatedBomItem = await modelService.updateBomItem(itemId, req.body);
    if (!updatedBomItem) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'BOM item not found' });
    }
    res.status(StatusCodes.OK).json(updatedBomItem);
  } catch (error) {
    console.error(`Error updating BOM item ${req.params.itemId}:`, error);
    next(error);
  }
});

// DELETE /model-definitions/:modelId/bom-items/:itemId - Delete a BOM item
router.delete('/:modelId/bom-items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId, itemId } = req.params;
    const existingBomItem = await modelService.findBomItemById(itemId);
    if (!existingBomItem || existingBomItem.modelDefinitionId !== modelId) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'BOM item not found for this model to delete.' });
    }

    const deletedBomItem = await modelService.deleteBomItem(itemId);
    if (!deletedBomItem) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'BOM item not found' });
    }
    res.status(StatusCodes.OK).json({ message: 'BOM item deleted successfully', item: deletedBomItem });
  } catch (error) {
    if ((error as any).code === 'P2025') { 
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'BOM item not found' });
    }
    console.error(`Error deleting BOM item ${req.params.itemId}:`, error);
    next(error);
  }
});

export default router;
