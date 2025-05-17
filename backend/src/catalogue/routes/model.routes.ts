import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ModelService } from '../services/model.service';
import { isAuthenticated } from '../../middlewares/auth.middleware';
import { hasPermission } from '../../middlewares/permission.middleware'; // Added permission middleware
import { PERMISSIONS } from '../../constants/permissions'; // Added permissions constants
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
      return res.status(StatusCodes.BAD_REQUEST).json({ // Added return
        message: 'Validation failed',
        errors: error.errors,
      });
    } else {
      return next(error); // Added return
    }
  }
};

// Multer setup for image upload (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => { // req prefixed with _
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image file.') as any, false);
    }
  }
});

// TEST ROUTE
router.get('/test-route', (_req: Request, res: Response) => { // req prefixed with _
  console.log('--- /api/v1/catalogue/test-route HIT ---');
  return res.status(StatusCodes.OK).send('Catalogue test route is working!'); // Added return
});

// --- Model Definition (Catalogue Item) Image Upload ---
// POST /catalogue/:modelId/image-upload - Upload an image for a model definition
router.post('/:modelId/image-upload', isAuthenticated, upload.single('catalogueImage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = req.params;
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'No image file uploaded.' });
    }
    
    const updatedModel = await modelService.uploadModelImage(modelId, req.file!); // Added non-null assertion for req.file as it's checked above
    
    return res.status(StatusCodes.OK).json(updatedModel); // Added return
  } catch (error: any) {
    console.error(`Error uploading image for model ${req.params.modelId}:`, error);
    if (error.message.includes('not found')) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
    }
    if (error.message.startsWith('Not an image!')) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
    return next(error); // Added return
  }
});


// GET /catalogue - List all models
router.get('/', async (_req: Request, res: Response, next: NextFunction) => { // req prefixed with _
  try {
    const items = await modelService.findAllModels();
    return res.status(StatusCodes.OK).json(items); // Added return
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
    return next(error); // Added return
  }
});

// POST /catalogue - Create a new model
router.post('/', validateData(CreateModelDefinitionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newItem = await modelService.createModel(req.body);
    return res.status(StatusCodes.CREATED).json(newItem); // Added return
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
    return next(error); // Added return
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
    return res.status(StatusCodes.OK).json(item); // Added return
  } catch (error) {
    console.error(`Error fetching model ${req.params.id}:`, error);
    return next(error); // Added return
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
    return res.status(StatusCodes.OK).json(updatedItem); // Added return
  } catch (error) {
    console.error(`Error updating model ${req.params.id}:`, error);
    return next(error); // Added return
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
    return res.status(StatusCodes.OK).json({ message: 'Model deleted successfully', item: deletedItem }); // Added return
  } catch (error) {
    console.error(`Error deleting model ${req.params.id}:`, error);
    if ((error as any).code === 'P2025') {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Model not found' });
    }
    return next(error); // Added return
  }
});

// --- Model Input Parameters Routes ---

// POST /catalogue/:modelId/input-parameters - Create an input parameter for a model
router.post('/:modelId/input-parameters', validateData(CreateModelInputParameterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = req.params;
    const newInputParameter = await modelService.createInputParameter(modelId, req.body);
    return res.status(StatusCodes.CREATED).json(newInputParameter); // Added return
  } catch (error) {
    console.error(`Error creating input parameter for model ${req.params.modelId}:`, error);
    if ((error as Error).message.includes('not found')) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: (error as Error).message });
    }
    return next(error); // Added return
  }
});

// GET /catalogue/:modelId/input-parameters - List all input parameters for a model
router.get('/:modelId/input-parameters', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = req.params;
    const parameters = await modelService.findInputParametersByModelId(modelId);
    return res.status(StatusCodes.OK).json(parameters); // Added return
  } catch (error) {
    console.error(`Error fetching input parameters for model ${req.params.modelId}:`, error);
    return next(error); // Added return
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
    return res.status(StatusCodes.OK).json(parameter); // Added return
  } catch (error) {
    console.error(`Error fetching input parameter ${req.params.paramId}:`, error);
    return next(error); // Added return
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
    return res.status(StatusCodes.OK).json(updatedParameter); // Added return
  } catch (error) {
    console.error(`Error updating input parameter ${req.params.paramId}:`, error);
    return next(error); // Added return
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
    return res.status(StatusCodes.OK).json({ message: 'Input parameter deleted successfully', parameter: deletedParameter }); // Added return
  } catch (error) {
     if ((error as any).code === 'P2025') {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Input parameter not found' });
    }
    console.error(`Error deleting input parameter ${req.params.paramId}:`, error);
    return next(error); // Added return
  }
});

