import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const ACCESS_CODE = process.env.TEMPLATES_ACCESS_CODE || "";
const RESTRICTED_DIR = path.join(process.cwd(), "restricted-templates");

// Whitelist of file names allowed through this route.
// Prevents path traversal and limits this endpoint to exactly
// the files you intend to gate.
const ALLOWED_FILES = new Set(["حصر الكفاءات من المعلمين.docx"]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get("file") || "";
  const code = searchParams.get("code") || "";

  if (!ACCESS_CODE) {
    return NextResponse.json(
      { error: "لم يتم إعداد كلمة السر على الخادم" },
      { status: 500 },
    );
  }

  if (code !== ACCESS_CODE) {
    return NextResponse.json({ error: "كلمة السر غير صحيحة" }, { status: 401 });
  }

  if (!ALLOWED_FILES.has(file)) {
    return NextResponse.json({ error: "ملف غير معروف" }, { status: 404 });
  }

  try {
    const filePath = path.join(RESTRICTED_DIR, file);
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file)}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "تعذر العثور على الملف" },
      { status: 500 },
    );
  }
}
