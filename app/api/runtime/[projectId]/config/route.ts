import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getRuntimeContext,
  listAllRuntimeRecords,
  listCsvImportJobs,
  listRuntimeNotifications,
  listWorkflowRuns,
} from "@/lib/runtime/data";
import { buildDashboardMetrics } from "@/lib/runtime/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const context = await getRuntimeContext(projectId, session.user.id);
    const [records, notifications, workflows, imports] = await Promise.all([
      listAllRuntimeRecords(context),
      listRuntimeNotifications(context),
      listWorkflowRuns(context),
      listCsvImportJobs(context),
    ]);

    return NextResponse.json({
      success: true,
      config: context.config,
      metrics: buildDashboardMetrics(
        context.config.entities,
        records,
        notifications.length,
        workflows.length
      ),
      notifications,
      workflows,
      imports,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load runtime.",
      },
      { status: 404 }
    );
  }
}
