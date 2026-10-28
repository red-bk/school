import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

export const s3 = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

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

export async function getSignedFileUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: "inline",
  });
  return getSignedUrl(s3, command, { expiresIn: 18000 });
}

export async function uploadFileToS3(
  buffer: Buffer,
  originalFileName: string,
  contentType: string,
) {
  const extension = originalFileName.split(".").pop() || "bin";
  const key = `sheets/${randomUUID()}.${extension}`;
  const finalContentType = getMimeType(originalFileName, contentType);

  console.log("📤 Uploading to S3:", {
    fileName: originalFileName,
    key,
    contentType: finalContentType,
    size: buffer.length,
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: key,
      Body: buffer,
      ContentType: finalContentType,
    }),
  );

  const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  console.log("✅ File uploaded successfully:", { key, fileUrl });
  return { fileUrl, key };
}

export async function getFileFromS3(key: string) {
  const result = await s3.send(
    new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: key,
    }),
  );
  const byteArray = await result.Body!.transformToByteArray();
  const buffer = Buffer.from(byteArray);
  return {
    buffer,
    contentType: result.ContentType || "application/octet-stream",
  };
}

export async function deleteFileFromS3(key: string) {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: key,
      }),
    );
  } catch (error) {
    console.error("Failed to delete old S3 object:", key, error);
  }
}

export async function getPresignedUploadUrl(
  originalFileName: string,
  contentType: string,
) {
  const extension = originalFileName.split(".").pop() || "bin";
  const key = `sheets/${randomUUID()}.${extension}`;
  const finalContentType = getMimeType(originalFileName, contentType);

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME as string,
    Key: key,
    ContentType: finalContentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl, key, contentType: finalContentType };
}
