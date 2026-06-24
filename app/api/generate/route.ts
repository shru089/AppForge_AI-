import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runPipeline } from "@/lib/pipeline";
import { z } from "zod";

const generateSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters").max(5000),
  projectName: z.string().min(1).max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, projectName } = parsed.data;

    let projectId = "demo-project-id";
    try {
      // Create project record
      const project = await db.project.create({
        data: {
          name: projectName ?? `App from: ${prompt.slice(0, 50)}...`,
          prompt,
          status: "PROCESSING",
          userId: session.user.id,
        },
      });
      projectId = project.id;
    } catch (dbErr) {
      console.warn("Database create failed, using demo project ID", dbErr);
    }

    // Run the full AI pipeline
    const result = await runPipeline(prompt, projectId);

    try {
      // Save generated schemas
      await db.generatedSchema.create({
        data: {
          projectId,
          intentJson: result.intent as object,
          systemDesign: result.systemDesign as object,
          uiSchema: result.schemas.uiSchema as object,
          apiSchema: result.schemas.apiSchema as object,
          dbSchema: result.schemas.dbSchema as object,
          authSchema: result.schemas.authSchema as object,
        },
      });

      // Save validation report
      await db.validationReport.create({
        data: {
          projectId,
          issues: result.validationReport.issues as object[],
          status: result.validationReport.isValid ? "PASSED" : "FAILED",
        },
      });

      // Save repair log if repairs happened
      if (result.repairResult) {
        await db.repairLog.create({
          data: {
            projectId,
            repairs: result.repairResult.repairs as object[],
            success: result.repairResult.success,
          },
        });
      }

      // Update project status
      await db.project.update({
        where: { id: projectId },
        data: { status: result.success ? "COMPLETED" : "FAILED" },
      });
    } catch (dbErr) {
      console.warn("Database save failed, continuing demo mode", dbErr);
    }

    return NextResponse.json({
      success: true,
      projectId,
      result,
    });
  } catch (err) {
    console.error("[/api/generate]", err);
    return NextResponse.json(
      { error: "Internal server error", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
