import { NodeVM, VMScript } from 'vm2';

interface ExecuteOptions {
  timeout?: number;
  allowAsync?: boolean;
}

export class JavaScriptFunctionService {
  /**
   * Validates the syntax of a JavaScript function string
   * @param functionString The JavaScript function to validate
   * @throws {SyntaxError} If the function has syntax errors
   */
  validateSyntax(functionString: string): void {
    try {
      // Try to compile the script without executing it
      new VMScript(functionString).compile();
    } catch (error: any) {
      throw new SyntaxError(error.message);
    }
  }

  /**
   * Executes a JavaScript function string in a sandboxed environment
   * @param functionString The JavaScript function to execute
   * @param context Context object containing variables to be available to the function
   * @param options Options for function execution
   * @returns The result of the function execution
   */
  async executeFunction(
    functionString: string, 
    context: Record<string, any> = {}, 
    options: ExecuteOptions = {}
  ): Promise<any> {
    const {
      timeout = 5000,
      allowAsync = false
    } = options;

    // Create a new VM instance
    const vm = new NodeVM({
      timeout,
      sandbox: context,
      eval: false,
      wasm: false,
      strict: true,
      console: 'off',
      require: {
        external: false,
        builtin: [],
        root: "./",
        mock: {}
      }
    });

    try {
      // We'll wrap the function code to ensure proper execution and error handling
      const wrappedCode = `
        try {
          ${functionString}
          if (typeof calculateProperties !== 'function') {
            throw new Error('Function must define calculateProperties(runtimeInputs, globalConstants)');
          }
          const result = calculateProperties(runtimeInputs, globalConstants);
          if (result === undefined) {
            throw new Error('Function must return a value');
          }
          module.exports = result;
        } catch (error) {
          throw new Error('Execution error: ' + error.message);
        }
      `;

      // Execute the script in the VM
      const result = vm.run(new VMScript(wrappedCode));

      // If async operations aren't allowed and the result is a Promise, reject
      if (!allowAsync && result instanceof Promise) {
        throw new Error('Async operations are not allowed in this context');
      }

      return result;
    } catch (error: any) {
      throw new Error(`Failed to execute function: ${error.message}`);
    }
  }
}
