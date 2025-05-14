import { Request, Response, NextFunction } from 'express';
import { ValidateItemLogicDto, ValidateItemLogicResponseDto } from '../dtos/validate-item-logic.dto';
import { JavaScriptFunctionService } from '../services/javascript-function.service';
import fs from 'fs';
import path from 'path';

export class ValidationController {
  private readonly jsService: JavaScriptFunctionService;
  private readonly globalConstants: Record<string, any>;

  constructor() {
    this.jsService = new JavaScriptFunctionService();
    
    // Load global constants
    const constantsPath = path.join(__dirname, '../config/globalConstants.json');
    this.globalConstants = JSON.parse(fs.readFileSync(constantsPath, 'utf8'));
  }

  async validateItemLogic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { itemLogicScript, sampleRuntimeInputs, globalConstants } = req.body as ValidateItemLogicDto;

      // First, validate the script syntax
      try {
        this.jsService.validateSyntax(itemLogicScript);
      } catch (syntaxError: any) {
        const response: ValidateItemLogicResponseDto = {
          isValid: false,
          error: `Syntax error: ${syntaxError.message}`
        };
        res.status(400).json(response);
        return;
      }

      // Then, try to execute it with the provided inputs
      try {
        const context = {
          runtimeInputs: sampleRuntimeInputs,
          globalConstants: globalConstants || this.globalConstants
        };

        const result = await this.jsService.executeFunction(
          itemLogicScript,
          context,
          {
            timeout: 5000, // 5 seconds timeout
            allowAsync: false // Don't allow async operations in item logic scripts
          }
        );

        const response: ValidateItemLogicResponseDto = {
          isValid: true,
          result
        };
        res.json(response);
      } catch (executionError: any) {
        const response: ValidateItemLogicResponseDto = {
          isValid: false,
          error: `Execution error: ${executionError.message}`
        };
        res.status(400).json(response);
      }
    } catch (error) {
      next(error);
    }
  }
}
