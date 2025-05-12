import { Request, Response } from 'express';
import { PlankGenerationService } from '../services/plank-generation.service';

const plankGenerationService = new PlankGenerationService();

export const generatePlanksForProject = async (req: Request, res: Response) => {
    const { projectId } = req.params;

    try {
        const planks = await plankGenerationService.generatePlanksForProject(
            parseInt(projectId, 10)
        );

        res.json({
            success: true,
            plankList: planks,
            message: 'Plank list generated successfully'
        });
    } catch (error) {
        console.error('Error in generatePlanksForProject:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to generate plank list',
        });
    }
};

export const generatePlanksForBox = async (req: Request, res: Response) => {
    const { boxNumber, modelDefinitionId } = req.body;
    const inputs = req.body.inputs || {};

    try {
        const planks = await plankGenerationService.generatePlanksForBox({
            boxNumber,
            modelDefinitionId,
            inputs
        });

        res.json({
            success: true,
            plankList: planks,
            message: 'Planks generated successfully for box'
        });
    } catch (error) {
        console.error('Error in generatePlanksForBox:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to generate planks for box',
        });
    }
};
