import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFileToS3, deleteFileFromS3 } from "@/lib/s3";
import { validateFile } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const teacherId = formData.get("teacherId");
    const teacherName = formData.get("teacherName");
    const sheetType = formData.get("sheetType");
    const file = formData.get("file") as File | null;

    // --- Basic validation ---
    if (!teacherId || typeof teacherId !== "string" || !teacherId.trim()) {
      return NextResponse.json(
        { error: "الرقم التعريفي للمعلم مطلوب" },
        { status: 400 },
      );
    }

    if (
      !teacherName ||
      typeof teacherName !== "string" ||
      !teacherName.trim()
    ) {
      return NextResponse.json({ error: "اسم المعلم مطلوب" }, { status: 400 });
    }

    if (!sheetType || typeof sheetType !== "string") {
      return NextResponse.json({ error: "نوع الورقة مطلوب" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "يجب رفع ملف" }, { status: 400 });
    }

    const fileError = validateFile(file);
    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 400 });
    }

    // --- Check for a previous submission of this exact sheet type ---
    // If one exists, we replace its file instead of creating a duplicate.
    const existing = await prisma.sheetUpload.findFirst({
      where: {
        teacherId: teacherId.trim(),
        sheetType,
      },
    });

    // --- Convert File -> Buffer ---
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // --- Upload the new file to S3 ---
    const { fileUrl, key } = await uploadFileToS3(
      buffer,
      file.name,
      file.type || "application/octet-stream",
    );

    if (existing) {
      // --- Replace: remove the old S3 object, update the existing record ---
      await deleteFileFromS3(existing.fileKey);

      const updated = await prisma.sheetUpload.update({
        where: { id: existing.id },
        data: {
          teacherName: teacherName.trim(),
          fileName: file.name,
          fileUrl,
          fileKey: key,
        },
      });

      return NextResponse.json(
        {
          success: true,
          replaced: true,
          data: updated,
        },
        { status: 200 },
      );
    }

    // --- No previous record: create a new one ---
    const record = await prisma.sheetUpload.create({
      data: {
        teacherId: teacherId.trim(),
        teacherName: teacherName.trim(),
        sheetType,
        fileName: file.name,
        fileUrl,
        fileKey: key,
      },
    });

    return NextResponse.json(
      { success: true, replaced: false, data: record },
      { status: 201 },
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "حدث خطأ ما أثناء رفع الملف" },
      { status: 500 },
    );
  }
}

// Optional: list all uploaded sheets
export async function GET() {
  try {
    const records = await prisma.sheetUpload.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "فشل في جلب السجلات" }, { status: 500 });
  }
}
