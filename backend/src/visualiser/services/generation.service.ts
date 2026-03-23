/**
 * Generation Service — full file-generation pipeline (ported appscript-port).
 */

import { runPipeline } from '../pipeline/appscript-port/pipeline';
import type { PipelineInput as FvPipelineInput } from '../pipeline/appscript-port/pipeline';
import type { GenerateInput } from '../validations/visualiser.validation';
import type { PipelineResult } from '../types/visualiser.types';

/** Pipeline pressingList expects string values only (see pressingList.ts). */
function toPipelineCustomerDetails(
  c: GenerateInput['customerDetails']
): Record<string, string> | undefined {
  if (!c) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(c)) {
    if (v === undefined || v === null) continue;
    out[k] = typeof v === 'number' ? String(v) : String(v);
  }
  return out;
}

export class GenerationService {
  static runPipeline(input: GenerateInput): PipelineResult {
    const pipeIn: FvPipelineInput = {
      rawValues: input.rawValues as unknown[][],
      ebSettings: input.ebSettings,
      customerDetails: toPipelineCustomerDetails(input.customerDetails),
      hardwareData: input.hardwareData,
      sftData: input.sftData ?? undefined,
      nestingParams: input.nestingParams,
    };
    return runPipeline(pipeIn) as unknown as PipelineResult;
  }

  static async runPipelineAsync(
    input: GenerateInput,
    onProgress?: (step: string, message: string) => void
  ): Promise<PipelineResult> {
    const { runPipelineAsync } = await import('../pipeline/appscript-port/pipeline');
    const pipeIn: FvPipelineInput = {
      rawValues: input.rawValues as unknown[][],
      ebSettings: input.ebSettings,
      customerDetails: toPipelineCustomerDetails(input.customerDetails),
      hardwareData: input.hardwareData,
      sftData: input.sftData ?? undefined,
      nestingParams: input.nestingParams,
    };
    return runPipelineAsync(pipeIn, onProgress) as unknown as PipelineResult;
  }
}
