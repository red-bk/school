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
    const isFirstInBatch = formData.get("isFirstInBatch") === "true";

    // Instead of a File, receive the S3 result from the client
    const fileName = formData.get("fileName") as string | null;
    const fileUrl = formData.get("fileUrl") as string | null;
    const fileKey = formData.get("fileKey") as string | null;

    // --- Validation (identical to before) ---
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
    if (!fileName || !fileUrl || !fileKey) {
      return NextResponse.json({ error: "يجب رفع ملف" }, { status: 400 });
    }

    let replaced = false;

    // --- Replace logic (identical to before) ---
    if (isFirstInBatch) {
      const existingRecords = await prisma.sheetUpload.findMany({
        where: { teacherId: teacherId.trim(), sheetType },
      });
      if (existingRecords.length > 0) {
        replaced = true;
        await Promise.allSettled(
          existingRecords.map((r) => deleteFileFromS3(r.fileKey)),
        );
        await prisma.sheetUpload.deleteMany({
          where: { teacherId: teacherId.trim(), sheetType },
        });
      }
    }

    // --- Create DB record (identical to before) ---
    const record = await prisma.sheetUpload.create({
      data: {
        teacherId: teacherId.trim(),
        teacherName: teacherName.trim(),
        sheetType,
        fileName,
        fileUrl,
        fileKey,
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
    const teacherId = searchParams.get("teacherId")?.trim() || "";

    const where: any = {
      AND: [
        search
          ? {
              OR: [{ teacherName: { contains: search, mode: "insensitive" } }],
            }
          : {},
        type ? { sheetType: type } : {},
        teacherId ? { teacherId } : {}, // ← add this line
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
