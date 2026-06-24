import { generateCompleteArchitecture, CompleteArchitecture } from "./megaGenerator";
import { generateDemoArchitecture } from "./demoGenerator";
import { validateSchemas } from "./validator";
import { repairSchemas } from "./repairEngine";
import { recordMetric } from "../metrics";
import type {
  PipelineResult,
  StageResult,
  PipelineStage,
} from "../../types/pipeline";

async function runStage<T>(
  stage: PipelineStage,
  projectId: string,
  fn: () => Promise<T>
): Promise<StageResult<T>> {
  const start = Date.now();
  try {
    const data = await fn();
    const latencyMs = Date.now() - start;
    await recordMetric({ projectId, stage, latencyMs, success: true });
    return { stage, success: true, data, latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const error = err instanceof Error ? err.message : "Unknown error";
    // Check for rate limit error
    const isRateLimit = error.includes("429") || error.includes("quota");
    await recordMetric({ projectId, stage, latencyMs, success: false });
    return { stage, success: false, error, latencyMs, isRateLimit } as any;
  }
}

export async function runPipeline(
  prompt: string,
  projectId: string
): Promise<PipelineResult> {
  const pipelineStart = Date.now();
  const stages: StageResult[] = [];
  let isDemoMode = false;

  // ── Stage 1: Mega Generation (Intent, Design, Schema) ─────────────────
  let architectureStage = await runStage("mega" as any, projectId, () =>
    generateCompleteArchitecture(prompt)
  );

  let architecture = architectureStage.data;

  // ── Fallback Mechanism ────────────────────────────────────────────────
  if (!architectureStage.success) {
    // If rate limited, use demo mode fallback
    if ((architectureStage as any).isRateLimit) {
      console.log("[Pipeline] 429 Quota Exceeded. Falling back to Demo Mode.");
      isDemoMode = true;
      architecture = generateDemoArchitecture(prompt);
      // Mark stage as success since we successfully fell back
      architectureStage = {
        stage: "mega" as any,
        success: true,
        data: architecture,
        latencyMs: architectureStage.latencyMs,
      };
    } else {
      stages.push(architectureStage);
      return {
        projectId,
        success: false,
        stages,
        intent: { appType: "", entities: [], roles: [], features: [] },
        systemDesign: { entities: [], relationships: [], workflows: [], permissions: [] },
        schemas: {
          uiSchema: { pages: [], components: [] },
          apiSchema: { endpoints: [], middleware: [], version: "v1" },
          dbSchema: { tables: [] },
          authSchema: { providers: [], roles: [], strategy: "", sessionType: "database", protectedRoutes: [] },
        },
        validationReport: {
          isValid: false,
          issues: [],
          summary: { errors: 1, warnings: 0, info: 0 },
          timestamp: new Date().toISOString(),
        },
        totalLatencyMs: Date.now() - pipelineStart,
        timestamp: new Date().toISOString(),
      };
    }
  }

  stages.push(architectureStage);

  const { intent, systemDesign, schemas } = architecture!;

  if (intent.requiresClarification) {
      return {
        projectId,
        success: false,
        stages,
        intent,
        systemDesign,
        schemas,
        validationReport: {
          isValid: false,
          issues: [{id: "clarification_needed", code: "CLARIFICATION_REQUIRED", schema: "system", message: "Clarification required", severity: "error"}],
          summary: { errors: 1, warnings: 0, info: 0 },
          timestamp: new Date().toISOString(),
        },
        totalLatencyMs: Date.now() - pipelineStart,
        timestamp: new Date().toISOString(),
      };
  }

  // ── Stage 2: Validation ────────────────────────────────────────────────
  const validationStage = await runStage("validation", projectId, async () =>
    validateSchemas(intent, systemDesign, schemas)
  );
  stages.push(validationStage);

  const validationReport = validationStage.data ?? {
    isValid: false,
    issues: [],
    summary: { errors: 0, warnings: 0, info: 0 },
    timestamp: new Date().toISOString(),
  };

  // ── Stage 3: Repair (Local, Rule-based) ──────────────────────────────────
  let repairResult;
  let finalSchemas = schemas;

  if (!validationReport.isValid || validationReport.issues.length > 0) {
    const repairStage = await runStage("repair", projectId, async () =>
      repairSchemas(schemas, validationReport, intent)
    );
    stages.push(repairStage);
    repairResult = repairStage.data;

    if (repairResult) {
      finalSchemas = repairResult.repairedSchemas;
      await recordMetric({
        projectId,
        stage: "repair",
        latencyMs: repairStage.latencyMs,
        success: repairResult.success,
        repairCount: repairResult.repairs.length,
      });
    }
  }

  // ── Stage 4: Preview (build preview schema) ────────────────────────────
  const previewStage = await runStage("preview", projectId, async () => {
    const components = finalSchemas.uiSchema.components?.map((comp, i) => ({
      id: `comp_${i}`,
      type: comp.type,
      props: {
        ...comp.props,
        title: comp.props?.title ?? comp.name,
        entity: comp.entity,
        fields: comp.fields,
      },
    }));
    return { components: components ?? [], layout: "grid" as const };
  });
  stages.push(previewStage);

  const success = stages
    .filter((s) => s.stage !== "repair")
    .every((s) => s.success);

  return {
    projectId,
    success,
    stages,
    intent,
    systemDesign,
    schemas: finalSchemas,
    validationReport,
    repairResult,
    totalLatencyMs: Date.now() - pipelineStart,
    timestamp: new Date().toISOString(),
    isDemoMode
  };
}
