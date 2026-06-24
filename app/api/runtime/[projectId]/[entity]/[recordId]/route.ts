import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  deleteRuntimeRecord,
  getRuntimeContext,
  updateRuntimeRecord,
} from "@/lib/runtime/data";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; entity: string; recordId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, entity, recordId } = await params;
    const payload = await req.json().catch(() => ({}));
    const context = await getRuntimeContext(projectId, session.user.id);
    const result = await updateRuntimeRecord(
      context,
      entity,
      recordId,
      payload as Record<string, unknown>
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, record: result.record });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update record." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; entity: string; recordId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, entity, recordId } = await params;
    const context = await getRuntimeContext(projectId, session.user.id);
    const result = await deleteRuntimeRecord(context, entity, recordId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete record." },
      { status: 400 }
    );
  }
}
