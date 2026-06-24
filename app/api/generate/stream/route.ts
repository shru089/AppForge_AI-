import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractIntent } from "@/lib/pipeline/intentExtractor";
import { designSystem } from "@/lib/pipeline/systemDesigner";
import { generateSchemas } from "@/lib/pipeline/schemaGenerator";
import { validateSchemas } from "@/lib/pipeline/validator";
import { repairSchemas } from "@/lib/pipeline/repairEngine";
import { recordMetric } from "@/lib/metrics";
import { demoStore } from "@/lib/demo-store";
import { z } from "zod";
import type { PipelineResult, StageResult } from "@/types/pipeline";

const schema = z.object({
  prompt: z.string().min(10).max(5000),
  projectName: z.string().min(1).max(100).optional(),
});

function encode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response("Bad request", { status: 400 });
  }

  const { prompt, projectName } = parsed.data;
  const userId = session.user.id;
  const isDemo = userId === "demo-user-123";

  // Create a streaming response
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const send = async (event: string, data: unknown) => {
    try {
      await writer.write(new TextEncoder().encode(encode(event, data)));
    } catch {
      // Client disconnected
    }
  };

  // Run pipeline in background
  (async () => {
    const pipelineStart = Date.now();
    const stages: StageResult[] = [];

    let projectId = `demo-${Date.now()}`;

    // Create DB project if not demo user
    if (!isDemo) {
      try {
        const project = await db.project.create({
          data: {
            name: projectName ?? `App from: ${prompt.slice(0, 50)}...`,
            prompt,
            status: "PROCESSING",
            userId,
          },
        });
        projectId = project.id;
      } catch (e) {
        console.warn("DB project create failed", e);
      }
    }

    await send("start", { projectId, prompt });

    // Helper to run one stage with streaming
    async function runStage<T>(
      stageName: string,
      stageKey: string,
      fn: () => Promise<T>
    ): Promise<{ success: boolean; data?: T; error?: string; latencyMs: number }> {
      const start = Date.now();
      await send("stage:start", { stage: stageKey, name: stageName });
      try {
        const data = await fn();
        const latencyMs = Date.now() - start;
        await send("stage:done", { stage: stageKey, name: stageName, latencyMs });
        if (!isDemo) {
          await recordMetric({ projectId, stage: stageKey as never, latencyMs, success: true }).catch(() => {});
        }
        return { success: true, data, latencyMs };
      } catch (err) {
        const latencyMs = Date.now() - start;
        const error = err instanceof Error ? err.message : "Unknown error";
        await send("stage:error", { stage: stageKey, name: stageName, error, latencyMs });
        if (!isDemo) {
          await recordMetric({ projectId, stage: stageKey as never, latencyMs, success: false }).catch(() => {});
        }
        return { success: false, error, latencyMs };
      }
    }

    // Stage 1: Intent Extraction
    const intentResult = await runStage("Intent Extraction", "intent", () => extractIntent(prompt));
    stages.push({ stage: "intent", success: intentResult.success, data: intentResult.data, error: intentResult.error, latencyMs: intentResult.latencyMs });
    
    if (!intentResult.success || !intentResult.data) {
      await send("error", { message: "Intent extraction failed" });
      await writer.close();
      return;
    }
    const intent = intentResult.data;

    // Stage 2: System Design
    const designResult = await runStage("System Design", "design", () => designSystem(intent));
    stages.push({ stage: "design", success: designResult.success, data: designResult.data, error: designResult.error, latencyMs: designResult.latencyMs });
    const systemDesign = designResult.data ?? { entities: [], relationships: [], workflows: [], permissions: [] };

    // Stage 3: Schema Generation
    const schemaResult = await runStage("Schema Generation", "schema", () => generateSchemas(intent, systemDesign));
    stages.push({ stage: "schema", success: schemaResult.success, data: schemaResult.data, error: schemaResult.error, latencyMs: schemaResult.latencyMs });
    const schemas = schemaResult.data ?? {
      uiSchema: { pages: [], components: [] },
      apiSchema: { endpoints: [], middleware: [], version: "v1" },
      dbSchema: { tables: [] },
      authSchema: { providers: [], roles: [], strategy: "", sessionType: "database" as const, protectedRoutes: [] },
    };

    // Stage 4: Validation
    const validationResult = await runStage("Validation", "validation", async () => validateSchemas(intent, systemDesign, schemas));
    stages.push({ stage: "validation", success: validationResult.success, data: validationResult.data, error: validationResult.error, latencyMs: validationResult.latencyMs });
    const validationReport = validationResult.data ?? {
      isValid: true,
      issues: [],
      summary: { errors: 0, warnings: 0, info: 0 },
      timestamp: new Date().toISOString(),
    };

    // Stage 5: Repair (if needed)
    let finalSchemas = schemas;
    let repairResult;
    if (!validationReport.isValid || validationReport.issues.length > 0) {
      const repairStageResult = await runStage("Auto-Repair", "repair", () => repairSchemas(schemas, validationReport, intent));
      stages.push({ stage: "repair", success: repairStageResult.success, data: repairStageResult.data, error: repairStageResult.error, latencyMs: repairStageResult.latencyMs });
      if (repairStageResult.data) {
        finalSchemas = repairStageResult.data.repairedSchemas;
        repairResult = repairStageResult.data;
      }
    } else {
      await send("stage:skip", { stage: "repair", name: "Auto-Repair", reason: "No issues found" });
    }

    // Stage 6: Preview
    const previewResult = await runStage("Preview Build", "preview", async () => {
      const components = finalSchemas.uiSchema.components?.map((comp, i) => ({
        id: `comp_${i}`,
        type: comp.type,
        props: { ...comp.props, title: comp.props?.title ?? comp.name, entity: comp.entity, fields: comp.fields },
      }));
      return { components: components ?? [], layout: "grid" as const };
    });
    stages.push({ stage: "preview", success: previewResult.success, data: previewResult.data, error: previewResult.error, latencyMs: previewResult.latencyMs });

    const totalLatencyMs = Date.now() - pipelineStart;
    const success = stages.filter(s => s.stage !== "repair").every(s => s.success);

    const pipelineResult: PipelineResult = {
      projectId,
      success,
      stages,
      intent,
      systemDesign,
      schemas: finalSchemas,
      validationReport,
      repairResult,
      totalLatencyMs,
      timestamp: new Date().toISOString(),
    };

    // Store in demo store for retrieval
    demoStore.set(projectId, pipelineResult);

    // Try to persist to DB for non-demo users
    if (!isDemo) {
      try {
        await db.generatedSchema.create({
          data: {
            projectId,
            intentJson: intent as object,
            systemDesign: systemDesign as object,
            uiSchema: finalSchemas.uiSchema as object,
            apiSchema: finalSchemas.apiSchema as object,
            dbSchema: finalSchemas.dbSchema as object,
            authSchema: finalSchemas.authSchema as object,
          },
        });
        await db.validationReport.create({
          data: {
            projectId,
            issues: validationReport.issues as object[],
            status: validationReport.isValid ? "PASSED" : "FAILED",
          },
        });
        if (repairResult) {
          await db.repairLog.create({
            data: {
              projectId,
              repairs: repairResult.repairs as object[],
              success: repairResult.success,
            },
          });
        }
        await db.project.update({
          where: { id: projectId },
          data: { status: success ? "COMPLETED" : "FAILED" },
        });
      } catch (e) {
        console.warn("DB save failed", e);
      }
    }

    await send("complete", { projectId, success, totalLatencyMs });
    await writer.close();
  })().catch(async (err) => {
    console.error("Pipeline stream error", err);
    await send("error", { message: err instanceof Error ? err.message : "Unknown error" }).catch(() => {});
    await writer.close().catch(() => {});
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
