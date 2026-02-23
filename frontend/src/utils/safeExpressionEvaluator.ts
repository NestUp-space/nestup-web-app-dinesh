/**
 * Safe Expression Evaluator
 * Uses a restricted token-based evaluator instead of new Function().
 */

interface EvaluationContext {
  runtimeInputs: Record<string, unknown>;
  globalConstants: Record<string, unknown>;
}

interface EvaluationResult {
  success: boolean;
  value?: unknown;
  error?: string;
}

const DANGEROUS_PATTERNS = [
  /eval\s*\(/, /Function\s*\(/, /setTimeout\s*\(/, /setInterval\s*\(/,
  /document\./, /window\./, /global\./, /process\./, /require\s*\(/,
  /import\s+/, /export\s+/, /__proto__/, /constructor/, /prototype/,
  /fetch\s*\(/, /XMLHttpRequest/, /WebSocket/,
];

function sanitizeCode(code: string): { isValid: boolean; error?: string } {
  const cleanCode = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(cleanCode)) {
      return { isValid: false, error: `Dangerous pattern detected: ${pattern.source}` };
    }
  }
  return { isValid: true };
}

function resolveValue(path: string, context: EvaluationContext): unknown {
  const parts = path.split('.');
  let current: unknown;

  const firstPart = parts[0];
  if (firstPart in context.runtimeInputs) {
    current = context.runtimeInputs[firstPart];
  } else if (firstPart in context.globalConstants) {
    current = context.globalConstants[firstPart];
  } else {
    return undefined;
  }

  for (let i = 1; i < parts.length; i++) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[parts[i]];
  }
  return current;
}

function evaluateMathExpression(expr: string, context: EvaluationContext): number {
  let resolved = expr.trim();

  const varPattern = /[a-zA-Z_][a-zA-Z0-9_.]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*/g;
  resolved = resolved.replace(varPattern, (match) => {
    if (match === 'true' || match === 'false') return match;
    const val = resolveValue(match, context);
    if (val === undefined) throw new Error(`Unknown variable: ${match}`);
    if (typeof val === 'number') return String(val);
    if (typeof val === 'string' && !isNaN(Number(val))) return val;
    throw new Error(`Variable '${match}' is not numeric (got ${typeof val})`);
  });

  if (!/^[\s\d+\-*/().]+$/.test(resolved)) {
    throw new Error(`Unsafe math expression: ${resolved}`);
  }

  const tokens = tokenizeMath(resolved);
  return parseMathTokens(tokens);
}

type MathToken =
  | { type: 'number'; value: number }
  | { type: 'op'; value: string }
  | { type: 'lparen' }
  | { type: 'rparen' };

function tokenizeMath(expr: string): MathToken[] {
  const tokens: MathToken[] = [];
  let i = 0;
  while (i < expr.length) {
    if (/\s/.test(expr[i])) { i++; continue; }
    if (/[\d.]/.test(expr[i])) {
      let num = '';
      while (i < expr.length && /[\d.]/.test(expr[i])) { num += expr[i]; i++; }
      tokens.push({ type: 'number', value: parseFloat(num) });
      continue;
    }
    if (expr[i] === '(') { tokens.push({ type: 'lparen' }); i++; continue; }
    if (expr[i] === ')') { tokens.push({ type: 'rparen' }); i++; continue; }
    if ('+-*/'.includes(expr[i])) {
      if (expr[i] === '-' && (tokens.length === 0 || tokens[tokens.length - 1].type === 'lparen' || tokens[tokens.length - 1].type === 'op')) {
        let num = '-';
        i++;
        while (i < expr.length && /[\d.]/.test(expr[i])) { num += expr[i]; i++; }
        tokens.push({ type: 'number', value: parseFloat(num) });
        continue;
      }
      tokens.push({ type: 'op', value: expr[i] }); i++; continue;
    }
    throw new Error(`Unexpected character: ${expr[i]}`);
  }
  return tokens;
}

function parseMathTokens(tokens: MathToken[]): number {
  let pos = 0;

  function parseExpr(): number {
    let left = parseTerm();
    while (pos < tokens.length && tokens[pos].type === 'op' && (tokens[pos] as { type: 'op'; value: string }).value === '+' || tokens[pos]?.type === 'op' && (tokens[pos] as { type: 'op'; value: string }).value === '-') {
      const op = (tokens[pos] as { type: 'op'; value: string }).value;
      pos++;
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseFactor();
    while (pos < tokens.length && tokens[pos].type === 'op' && ((tokens[pos] as { type: 'op'; value: string }).value === '*' || (tokens[pos] as { type: 'op'; value: string }).value === '/')) {
      const op = (tokens[pos] as { type: 'op'; value: string }).value;
      pos++;
      const right = parseFactor();
      left = op === '*' ? left * right : left / right;
    }
    return left;
  }

  function parseFactor(): number {
    if (pos >= tokens.length) throw new Error('Unexpected end of expression');
    const token = tokens[pos];
    if (token.type === 'number') { pos++; return token.value; }
    if (token.type === 'lparen') {
      pos++;
      const val = parseExpr();
      if (pos >= tokens.length || tokens[pos].type !== 'rparen') throw new Error('Mismatched parentheses');
      pos++;
      return val;
    }
    throw new Error(`Unexpected token at position ${pos}`);
  }

  const result = parseExpr();
  if (pos !== tokens.length) throw new Error('Unexpected tokens after expression');
  return result;
}

function evaluateStringExpression(expr: string, context: EvaluationContext): string {
  const trimmed = expr.trim();
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1);
  }
  const val = resolveValue(trimmed, context);
  if (typeof val === 'string') return val;
  if (val !== undefined) return String(val);
  throw new Error(`Could not resolve string expression: ${trimmed}`);
}

function parseStatements(code: string): string[] {
  return code.split('\n')
    .map(l => l.replace(/\/\/.*$/, '').trim())
    .filter(l => l.length > 0 && !l.startsWith('//'));
}

export function safeEvaluateExpression(
  code: string,
  context: EvaluationContext,
  expectedVariable: 'Width' | 'Height' | 'Material'
): EvaluationResult {
  try {
    const sanitization = sanitizeCode(code);
    if (!sanitization.isValid) {
      return { success: false, error: sanitization.error };
    }

    const lines = parseStatements(code);
    let result: unknown = undefined;

    const localVars: Record<string, unknown> = {};

    const fullContext: EvaluationContext = {
      runtimeInputs: { ...context.runtimeInputs, ...localVars },
      globalConstants: context.globalConstants,
    };

    for (const line of lines) {
      if (line.startsWith('let ') || line.startsWith('const ') || line.startsWith('var ')) continue;
      if (line === '{' || line === '}') continue;
      if (line.startsWith('if ') || line.startsWith('} else') || line === 'else {') continue;
      if (line.startsWith('return ')) continue;

      const assignMatch = line.match(/^(\w+)\s*=\s*(.+?)(?:;?)$/);
      if (assignMatch) {
        const [, varName, expr] = assignMatch;
        fullContext.runtimeInputs = { ...context.runtimeInputs, ...localVars };

        let val: unknown;
        try {
          val = evaluateMathExpression(expr, fullContext);
        } catch {
          val = evaluateStringExpression(expr, fullContext);
        }

        localVars[varName] = val;
        if (varName === expectedVariable) {
          result = val;
        }
        continue;
      }
    }

    if (result === undefined) {
      return { success: false, error: `Variable '${expectedVariable}' was never assigned` };
    }

    if (expectedVariable === 'Material') {
      if (typeof result !== 'string') return { success: false, error: 'Material code must return a string value' };
      if (!result) return { success: false, error: 'Material code cannot be empty' };
    } else {
      if (typeof result !== 'number') return { success: false, error: `${expectedVariable} must be a numeric value` };
      if (result <= 0) return { success: false, error: `${expectedVariable} must be greater than 0` };
    }

    return { success: true, value: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown execution error' };
  }
}

export function validateExpressionCode(
  code: string,
  expectedVariable: 'Width' | 'Height' | 'Material'
): { isValid: boolean; error?: string } {
  if (!code.includes(`${expectedVariable} =`)) {
    return { isValid: false, error: `Code must use '${expectedVariable} =' to assign the value` };
  }
  return sanitizeCode(code);
}

export const SAMPLE_CONTEXT: EvaluationContext = {
  runtimeInputs: {
    boxDepth: 560,
    boxHeight: 720,
    leftAdjacency: 'Expose',
    rightAdjacency: 'Wall',
    skirting: 100,
    outerMaterialCode: 'OUT001',
    innerMaterialCode: 'IN001',
  },
  globalConstants: {
    MATERIAL_THICKNESS: { expose: 18, inner: 18, back: 6 },
    EDGE_BANDING: { INNER_EDGEBANDING: 1, COLOR_EDGEBANDING: 2 },
  },
};
