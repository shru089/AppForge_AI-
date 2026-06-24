import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateCompleteArchitecture } from "@/lib/pipeline/megaGenerator";
import { generateDemoArchitecture } from "@/lib/pipeline/demoGenerator";
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
  const isDemoUser = userId === "demo-user-123";

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
    let isDemoMode = false;

    let projectId = `demo-${Date.now()}`;

    // Create DB project if not demo user
    if (!isDemoUser) {
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

    // Helper to log metrics and stream
    async function trackStage(
      stageName: string,
      stageKey: string,
      success: boolean,
      latencyMs: number,
      error?: string
    ) {
      if (success) {
        await send("stage:done", { stage: stageKey, name: stageName, latencyMs });
      } else {
        await send("stage:error", { stage: stageKey, name: stageName, error, latencyMs });
      }
      if (!isDemoUser) {
        await recordMetric({ projectId, stage: stageKey as never, latencyMs, success }).catch(() => {});
      }
      stages.push({ stage: stageKey as any, success, error, latencyMs });
    }

    // ── Stage 1: Mega Generation (Simulate Intent, Design, Schema for UI) ──
    const megaStart = Date.now();
    await send("stage:start", { stage: "intent", name: "Intent Extraction" });

    let architecture;
    let megaSuccess = false;
    let megaError;
    let megaLatency = 0;

    try {
      architecture = await generateCompleteArchitecture(prompt);
      megaSuccess = true;
      megaLatency = Date.now() - megaStart;
    } catch (err: any) {
      megaLatency = Date.now() - megaStart;
      megaError = err instanceof Error ? err.message : "Unknown error";
      const isRateLimit = megaError.includes("429") || megaError.includes("quota");
      
      if (isRateLimit) {
        console.log("[Pipeline Stream] 429 Quota Exceeded. Falling back to Demo Mode.");
        isDemoMode = true;
        architecture = generateDemoArchitecture(prompt);
        megaSuccess = true;
        megaError = undefined;
        await send("demo_mode", { active: true });
      }
    }

    if (!megaSuccess || !architecture) {
      await trackStage("Intent Extraction", "intent", false, megaLatency, megaError || "Architecture generation failed");
      await send("error", { message: "Generation failed" });
      await writer.close();
      return;
    }

    if (architecture.intent.requiresClarification) {
      await trackStage("Intent Extraction", "intent", false, megaLatency, "Prompt requires clarification");
      await send("error", { message: "Prompt requires clarification" });
      await writer.close();
      return;
    }

    // Simulate completion of the 3 stages for the frontend UI progress bar
    await trackStage("Intent Extraction", "intent", true, megaLatency / 3);
    
    await send("stage:start", { stage: "design", name: "System Design" });
    await trackStage("System Design", "design", true, megaLatency / 3);
    
    await send("stage:start", { stage: "schema", name: "Schema Generation" });
    await trackStage("Schema Generation", "schema", true, megaLatency / 3);

    const { intent, systemDesign, schemas } = architecture;

    // Stage 4: Validation
    await send("stage:start", { stage: "validation", name: "Validation" });
    const valStart = Date.now();
    let validationReport;
    try {
      validationReport = await validateSchemas(intent, systemDesign, schemas);
      await trackStage("Validation", "validation", true, Date.now() - valStart);
    } catch (err: any) {
      await trackStage("Validation", "validation", false, Date.now() - valStart, err.message);
      await send("error", { message: "Validation failed" });
      await writer.close();
      return;
    }

    // Stage 5: Auto-Repair
    let finalSchemas = schemas;
    let repairResult;
    if (!validationReport.isValid || validationReport.issues.length > 0) {
      await send("stage:start", { stage: "repair", name: "Auto-Repair" });
      const repStart = Date.now();
      try {
        repairResult = await repairSchemas(schemas, validationReport, intent);
        finalSchemas = repairResult.repairedSchemas;
        await trackStage("Auto-Repair", "repair", true, Date.now() - repStart);
      } catch (err: any) {
        await trackStage("Auto-Repair", "repair", false, Date.now() - repStart, err.message);
      }
    } else {
      await send("stage:skip", { stage: "repair", name: "Auto-Repair", reason: "No issues found" });
    }

    // Stage 6: Preview
    await send("stage:start", { stage: "preview", name: "Preview Build" });
    const prevStart = Date.now();
    try {
      const components = finalSchemas.uiSchema.components?.map((comp, i) => ({
        id: `comp_${i}`,
        type: comp.type,
        props: { ...comp.props, title: comp.props?.title ?? comp.name, entity: comp.entity, fields: comp.fields },
      }));
      await trackStage("Preview Build", "preview", true, Date.now() - prevStart);
    } catch (err: any) {
      await trackStage("Preview Build", "preview", false, Date.now() - prevStart, err.message);
    }

    const totalLatencyMs = Date.now() - pipelineStart;
    const success = stages.filter(s => s.stage !== "repair" && s.stage !== "preview").every(s => s.success);

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
      isDemoMode,
    };

    // Store in demo store for retrieval
    demoStore.set(projectId, pipelineResult);

    // Try to persist to DB for non-demo users
    if (!isDemoUser) {
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

    await send("complete", { projectId, success, totalLatencyMs, isDemoMode });
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
