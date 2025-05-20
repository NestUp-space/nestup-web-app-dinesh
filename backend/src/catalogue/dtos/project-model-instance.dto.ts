import { z } from 'zod';

// Schema for creating a new model instance
export const createProjectModelInstanceSchema = z.object({
    body: z.object({
        modelDefinitionId: z.string(),
        runtimeInputsJson: z.record(z.any()),
        uiDisplayOrder: z.number().optional(),
    }),
    params: z.object({
        id: z.string().transform(val => parseInt(val, 10)), // Changed projectId to id
    }),
});

// Schema for updating a model instance
export const updateProjectModelInstanceSchema = z.object({
    body: z.object({
        modelDefinitionId: z.string().optional(),
        runtimeInputsJson: z.record(z.any()).optional(),
        uiDisplayOrder: z.number().optional(),
    }),
    params: z.object({
        id: z.string().transform(val => parseInt(val, 10)), // Changed projectId to id
        instanceId: z.string(),
    }),
});

// Schema for getting model instances
export const getProjectModelInstancesSchema = z.object({
    params: z.object({
        id: z.string().transform(val => parseInt(val, 10)), // Changed projectId to id
    }),
    query: z.object({}).optional(),
});

// Schema for batch updating model instances
export const batchUpdateProjectModelInstancesSchema = z.object({
    body: z.object({
        boxes: z.array(z.object({
            id: z.string().optional(), // Optional for new instances
            modelDefinitionId: z.string(),
            runtimeInputsJson: z.record(z.any()),
            uiDisplayOrder: z.number(),
        })),
    }),
    params: z.object({
        id: z.string().transform(val => parseInt(val, 10)), // Changed projectId to id
    }),
});

// Types based on the schemas
export type CreateProjectModelInstanceDTO = z.infer<typeof createProjectModelInstanceSchema>;
export type UpdateProjectModelInstanceDTO = z.infer<typeof updateProjectModelInstanceSchema>;
export type GetProjectModelInstancesDTO = z.infer<typeof getProjectModelInstancesSchema>;
export type BatchUpdateProjectModelInstancesDTO = z.infer<typeof batchUpdateProjectModelInstancesSchema>;
