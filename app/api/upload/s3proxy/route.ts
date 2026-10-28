import { NextRequest, NextResponse } from "next/server";
import { s3 } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function PUT(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    const contentType =
      req.nextUrl.searchParams.get("contentType") || "application/octet-stream";

    if (!key) {
      return NextResponse.json({ error: "missing key" }, { status: 400 });
    }

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("S3 proxy error:", error);
    return NextResponse.json({ error: "فشل رفع الملف" }, { status: 500 });
  }
}
