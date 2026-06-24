import { extractIntent } from "./intentExtractor";
import { designSystem } from "./systemDesigner";
import { generateSchemas } from "./schemaGenerator";
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

    await recordMetric({
      projectId,
      stage,
      latencyMs,
      success: true,
    });

    return { stage, success: true, data, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const error = err instanceof Error ? err.message : "Unknown error";

    await recordMetric({
      projectId,
      stage,
      latencyMs,
      success: false,
    });

    return { stage, success: false, error, latencyMs };
  }
}

export async function runPipeline(
  prompt: string,
  projectId: string
): Promise<PipelineResult> {
  const pipelineStart = Date.now();
  const stages: StageResult[] = [];

  // ── Stage 1: Intent Extraction ─────────────────────────────────────────
  const intentStage = await runStage("intent", projectId, () =>
    extractIntent(prompt)
  );
  stages.push(intentStage);

  if (!intentStage.success || !intentStage.data) {
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

  const intent = intentStage.data;

  // ── Stage 2: System Design ─────────────────────────────────────────────
  const designStage = await runStage("design", projectId, () =>
    designSystem(intent)
  );
  stages.push(designStage);

  const systemDesign = designStage.data ?? {
    entities: [],
    relationships: [],
    workflows: [],
    permissions: [],
  };

  // ── Stage 3: Schema Generation ─────────────────────────────────────────
  const schemaStage = await runStage("schema", projectId, () =>
    generateSchemas(intent, systemDesign)
  );
  stages.push(schemaStage);

  const schemas = schemaStage.data ?? {
    uiSchema: { pages: [], components: [] },
    apiSchema: { endpoints: [], middleware: [], version: "v1" },
    dbSchema: { tables: [] },
    authSchema: { providers: [], roles: [], strategy: "", sessionType: "database", protectedRoutes: [] },
  };

  // ── Stage 4: Validation ────────────────────────────────────────────────
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

  // ── Stage 5: Repair (only if needed) ──────────────────────────────────
  let repairResult;
  let finalSchemas = schemas;

  if (!validationReport.isValid || validationReport.issues.length > 0) {
    const repairStage = await runStage("repair", projectId, () =>
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

  // ── Stage 6: Preview (build preview schema) ────────────────────────────
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
  };
}
