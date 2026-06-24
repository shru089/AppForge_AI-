import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { demoStore } from "@/lib/demo-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = demoStore.get(id);

  if (!result) {
    return NextResponse.json({ error: "Demo project not found" }, { status: 404 });
  }

  const latestValidation = result.validationReport;
  const latestRepair = result.repairResult;

  return NextResponse.json({
    success: true,
    project: {
      id: result.projectId,
      name: `Demo App — ${result.intent.appType}`,
      prompt: `Generated from pipeline run`,
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
      validationReports: latestValidation
        ? [{ issues: latestValidation.issues, status: latestValidation.isValid ? "PASSED" : "FAILED" }]
        : [],
      repairLogs: latestRepair
        ? [{ repairs: latestRepair.repairs, success: latestRepair.success }]
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
