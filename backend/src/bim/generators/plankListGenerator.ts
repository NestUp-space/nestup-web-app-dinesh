import {
  GlobalRules,
  ModelDefinition,
  Plank,
  RuntimeInputs,
  SimpleBoxInputs,
  LShapedBoxInputs
} from '../types/bim.types';

// Import the specific generator functions from their new files
import { generatePlanks as generateSimpleBoxPlanks } from './models/simpleBoxGenerator';
import { generatePlanks as generateLShapedBoxPlanks } from './models/lShapedBoxGenerator';

// Define an interface for the model-specific generator functions
interface ModelPlankGenerator {
  (model: ModelDefinition, inputs: any, rules: GlobalRules, boxNumber?: string, packetNumber?: string): Plank[];
}

const modelGeneratorMap: { [key: string]: ModelPlankGenerator } = {
  'Simple Box': (model, inputs, rules, boxNumber, packetNumber) =>
    generateSimpleBoxPlanks(model, inputs as SimpleBoxInputs, rules, boxNumber, packetNumber),
  'L-Shaped Box': (model, inputs, rules, boxNumber, packetNumber) =>
    generateLShapedBoxPlanks(model, inputs as LShapedBoxInputs, rules, boxNumber, packetNumber),
  // New models will be added here: 'ModelTypeName': importedGeneratorFunction
};

/**
 * @description Generates a plank list for a given model and inputs
 * @param model The model definition
 * @param inputs The runtime inputs for the model
 * @param rules The global BIM rules
 * @returns Array of planks with calculated dimensions and properties
 */
export function generatePlankList(
  model: ModelDefinition,
  inputs: RuntimeInputs,
  rules: GlobalRules,
  boxNumber?: string,
  packetNumber?: string
): Plank[] {
  // Validate model type and inputs
  if (!model || !inputs || !rules) {
    throw new Error('Missing required parameters: model, inputs, or rules');
  }

  const generator = modelGeneratorMap[model.modelType];
  if (generator) {
    // The mapping function handles the type assertion for inputs
    return generator(model, inputs, rules, boxNumber, packetNumber);
  } else {
    throw new Error(`Model type "${model.modelType}" not supported.`);
  }
}