// --- BOM Items Routes ---

// POST /catalogue/:modelId/bom-items - Create a BOM item for a model
router.post('/:modelId/bom-items', validateData(CreateModelBomItemSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = req.params;
    const newBomItem = await modelService.createBomItem(modelId, req.body);
    return res.status(StatusCodes.CREATED).json(newBomItem); // Added return
  } catch (error) {
    console.error(`Error creating BOM item for model ${req.params.modelId}:`, error);
    if ((error as Error).message.includes('not found')) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: (error as Error).message });
    }
    return next(error); // Added return
  }
});

// GET /catalogue/:modelId/bom-items - List all BOM items for a model
router.get(
  '/:modelId/bom-items', 
  isAuthenticated, 
  hasPermission(PERMISSIONS.CATALOGUE.VIEW), 
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = req.params;
    const bomItems = await modelService.findBomItemsByModelId(modelId);
    return res.status(StatusCodes.OK).json(bomItems); // Added return
  } catch (error) {
    console.error(`Error fetching BOM items for model ${req.params.modelId}:`, error);
    return next(error); // Added return
  }
});

// GET /catalogue/:modelId/bom-items/:itemId - Get a specific BOM item
router.get(
  '/:modelId/bom-items/:itemId', 
  isAuthenticated, 
  hasPermission(PERMISSIONS.CATALOGUE.VIEW), 
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const bomItem = await modelService.findBomItemById(itemId);
    if (!bomItem) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'BOM item not found' });
    }
    if (bomItem.modelDefinitionId !== req.params.modelId) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'BOM item not found for this model' });
    }
    return res.status(StatusCodes.OK).json(bomItem); // Added return
  } catch (error) {
    console.error(`Error fetching BOM item ${req.params.itemId}:`, error);
    return next(error); // Added return
  }
});

// PUT /catalogue/:modelId/bom-items/:itemId - Update a BOM item
router.put(
  '/:modelId/bom-items/:itemId', 
  isAuthenticated, 
  hasPermission(PERMISSIONS.CATALOGUE.EDIT), 
  validateData(UpdateModelBomItemSchema), 
  async (req: Request, res: Response, next: NextFunction) => {
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
    return res.status(StatusCodes.OK).json(updatedBomItem); // Added return
  } catch (error) {
    console.error(`Error updating BOM item ${req.params.itemId}:`, error);
    return next(error); // Added return
  }
});

// DELETE /catalogue/:modelId/bom-items/:itemId - Delete a BOM item
router.delete(
  '/:modelId/bom-items/:itemId', 
  isAuthenticated, 
  hasPermission(PERMISSIONS.CATALOGUE.EDIT), // Assuming EDIT covers deleting BOM items
  async (req: Request, res: Response, next: NextFunction) => {
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
    return res.status(StatusCodes.OK).json({ message: 'BOM item deleted successfully', item: deletedBomItem }); // Added return
  } catch (error) {
    if ((error as any).code === 'P2025') {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'BOM item not found' });
    }
    console.error(`Error deleting BOM item ${req.params.itemId}:`, error);
    return next(error); // Added return
  }
});

// GET /catalogue/project-instances/by-project/:projectId - List all project model instances for a project
router.get(
  '/project-instances/by-project/:projectId', 
  isAuthenticated, 
  hasPermission(PERMISSIONS.PROJECTS.VIEW), // This relates to project data
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const items = await modelService.findProjectModelInstancesByProjectId(projectId);
    return res.status(StatusCodes.OK).json(items);
  } catch (error) {
    console.error(`Error fetching project model instances for project ${req.params.projectId}:`, error);
    return next(error);
  }
});

export default router;
