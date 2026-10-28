import { NextRequest, NextResponse } from "next/server";
import { s3 } from "@/lib/s3";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { key, uploadId, parts } = await req.json();

    if (!key || !uploadId || !parts) {
      return NextResponse.json({ error: "بيانات مطلوبة" }, { status: 400 });
    }

    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map((p: { ETag: string; partNumber: number }) => ({
          ETag: p.ETag,
          PartNumber: p.partNumber,
        })),
      },
    });

    await s3.send(command);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Multipart complete error:", error);
    return NextResponse.json({ error: "فشل إكمال الرفع" }, { status: 500 });
  }
}
