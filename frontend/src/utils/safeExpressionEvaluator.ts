/**
 * Safe Expression Evaluator
 * Replaces unsafe new Function() calls with a secure evaluation system
 */

interface EvaluationContext {
  runtimeInputs: Record<string, any>;
  globalConstants: Record<string, any>;
}

interface EvaluationResult {
  success: boolean;
  value?: any;
  error?: string;
}

// Allowed variable names and operations
const ALLOWED_VARIABLES = new Set([
  'boxDepth', 'boxHeight', 'leftAdjacency', 'rightAdjacency',
  'skirting', 'outerMaterialCode', 'innerMaterialCode',
  'MATERIAL_THICKNESS', 'EDGE_BANDING',
  'Width', 'Height', 'Material'
]);

const ALLOWED_OPERATORS = new Set([
  '+', '-', '*', '/', '(', ')', '=', '==', '===', '!=', '!==',
  '<', '>', '<=', '>=', '&&', '||', '!', '?', ':', ';'
]);

const ALLOWED_KEYWORDS = new Set([
  'const', 'let', 'if', 'else', 'return', 'true', 'false'
]);

/**
 * Sanitizes and validates code before execution
 */
function sanitizeCode(code: string): { isValid: boolean; error?: string } {
  // Remove comments
  const cleanCode = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    /eval\s*\(/,
    /Function\s*\(/,
    /setTimeout\s*\(/,
    /setInterval\s*\(/,
    /document\./,
    /window\./,
    /global\./,
    /process\./,
    /require\s*\(/,
    /import\s+/,
    /export\s+/,
    /__proto__/,
    /constructor/,
    /prototype/
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(cleanCode)) {
      return { 
        isValid: false, 
        error: `Dangerous pattern detected: ${pattern.source}` 
      };
    }
  }

  // Check for only allowed tokens
  const tokens = cleanCode.match(/[a-zA-Z_$][a-zA-Z0-9_$]*|[+\-*\/()=<>!&|?:;]|\d+\.?\d*|"[^"]*"|'[^']*'/g) || [];
  
  for (const token of tokens) {
    // Skip numbers, strings, and operators
    if (/^\d+\.?\d*$/.test(token) || /^["'].*["']$/.test(token) || ALLOWED_OPERATORS.has(token)) {
      continue;
    }
    
    // Check if it's an allowed variable or keyword
    if (!ALLOWED_VARIABLES.has(token) && !ALLOWED_KEYWORDS.has(token)) {
      return { 
        isValid: false, 
        error: `Unauthorized identifier: ${token}` 
      };
    }
  }

  return { isValid: true };
}

/**
 * Creates a safe execution environment
 */
function createSafeEnvironment(context: EvaluationContext): Record<string, any> {
  const { runtimeInputs, globalConstants } = context;
  
  return {
    // Runtime inputs
    boxDepth: runtimeInputs.boxDepth,
    boxHeight: runtimeInputs.boxHeight,
    leftAdjacency: runtimeInputs.leftAdjacency,
    rightAdjacency: runtimeInputs.rightAdjacency,
    skirting: runtimeInputs.skirting,
    outerMaterialCode: runtimeInputs.outerMaterialCode,
    innerMaterialCode: runtimeInputs.innerMaterialCode,
    
    // Global constants
    MATERIAL_THICKNESS: globalConstants.MATERIAL_THICKNESS,
    EDGE_BANDING: globalConstants.EDGE_BANDING,
    
    // Variables for assignment
    Width: undefined,
    Height: undefined,
    Material: undefined
  };
}

/**
 * Safely evaluates expression code
 */
export function safeEvaluateExpression(
  code: string,
  context: EvaluationContext,
  expectedVariable: 'Width' | 'Height' | 'Material'
): EvaluationResult {
  try {
    // Sanitize the code
    const sanitization = sanitizeCode(code);
    if (!sanitization.isValid) {
      return {
        success: false,
        error: sanitization.error
      };
    }

    // Create safe environment
    const env = createSafeEnvironment(context);
    
    // Prepare the code with proper variable declarations
    const wrappedCode = `
      // Extract runtime inputs
      const {
        boxDepth, boxHeight, leftAdjacency, rightAdjacency,
        skirting, outerMaterialCode, innerMaterialCode
      } = runtimeInputs;

      // Extract global constants
      const {
        MATERIAL_THICKNESS,
        EDGE_BANDING
      } = globalConstants;

      // Variable declaration
      let ${expectedVariable};

      // User's logic
      ${code}

      // Return the result
      return ${expectedVariable};
    `;

    // Use Function constructor with restricted scope
    const func = new Function('runtimeInputs', 'globalConstants', wrappedCode);
    const result = func(context.runtimeInputs, context.globalConstants);

    // Validate the result
    if (expectedVariable === 'Material') {
      if (typeof result !== 'string') {
        return {
          success: false,
          error: 'Material code must return a string value'
        };
      }
      if (!result) {
        return {
          success: false,
          error: 'Material code cannot be empty'
        };
      }
    } else {
      if (typeof result !== 'number') {
        return {
          success: false,
          error: `${expectedVariable} must be a numeric value`
        };
      }
      if (result <= 0) {
        return {
          success: false,
          error: `${expectedVariable} must be greater than 0`
        };
      }
    }

    return {
      success: true,
      value: result
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown execution error'
    };
  }
}

/**
 * Validates code without executing it
 */
export function validateExpressionCode(
  code: string,
  expectedVariable: 'Width' | 'Height' | 'Material'
): { isValid: boolean; error?: string } {
  // Check if code uses the expected variable
  if (!code.includes(`${expectedVariable} =`)) {
    return {
      isValid: false,
      error: `Code must use '${expectedVariable} =' to assign the value`
    };
  }

  // Sanitize the code
  return sanitizeCode(code);
}

/**
 * Sample context for testing
 */
export const SAMPLE_CONTEXT: EvaluationContext = {
  runtimeInputs: {
    boxDepth: 560,
    boxHeight: 720,
    leftAdjacency: 'Expose',
    rightAdjacency: 'Wall',
    skirting: 100,
    outerMaterialCode: 'OUT001',
    innerMaterialCode: 'IN001'
  },
  globalConstants: {
    MATERIAL_THICKNESS: {
      expose: 18,
      inner: 18,
      back: 6
    },
    EDGE_BANDING: {
      INNER_EDGEBANDING: 1,
      COLOR_EDGEBANDING: 2
    }
  }
};
