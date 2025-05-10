import vm from 'vm';
import fs from 'fs';
import path from 'path';

// Define the expected structure of the output from the user's script
// This should align with what PlankListGeneratorService and other consumers expect
export interface ExecutedScriptResult {
  plankId?: string;
  name?: string;
  width?: number;
  height?: number;
  thickness?: number;
  materialCode?: string;
  grainDirection?: string;
  [key: string]: any; // Allow other properties
}

interface RuntimeInputs {
  [inputName: string]: string | number | boolean | null;
}

interface GlobalConstants {
  [constantName: string]: string | number | boolean | null;
}

let loadedGlobalConstants: GlobalConstants | null = null; // Cache for global constants

function getGlobalConstants(): GlobalConstants { // Ensures it always returns GlobalConstants, not null
  if (loadedGlobalConstants === null) {
    try {
      const filePath = path.join(__dirname, '../config/globalConstants.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      loadedGlobalConstants = JSON.parse(fileContent) as GlobalConstants;
    } catch (error) {
      console.error('Failed to load or parse globalConstants.json:', error);
      loadedGlobalConstants = {}; // Default to an empty object on error
    }
  }
  return loadedGlobalConstants; // Now guaranteed to be GlobalConstants (or {} if error)
}

export class JavaScriptFunctionService {
  constructor() {
    console.log('JavaScriptFunctionService initialized');
  }

  /**
   * Executes a user-provided JavaScript function string in a secure sandbox.
   * The script is expected to define a function named 'calculateProperties'.
   * @param scriptString The JavaScript code string.
   * @param runtimeInputs An object containing runtime input values for the model.
   * @returns A Promise resolving to the result object from the script, or null if execution fails.
   */
  async executeItemScript(
    scriptString: string,
    runtimeInputs: RuntimeInputs,
  ): Promise<ExecutedScriptResult | null> {
    if (!scriptString || scriptString.trim() === '') {
      console.warn('executeItemScript called with empty scriptString.');
      return null;
    }

    const globalConstants = getGlobalConstants(); // This now always returns GlobalConstants

    // Create a secure context for the script
    // IMPORTANT: This is a basic sandbox. For production, enhance security:
    // - Stricter timeout
    // - No access to `require` or other Node.js internals beyond what's explicitly provided.
    // - Consider using worker_threads for better isolation if scripts are complex or untrusted.
    const sandbox: {
      runtimeInputs: RuntimeInputs;
      globalConstants: GlobalConstants;
      console: any;
      [key: string]: any; // To allow for undefined properties
    } = {
      runtimeInputs: { ...runtimeInputs }, 
      globalConstants: { ...globalConstants }, 
      console: { 
        log: (...args: any[]) => console.log('[UserScript Log]', ...args),
        error: (...args: any[]) => console.error('[UserScript Error]', ...args),
        warn: (...args: any[]) => console.warn('[UserScript Warn]', ...args),
      },
      // Explicitly forbid access to potentially harmful globals
      process: undefined,
      require: undefined,
      module: undefined,
      exports: undefined,
      global: undefined,
      setTimeout: undefined, // Or a sandboxed version if needed
      setInterval: undefined, // Or a sandboxed version
      setImmediate: undefined,
      clearTimeout: undefined,
      clearInterval: undefined,
      clearImmediate: undefined,
      Buffer: undefined,
      // Add any other globals that should be restricted
    };

    const script = new vm.Script(`
      (function() {
        // User's script is expected to define or be an expression evaluating to this function
        const userFunction = (function() { ${scriptString} })(); 
        if (typeof userFunction === 'function' && userFunction.name === 'calculateProperties') {
          return userFunction(runtimeInputs, globalConstants);
        } else if (typeof userFunction === 'function') {
          // If the script itself is an anonymous function, try calling it
           return userFunction(runtimeInputs, globalConstants);
        }
        throw new Error("Script must define a function named 'calculateProperties' or be an invokable function expression.");
      })();
    `);

    try {
      const context = vm.createContext(sandbox);
      const result = script.runInContext(context, { timeout: 1000 }); // 1 second timeout

      // TODO: Add validation against an expected output schema (e.g., using Zod)
      // For now, we just check if it's an object.
      if (typeof result === 'object' && result !== null) {
        return result as ExecutedScriptResult;
      } else {
        console.error('User script did not return a valid object:', result);
        throw new Error('Script execution did not return a valid object.');
      }
    } catch (error: any) {
      console.error('Error executing user script:', error.message);
      // Rethrow or handle as appropriate for the calling service
      throw new Error(`Script execution failed: ${error.message}`);
    }
  }
}
