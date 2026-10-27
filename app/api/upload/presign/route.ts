import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    const { fileName, contentType, fileSize } = await req.json();

    if (!fileName || !contentType || !fileSize) {
      return NextResponse.json(
        { error: "بيانات الملف مطلوبة" },
        { status: 400 },
      );
    }

    const result = await getPresignedUploadUrl(fileName, contentType);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "فشل إنشاء رابط الرفع" },
      { status: 500 },
    );
  }
}
