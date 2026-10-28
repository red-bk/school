import { NextRequest, NextResponse } from "next/server";
import { s3 } from "@/lib/s3";
import { UploadPartCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const key = searchParams.get("key");
    const uploadId = searchParams.get("uploadId");
    const partNumber = parseInt(searchParams.get("partNumber") || "0");

    if (!key || !uploadId || !partNumber) {
      return NextResponse.json({ error: "بيانات مطلوبة" }, { status: 400 });
    }

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new UploadPartCommand({
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: buffer,
    });

    const { ETag } = await s3.send(command);

    return NextResponse.json({ ETag, partNumber });
  } catch (error) {
    console.error("Chunk upload error:", error);
    return NextResponse.json({ error: "فشل رفع الجزء" }, { status: 500 });
  }
}
