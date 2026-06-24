import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRuntimeContext, importCsvRecords } from "@/lib/runtime/data";
import { z } from "zod";

const importSchema = z.object({
  fileName: z.string().min(1),
  csvText: z.string().min(1),
});

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
    const body = await req.json().catch(() => ({}));
    const parsed = importSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid import payload." }, { status: 400 });
    }

    const context = await getRuntimeContext(projectId, session.user.id);
    const summary = await importCsvRecords({
      context,
      entityName: entity,
      fileName: parsed.data.fileName,
      csvText: parsed.data.csvText,
    });

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import CSV." },
      { status: 400 }
    );
  }
}
