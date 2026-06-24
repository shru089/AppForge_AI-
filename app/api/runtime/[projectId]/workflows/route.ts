import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRuntimeContext, listWorkflowRuns } from "@/lib/runtime/data";

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
    const workflows = await listWorkflowRuns(context);

    return NextResponse.json({ success: true, workflows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load workflows." },
      { status: 400 }
    );
  }
}
