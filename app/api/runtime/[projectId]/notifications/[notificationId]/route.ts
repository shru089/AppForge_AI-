import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRuntimeContext, markNotificationRead } from "@/lib/runtime/data";

export async function PATCH(
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ projectId: string; notificationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, notificationId } = await params;
    const context = await getRuntimeContext(projectId, session.user.id);
    const result = await markNotificationRead(context, notificationId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update notification.",
      },
      { status: 400 }
    );
  }
}
