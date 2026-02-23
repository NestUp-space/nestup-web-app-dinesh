import { JsonValue } from '@prisma/client/runtime/library'; // For Prisma Json type
import { create, all, MathJsInstance } from 'mathjs';

interface Rule {
  ruleType: 'simpleFormula' | 'directValue' | string; // Allow other types for future
  value: string | number | boolean; // Value for directValue, formula string for simpleFormula
}

interface RulesJson {
  [propertyKey: string]: Rule | undefined; // e.g., { width: { ruleType: "simpleFormula", value: "runtime.boxWidth - 18" } }
}

interface RuntimeInputs {
  [inputName: string]: string | number | boolean | null;
}

// Placeholder for global rules - can be loaded from a JSON file or DB later
const globalRules: RuntimeInputs = {
  panelThickness: 18, // Example global value
  edgeBandingThickness: 1,
};

/**
 * Security: Create a limited mathjs instance that only allows safe mathematical operations.
 * This prevents code injection attacks that were possible with new Function().
 */
const createSafeMath = (): MathJsInstance => {
  const math = create(all);
  
  // Security: Disable dangerous functions that could be exploited
  // We keep the core math.evaluate() but remove functions that could allow arbitrary code execution
  const dangerousFunctions: (keyof MathJsInstance)[] = [
    'import' as keyof MathJsInstance, 
    'createUnit' as keyof MathJsInstance,
    'parse' as keyof MathJsInstance, 
    'simplify' as keyof MathJsInstance, 
    'derivative' as keyof MathJsInstance, 
    'rationalize' as keyof MathJsInstance, 
    'compile' as keyof MathJsInstance
  ];
  
  dangerousFunctions.forEach(fn => {
    try {
      // Attempt to make these functions throw instead of executing
      (math as Record<string, unknown>)[fn as string] = () => {
        throw new Error(`Function ${fn} is disabled for security reasons`);
      };
    } catch {
      // Some functions may not exist or may be read-only
    }
  });
  
  return math;
};

const safeMath = createSafeMath();

/**
 * Security: Validates that a formula only contains safe mathematical expressions.
 * Rejects any attempts at code injection.
 */
function validateFormula(formula: string): boolean {
  // Allow: numbers, basic operators, parentheses, whitespace, decimal points
  // Reject: any other characters that could be used for code injection
  const safePattern = /^[\s\d+\-*/().]+$/;
  return safePattern.test(formula);
}

export class RuleService {
  constructor() {
    console.log('RuleService initialized');
  }

  /**
   * Security: Safely evaluates mathematical expressions using mathjs.
   * This replaces the unsafe new Function() approach.
   */
  private safeEvaluateExpression(formula: string): number {
    // Security: Validate formula before evaluation
    if (!validateFormula(formula)) {
      throw new Error(`Invalid formula: contains unsafe characters. Only numbers and basic operators (+, -, *, /, parentheses) are allowed.`);
    }
    
    try {
      // Use mathjs evaluate which is safe for mathematical expressions
      const result = safeMath.evaluate(formula);
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error(`Formula evaluation did not produce a valid number: ${formula}`);
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to evaluate formula "${formula}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Evaluates a single rule (simpleFormula or directValue) for a given property.
   * @param rule The rule object { ruleType, value }
   * @param runtimeInputs The runtime inputs for the model instance.
   * @returns The calculated value.
   * @throws Error if rule evaluation fails.
   */
  private evaluateRule(rule: Rule, runtimeInputs: RuntimeInputs): string | number | boolean | null {
    if (rule.ruleType === 'directValue') {
      return rule.value;
    }

    if (rule.ruleType === 'simpleFormula' && typeof rule.value === 'string') {
      let formula = rule.value;

      // Substitute runtime inputs: runtime.variableName
      formula = formula.replace(/runtime\.([a-zA-Z0-9_]+)/g, (_, varName) => {
        if (Object.prototype.hasOwnProperty.call(runtimeInputs, varName)) {
          const val = runtimeInputs[varName];
          // Security: For mathjs, we only substitute numeric values into formulas
          if (typeof val === 'number') {
            return String(val);
          }
          if (typeof val === 'string') {
            // If it's a string that looks like a number, use it
            if (!isNaN(Number(val))) {
              return val;
            }
            // Otherwise, return the string as-is (will be handled below)
            return `"${val}"`;
          }
          return String(val); // booleans become "true"/"false"
        }
        throw new Error(`Runtime variable '${varName}' not found in inputs.`);
      });

      // Substitute global rules: global.variableName
      formula = formula.replace(/global\.([a-zA-Z0-9_]+)/g, (_, varName) => {
        if (Object.prototype.hasOwnProperty.call(globalRules, varName)) {
          const val = globalRules[varName];
          if (typeof val === 'number') {
            return String(val);
          }
          if (typeof val === 'string' && !isNaN(Number(val))) {
            return val;
          }
          return String(val);
        }
        throw new Error(`Global variable '${varName}' not found in global rules.`);
      });

      try {
        // Security: Check if formula is a quoted string (non-mathematical)
        if (formula.startsWith('"') && formula.endsWith('"')) {
          return formula.slice(1, -1);
        }
        
        // Check if it's just a number
        if (!isNaN(Number(formula))) {
          return Number(formula);
        }
        
        // Security: Use safe mathematical evaluation instead of new Function()
        // This prevents code injection attacks
        return this.safeEvaluateExpression(formula);
        
      } catch (e) {
        console.error(`Error evaluating formula: "${rule.value}" (transformed to "${formula}")`, e);
        throw new Error(`Error evaluating formula: "${rule.value}".`);
      }
    }
    console.warn(`Unsupported ruleType: ${rule.ruleType} or invalid value for rule:`, rule);
    return null; // Or throw error for unsupported types
  }

  /**
   * Executes all rules defined in a rulesJson object against the runtime inputs.
   * @param rulesJson The JSON object containing rules for various properties.
   * @param runtimeInputs The runtime inputs for the model instance.
   * @returns An object with calculated values for each property.
   */
  public executeRules(
    rulesJson: RulesJson | JsonValue | null | undefined,
    runtimeInputs: RuntimeInputs
  ): Record<string, string | number | boolean | null> {
    const calculatedProperties: Record<string, string | number | boolean | null> = {};

    if (!rulesJson || typeof rulesJson !== 'object' || Array.isArray(rulesJson)) {
      console.warn('Invalid or empty rulesJson provided to executeRules:', rulesJson);
      return calculatedProperties;
    }
    
    // Ensure runtimeInputs is an object, default to empty if null/undefined
    const safeRuntimeInputs = runtimeInputs || {};

    for (const propertyKey in rulesJson) {
      if (rulesJson.hasOwnProperty(propertyKey)) {
        const rule = rulesJson[propertyKey] as Rule; // Type assertion
        if (rule && rule.ruleType && rule.hasOwnProperty('value')) {
          try {
            calculatedProperties[propertyKey] = this.evaluateRule(rule, safeRuntimeInputs);
          } catch (error) {
            console.error(`Error processing rule for property '${propertyKey}':`, error);
            calculatedProperties[propertyKey] = null; // Or handle error as needed
          }
        } else {
            // If the value in rulesJson is not a rule object, treat it as a direct value for that property
            calculatedProperties[propertyKey] = rule as any; // Assuming it's a direct value
        }
      }
    }
    return calculatedProperties;
  }
}
