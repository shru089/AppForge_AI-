import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { repairSchemas } from "@/lib/pipeline/repairEngine";
import { validateSchemas } from "@/lib/pipeline/validator";
import { z } from "zod";

const repairRequestSchema = z.object({
  projectId: z.string(),
  schemas: z.object({}).passthrough(),
  intent: z.object({}).passthrough(),
  systemDesign: z.object({}).passthrough(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = repairRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { projectId, schemas, intent, systemDesign } = parsed.data;

    // Verify ownership
    const project = await db.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Run validation then repair
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validationReport = validateSchemas(intent as any, systemDesign as any, schemas as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repairResult = await repairSchemas(schemas as any, validationReport, intent as any);

    // Save repair log
    const repairLog = await db.repairLog.create({
      data: {
        projectId,
        repairs: repairResult.repairs as object[],
        success: repairResult.success,
      },
    });

    // Update validation report
    await db.validationReport.create({
      data: {
        projectId,
        issues: repairResult.remainingIssues as object[],
        status: repairResult.success ? "REPAIRED" : "FAILED",
      },
    });

    return NextResponse.json({
      success: true,
      repairResult,
      repairLogId: repairLog.id,
    });
  } catch (err) {
    console.error("[/api/repair]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
