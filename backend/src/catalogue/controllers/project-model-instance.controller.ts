import { Request, Response } from 'express';
import prisma from '../../config/db';
// Create a new project model instance
export const createProjectModelInstance = async (req: Request, res: Response) => {
    const { id: projectIdStr } = req.params; // Changed to id
    const { modelDefinitionId, runtimeInputsJson, uiDisplayOrder } = req.body;

    try {
        const instance = await prisma.projectModelInstance.create({
            data: {
                projectId: parseInt(projectIdStr), // Use parsed id
                modelDefinitionId,
                runtimeInputsJson,
                uiDisplayOrder: uiDisplayOrder || 0,
            },
        });

        res.status(201).json(instance);
    } catch (error) {
        console.error('Error creating project model instance:', error);
        res.status(500).json({ message: 'Failed to create project model instance' });
    }
};

// Get all project model instances for a project
export const getAllProjectModelInstancesByProjectId = async (req: Request, res: Response) => {
    const { id: projectIdStr } = req.params; // Changed to id

    try {
        const instances = await prisma.projectModelInstance.findMany({
            where: {
                projectId: parseInt(projectIdStr), // Use parsed id
            },
            orderBy: {
                uiDisplayOrder: 'asc',
            },
        });

        res.json(instances);
    } catch (error) {
        console.error('Error fetching project model instances:', error);
        res.status(500).json({ message: 'Failed to fetch project model instances' });
    }
};

// Get a specific project model instance by ID
export const getProjectModelInstanceById = async (req: Request, res: Response): Promise<void> => {
    const { instanceId } = req.params;

    try {
        const instance = await prisma.projectModelInstance.findUnique({
            where: {
                id: instanceId,
            },
        });

        if (!instance) {
            res.status(404).json({ message: 'Project model instance not found' });
            return;
        }

        res.json(instance);
    } catch (error) {
        console.error('Error fetching project model instance:', error);
        res.status(500).json({ message: 'Failed to fetch project model instance' });
    }
};

// Update a project model instance
export const updateProjectModelInstance = async (req: Request, res: Response) => {
    const { instanceId } = req.params;
    const { modelDefinitionId, runtimeInputsJson, uiDisplayOrder } = req.body;

    try {
        const instance = await prisma.projectModelInstance.update({
            where: {
                id: instanceId,
            },
            data: {
                ...(modelDefinitionId && { modelDefinitionId }),
                ...(runtimeInputsJson && { runtimeInputsJson }),
                ...(uiDisplayOrder !== undefined && { uiDisplayOrder }),
            },
        });

        res.json(instance);
    } catch (error) {
        console.error('Error updating project model instance:', error);
        res.status(500).json({ message: 'Failed to update project model instance' });
    }
};

// Delete a project model instance
export const deleteProjectModelInstance = async (req: Request, res: Response) => {
    const { instanceId } = req.params;

    try {
        await prisma.projectModelInstance.delete({
            where: {
                id: instanceId,
            },
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting project model instance:', error);
        res.status(500).json({ message: 'Failed to delete project model instance' });
    }
};

// Get generated plank lists for a specific instance
export const getGeneratedPlankListsForInstance = async (req: Request, res: Response) => {
    const { instanceId } = req.params;

    try {
        const plankLists = await prisma.generatedPlankList.findMany({
            where: {
                projectModelInstanceId: instanceId,
            },
            orderBy: {
                generatedAt: 'desc',
            },
        });

        res.json(plankLists);
    } catch (error) {
        console.error('Error fetching generated plank lists:', error);
        res.status(500).json({ message: 'Failed to fetch generated plank lists' });
    }
};

// Batch update project model instances
export const batchUpdateProjectModelInstances = async (req: Request, res: Response) => {
    const { id: projectIdStr } = req.params; // Changed to id
    const { boxes } = req.body;

    try {
        // Start a transaction for batch operations
        const result = await prisma.$transaction(async (tx) => {
            const updatedInstances = [];

            for (const box of boxes) {
                const { id, modelDefinitionId, runtimeInputsJson, uiDisplayOrder } = box;

                if (id) {
                    // Update existing instance
                    const instance = await tx.projectModelInstance.update({
                        where: { id },
                        data: {
                            modelDefinitionId,
                            runtimeInputsJson,
                            uiDisplayOrder,
                        },
                    });
                    updatedInstances.push(instance);
                } else {
                    // Create new instance
                    const instance = await tx.projectModelInstance.create({
                        data: {
                            projectId: parseInt(projectIdStr), // Use parsed id
                            modelDefinitionId,
                            runtimeInputsJson,
                            uiDisplayOrder,
                        },
                    });
                    updatedInstances.push(instance);
                }
            }

            return updatedInstances;
        });

        res.json(result);
    } catch (error) {
        console.error('Error in batch update of project model instances:', error);
        res.status(500).json({ message: 'Failed to batch update project model instances' });
    }
};
