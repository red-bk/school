import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSignedFileUrl } from "@/lib/s3";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const upload = await prisma.sheetUpload.findUnique({
      where: { id },
      select: { fileKey: true },
    });

    if (!upload) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const url = await getSignedFileUrl(upload.fileKey);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Preview error:", error);

    return NextResponse.json(
      { error: "Unable to preview file" },
      { status: 500 },
    );
  }
}
