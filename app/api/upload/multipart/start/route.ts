import { NextRequest, NextResponse } from "next/server";
import { s3 } from "@/lib/s3";
import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

function getMimeType(fileName: string, fallback: string): string {
  if (fileName.endsWith(".pptx"))
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (fileName.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
  if (fileName.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (fileName.endsWith(".doc")) return "application/msword";
  if (fileName.endsWith(".xlsx"))
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (fileName.endsWith(".xls")) return "application/vnd.ms-excel";
  if (fileName.endsWith(".pdf")) return "application/pdf";
  return fallback;
}

export async function POST(req: NextRequest) {
  try {
    const { fileName, contentType } = await req.json();
    if (!fileName || !contentType) {
      return NextResponse.json({ error: "بيانات مطلوبة" }, { status: 400 });
    }

    const extension = fileName.split(".").pop() || "bin";
    const key = `sheets/${randomUUID()}.${extension}`;
    const finalContentType = getMimeType(fileName, contentType);

    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: key,
      ContentType: finalContentType,
    });

    const { UploadId } = await s3.send(command);
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({
      uploadId: UploadId,
      key,
      fileUrl,
      contentType: finalContentType,
    });
  } catch (error) {
    console.error("Multipart start error:", error);
    return NextResponse.json({ error: "فشل بدء الرفع" }, { status: 500 });
  }
}
