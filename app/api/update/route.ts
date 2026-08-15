import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFileToS3, deleteFileFromS3 } from "@/lib/s3";

export async function PATCH(req: NextRequest) {
  try {
    const formData = await req.formData();

    const teacherId = formData.get("teacherId");
    const sheetType = formData.get("sheetType");
    const file = formData.get("file") as File | null;

    // --- Basic validation ---
    if (!teacherId || typeof teacherId !== "string" || !teacherId.trim()) {
      return NextResponse.json(
        { error: "الرقم التعريفي للمعلم مطلوب" },
        { status: 400 },
      );
    }

    if (!sheetType || typeof sheetType !== "string") {
      return NextResponse.json({ error: "نوع الورقة مطلوب" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json(
        { error: "يجب تقديم ملف بديل" },
        { status: 400 },
      );
    }

    // --- Find the existing record for this teacher + sheet type ---
    // If a teacher has submitted the same sheet type more than once,
    // we update the most recent one.
    const existing = await prisma.sheetUpload.findFirst({
      where: {
        teacherId: teacherId.trim(),
        sheetType,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "لم يتم العثور على ورقة بهذا الرقم التعريفي ونوع الورقة",
        },
        { status: 404 },
      );
    }

    // --- Upload the new file to S3 ---
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { fileUrl, key } = await uploadFileToS3(
      buffer,
      file.name,
      file.type || "application/octet-stream",
    );

    // --- Remove the old file from S3 (best-effort, won't block on failure) ---
    await deleteFileFromS3(existing.fileKey);

    // --- Update the DB record (updatedAt is bumped automatically) ---
    const updated = await prisma.sheetUpload.update({
      where: { id: existing.id },
      data: {
        fileName: file.name,
        fileUrl,
        fileKey: key,
      },
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "حدث خطأ ما أثناء تحديث الملف" },
      { status: 500 },
    );
  }
}
