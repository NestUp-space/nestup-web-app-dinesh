import { JsonValue } from '@prisma/client/runtime/library'; // For Prisma Json type

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

export class RuleService {
  constructor() {
    console.log('RuleService initialized');
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
        if (runtimeInputs.hasOwnProperty(varName)) {
          const val = runtimeInputs[varName];
          if (typeof val === 'string') return `"${String(val)}"`; // Wrap strings in quotes for eval
          return String(val); // Numbers, booleans
        }
        throw new Error(`Runtime variable '${varName}' not found in inputs.`);
      });

      // Substitute global rules: global.variableName
      formula = formula.replace(/global\.([a-zA-Z0-9_]+)/g, (_, varName) => {
        if (globalRules.hasOwnProperty(varName)) {
          const val = globalRules[varName];
           if (typeof val === 'string') return `"${String(val)}"`;
          return String(val);
        }
        throw new Error(`Global variable '${varName}' not found in global rules.`);
      });

      // Basic arithmetic evaluation (VERY simplified and potentially unsafe if not careful)
      // For a production system, a proper math expression parser/evaluator library is recommended.
      // This MVP version handles simple cases like "value - number" or "value + number".
      try {
        // This is a simplified evaluator. For more complex math, use a library.
        // It tries to handle simple arithmetic like "100 - 18" or "runtime.value + 5"
        // It's NOT a full JavaScript eval.
        // Ensure hyphen is at the end or escaped to be treated literally
        if (/^[\s\d."'+*/()\-\[\]]+$/.test(formula)) { // Allow numbers, strings, basic operators, parentheses, and brackets (for safety, though not used in current eval)
            // Using Function constructor for safer evaluation than direct eval()
            // Still, this should be replaced with a proper math expression parser for production.
            return new Function(`return ${formula}`)();
        } else {
            // If it's not simple arithmetic, and was supposed to be a direct value after substitution
            // (e.g. a runtime string variable was substituted), it might just be the string itself.
            // This part is tricky without a full parser. If formula is just a quoted string, unquote it.
            if (formula.startsWith('"') && formula.endsWith('"')) {
                return formula.slice(1, -1);
            }
            // If it's a number that was stringified
            if (!isNaN(Number(formula))) {
                return Number(formula);
            }
            // Otherwise, it might be a direct string value that was intended
            return formula; 
        }
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
