import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createRuntimeRecord,
  getRuntimeContext,
  listRuntimeRecords,
} from "@/lib/runtime/data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; entity: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, entity } = await params;
    const context = await getRuntimeContext(projectId, session.user.id);
    const records = await listRuntimeRecords(context, entity);

    return NextResponse.json({ success: true, records });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load records." },
      { status: 400 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; entity: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, entity } = await params;
    const payload = await req.json().catch(() => ({}));
    const context = await getRuntimeContext(projectId, session.user.id);
    const result = await createRuntimeRecord(
      context,
      entity,
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
      { error: error instanceof Error ? error.message : "Failed to create record." },
      { status: 400 }
    );
  }
}
