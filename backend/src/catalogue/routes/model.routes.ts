import express, { Request, Response, NextFunction } from 'express';
import { ModelService } from '../services/model.service';
import { 
  CreateModelDefinitionSchema,
  UpdateModelDefinitionSchema,
  CreateModelInputParameterSchema,
  UpdateModelInputParameterSchema,
  CreateModelBomItemSchema,
  UpdateModelBomItemSchema
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

// TEST ROUTE
router.get('/test-route', (req: Request, res: Response) => {
  console.log('--- /api/v1/catalogue/test-route HIT ---');
  res.status(StatusCodes.OK).send('Catalogue test route is working!');
});

// GET /catalogue - List all models
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await modelService.findAllModels();
    res.status(StatusCodes.OK).json(items);
  } catch (error: any) { // Explicitly type error as any to access properties
    console.error('--- ERROR IN GET /api/v1/catalogue ROUTE ---'); // Corrected log label
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    if (error.errors) { // For ZodErrors or similar
      console.error('Detailed Errors:', error.errors);
    }
    if (error.data) { // For custom ApiErrors
        console.error('Error Data:', error.data);
    }
    console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    next(error);
  }
});

// POST /catalogue - Create a new model
router.post('/', validateData(CreateModelDefinitionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newItem = await modelService.createModel(req.body);
    res.status(StatusCodes.CREATED).json(newItem);
  } catch (error: any) { // Added enhanced logging here as well for consistency
    console.error('--- ERROR IN POST /api/v1/catalogue ROUTE ---');
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    if (error.errors) { // For ZodErrors or similar
      console.error('Detailed Errors:', error.errors);
    }
    if (error.data) { // For custom ApiErrors
        console.error('Error Data:', error.data);
    }
    console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    next(error);
  }
});

// GET /catalogue/:id - Get a specific model by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await modelService.findModelById(id);
    if (!item) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Model not found' });
    }
    res.status(StatusCodes.OK).json(item);
  } catch (error) {
    console.error(`Error fetching model ${req.params.id}:`, error);
    next(error);
  }
});

// PUT /catalogue/:id - Update a model
router.put('/:id', validateData(UpdateModelDefinitionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updatedItem = await modelService.updateModel(id, req.body);
    if (!updatedItem) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Model not found' });
    }
    res.status(StatusCodes.OK).json(updatedItem);
  } catch (error) {
    console.error(`Error updating model ${req.params.id}:`, error);
    next(error);
  }
});

// DELETE /catalogue/:id - Delete a model
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deletedItem = await modelService.deleteModel(id);
    if (!deletedItem) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Model not found or already deleted' });
    }
    res.status(StatusCodes.OK).json({ message: 'Model deleted successfully', item: deletedItem });
  } catch (error) {
    console.error(`Error deleting model ${req.params.id}:`, error);
    if ((error as any).code === 'P2025') {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Model not found' });
    }
    next(error);
  }
});

// --- Model Input Parameters Routes ---

// POST /catalogue/:modelId/input-parameters - Create an input parameter for a model
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

// GET /catalogue/:modelId/input-parameters - List all input parameters for a model
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

// GET /catalogue/:modelId/input-parameters/:paramId - Get a specific input parameter
router.get('/:modelId/input-parameters/:paramId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paramId } = req.params;
    const parameter = await modelService.findInputParameterById(paramId);
    if (!parameter) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Input parameter not found' });
    }
    if (parameter.modelDefinitionId !== req.params.modelId) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Input parameter not found for this model' });
    }
    res.status(StatusCodes.OK).json(parameter);
  } catch (error) {
    console.error(`Error fetching input parameter ${req.params.paramId}:`, error);
    next(error);
  }
});

// PUT /catalogue/:modelId/input-parameters/:paramId - Update an input parameter
router.put('/:modelId/input-parameters/:paramId', validateData(UpdateModelInputParameterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId, paramId } = req.params;
    const existingParam = await modelService.findInputParameterById(paramId);
    if (!existingParam || existingParam.modelDefinitionId !== modelId) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Input parameter not found for this model.' });
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

// DELETE /catalogue/:modelId/input-parameters/:paramId - Delete an input parameter
router.delete('/:modelId/input-parameters/:paramId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId, paramId } = req.params;
    const existingParam = await modelService.findInputParameterById(paramId);
    if (!existingParam || existingParam.modelDefinitionId !== modelId) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Input parameter not found for this model.' });
    }
    
    const deletedParameter = await modelService.deleteInputParameter(paramId);
    if (!deletedParameter) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Input parameter not found' });
    }
    res.status(StatusCodes.OK).json({ message: 'Input parameter deleted successfully', parameter: deletedParameter });
  } catch (error) {
     if ((error as any).code === 'P2025') {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Input parameter not found' });
    }
    console.error(`Error deleting input parameter ${req.params.paramId}:`, error);
    next(error);
  }
});

// --- BOM Items Routes ---

// POST /catalogue/:modelId/bom-items - Create a BOM item for a model
router.post('/:modelId/bom-items', validateData(CreateModelBomItemSchema), async (req: Request, res: Response, next: NextFunction) => {
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

// GET /catalogue/:modelId/bom-items - List all BOM items for a model
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

// GET /catalogue/:modelId/bom-items/:itemId - Get a specific BOM item
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

// PUT /catalogue/:modelId/bom-items/:itemId - Update a BOM item
router.put('/:modelId/bom-items/:itemId', validateData(UpdateModelBomItemSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId, itemId } = req.params;
    const existingBomItem = await modelService.findBomItemById(itemId);
    if (!existingBomItem || existingBomItem.modelDefinitionId !== modelId) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'BOM item not found for this model.' });
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

// DELETE /catalogue/:modelId/bom-items/:itemId - Delete a BOM item
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
