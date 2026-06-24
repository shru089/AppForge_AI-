import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProjectMetrics } from "@/lib/metrics";
import { demoStore } from "@/lib/demo-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check demo store first — demo projects are stored in-memory
    if (demoStore.has(id)) {
      const result = demoStore.get(id)!;
      return NextResponse.json({
        success: true,
        project: {
          id: result.projectId,
          name: `Demo App — ${result.intent.appType}`,
          prompt: `AI-generated ${result.intent.appType} application`,
          status: result.success ? "COMPLETED" : "FAILED",
          createdAt: result.timestamp,
          generatedSchema: {
            intentJson: result.intent,
            systemDesign: result.systemDesign,
            uiSchema: result.schemas.uiSchema,
            apiSchema: result.schemas.apiSchema,
            dbSchema: result.schemas.dbSchema,
            authSchema: result.schemas.authSchema,
          },
          validationReports: [
            { issues: result.validationReport.issues, status: result.validationReport.isValid ? "PASSED" : "FAILED" },
          ],
          repairLogs: result.repairResult
            ? [{ repairs: result.repairResult.repairs, success: result.repairResult.success }]
            : [],
          stages: result.stages,
        },
        metrics: {
          totalLatencyMs: result.totalLatencyMs,
          successRate: result.success ? 100 : 0,
          totalRepairs: result.repairResult?.repairs.length ?? 0,
          stageCount: result.stages.length,
        },
      });
    }

    // Fallback to DB
    const project = await db.project.findFirst({
      where: { id, userId: session.user.id },
      include: {
        generatedSchema: true,
        validationReports: { orderBy: { createdAt: "desc" }, take: 1 },
        repairLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { summary } = await getProjectMetrics(id);

    return NextResponse.json({
      success: true,
      project,
      metrics: summary,
    });
  } catch (err) {
    console.error("[/api/project/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await db.project.deleteMany({ where: { id, userId: session.user.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/project/[id] DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
