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

    // --- Validation ---
    if (!teacherId || typeof teacherId !== "string" || !teacherId.trim()) {
      return NextResponse.json(
        { error: "رقم الهوية للمعلم مطلوب" },
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

    // --- Check if this is the FIRST file in a new batch ---
    // The frontend marks the first file with a special flag so we know when to
    // delete old records. Without this, uploading 3 files would delete on file 1
    // then files 2 & 3 add normally — correct. But a second batch upload later
    // would also delete all records from the first batch on its first file — also correct.
    const isFirstInBatch = formData.get("isFirstInBatch") === "true";

    let replaced = false;

    if (isFirstInBatch) {
      // --- Delete all existing records for this teacherId + sheetType ---
      const existingRecords = await prisma.sheetUpload.findMany({
        where: { teacherId: teacherId.trim(), sheetType },
      });

      if (existingRecords.length > 0) {
        replaced = true;
        // Delete old S3 files
        await Promise.allSettled(
          existingRecords.map((r) => deleteFileFromS3(r.fileKey)),
        );
        // Delete old DB records
        await prisma.sheetUpload.deleteMany({
          where: { teacherId: teacherId.trim(), sheetType },
        });
      }
    }

    // --- Convert File -> Buffer ---
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // --- Upload new file to S3 ---
    const { fileUrl, key } = await uploadFileToS3(
      buffer,
      file.name,
      file.type || "application/octet-stream",
    );

    // --- Create new record ---
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
      { success: true, replaced, data: record },
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

// List all uploaded sheets
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const type = searchParams.get("type")?.trim() || "";

    const where: any = {
      AND: [
        search
          ? {
              OR: [{ teacherName: { contains: search, mode: "insensitive" } }],
            }
          : {},
        type ? { sheetType: type } : {},
      ],
    };

    const [uploads, totalCount] = await Promise.all([
      prisma.sheetUpload.findMany({ where, orderBy: { createdAt: "desc" } }),
      prisma.sheetUpload.count(),
    ]);

    return NextResponse.json({ success: true, uploads, totalCount });
  } catch (error) {
    console.error("Admin fetch error:", error);
    return NextResponse.json({ error: "فشل في جلب السجلات" }, { status: 500 });
  }
}
