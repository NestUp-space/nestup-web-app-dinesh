export interface ValidateItemLogicDto {
  /** The JavaScript function to validate */
  itemLogicScript: string;
  /** Sample runtime inputs to test the function with */
  sampleRuntimeInputs: Record<string, any>;
  /** Optional global constants to use during validation */
  globalConstants?: Record<string, any>;
}

export interface ValidateItemLogicResponseDto {
  /** Whether the script is valid and executed successfully */
  isValid: boolean;
  /** The result of executing the script, if successful */
  result?: any;
  /** Error message if validation or execution failed */
  error?: string;
}
