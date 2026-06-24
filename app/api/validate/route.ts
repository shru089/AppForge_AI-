import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateSchemas } from "@/lib/pipeline/validator";
import { z } from "zod";

const validateSchema = z.object({
  intent: z.object({}).passthrough(),
  systemDesign: z.object({}).passthrough(),
  schemas: z.object({
    uiSchema: z.object({}).passthrough(),
    apiSchema: z.object({}).passthrough(),
    dbSchema: z.object({}).passthrough(),
    authSchema: z.object({}).passthrough(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = validateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const report = validateSchemas(parsed.data.intent as any, parsed.data.systemDesign as any, parsed.data.schemas as any);

    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error("[/api/validate]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
