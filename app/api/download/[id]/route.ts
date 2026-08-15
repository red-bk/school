import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFileFromS3 } from "@/lib/s3";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const record = await prisma.sheetUpload.findUnique({
      where: { id: params.id },
    });

    if (!record) {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
    }

    const { buffer, contentType } = await getFileFromS3(record.fileKey);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // "attachment" forces the browser to save the file instead of
        // opening/previewing it, regardless of its origin or type.
        "Content-Disposition": `attachment; filename="${record.fileName}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "فشل تحميل الملف" },
      { status: 500 }
    );
  }
}
