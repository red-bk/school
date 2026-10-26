import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFileFromS3 } from "@/lib/s3";

export async function DELETE(
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

    await deleteFileFromS3(record.fileKey);
    await prisma.sheetUpload.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء الحذف" }, { status: 500 });
  }
}
