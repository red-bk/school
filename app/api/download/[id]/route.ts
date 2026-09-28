import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFileFromS3 } from "@/lib/s3";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const record = await prisma.sheetUpload.findUnique({
      where: { id: params.id },
    });

    if (!record) {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
    }

    // console.log("📥 Downloading:", {
    //   fileName: record.fileName,
    //   fileKey: record.fileKey,
    // });

    const { buffer, contentType } = await getFileFromS3(record.fileKey);

    // console.log("✅ File retrieved:", {
    //   size: buffer.length,
    //   contentType,
    // });

    // Properly encode filename with Arabic/non-ASCII characters
    // Use ONLY RFC 5987 UTF-8 encoding - don't include Arabic in fallback
    const encodedFileName = encodeURIComponent(record.fileName);

    // Use a generic ASCII fallback name, then provide UTF-8 encoded version
    // This avoids ByteString conversion errors with Arabic characters
    const dispositionHeader = `attachment; filename="file"; filename*=UTF-8''${encodedFileName}`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": dispositionHeader, // ← ASCII-only fallback + UTF-8 encoded
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("❌ Download error:", {
      id: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "فشل تحميل الملف" }, { status: 500 });
  }
}
