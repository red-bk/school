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

export async function getSignedFileUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: "inline",
  });

  return getSignedUrl(s3, command, {
    expiresIn: 18000, // 5 hour
  });
}

/**
 * Uploads a file buffer to S3 and returns its public URL + key.
 */
export async function uploadFileToS3(
  buffer: Buffer,
  originalFileName: string,
  contentType: string,
) {
  const extension = originalFileName.split(".").pop() || "bin";
  const key = `sheets/${randomUUID()}.${extension}`;

  // Override contentType based on file extension - don't trust browser!
  // This ensures S3 stores the correct MIME type regardless of what the client sends
  let finalContentType = contentType;

  if (originalFileName.endsWith(".pptx")) {
    finalContentType =
      "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  } else if (originalFileName.endsWith(".ppt")) {
    finalContentType = "application/vnd.ms-powerpoint";
  } else if (originalFileName.endsWith(".docx")) {
    finalContentType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } else if (originalFileName.endsWith(".doc")) {
    finalContentType = "application/msword";
  } else if (originalFileName.endsWith(".xlsx")) {
    finalContentType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  } else if (originalFileName.endsWith(".xls")) {
    finalContentType = "application/vnd.ms-excel";
  } else if (originalFileName.endsWith(".pdf")) {
    finalContentType = "application/pdf";
  }

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
      ContentType: finalContentType, // ← Use corrected MIME type!
    }),
  );

  const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  console.log("✅ File uploaded successfully:", { key, fileUrl });

  return { fileUrl, key };
}

/**
 * Fetches an object from S3 by key and returns it as a Node Buffer,
 * along with its content type — used to stream downloads through
 * our own API route (so we can force a "Save As" download regardless
 * of the browser or the object's original headers).
 */
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

/**
 * Deletes an object from S3 by key. Used when replacing a file during
 * an update, so the old object doesn't stay around as orphaned storage.
 * Errors are swallowed (logged only) so a delete failure never blocks
 * the more important "save the new file + update the DB" flow.
 */
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

  // Same MIME override logic you already have
  let finalContentType = contentType;
  if (originalFileName.endsWith(".pptx")) {
    finalContentType =
      "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  } else if (originalFileName.endsWith(".ppt")) {
    finalContentType = "application/vnd.ms-powerpoint";
  } else if (originalFileName.endsWith(".docx")) {
    finalContentType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } else if (originalFileName.endsWith(".doc")) {
    finalContentType = "application/msword";
  } else if (originalFileName.endsWith(".xlsx")) {
    finalContentType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  } else if (originalFileName.endsWith(".xls")) {
    finalContentType = "application/vnd.ms-excel";
  } else if (originalFileName.endsWith(".pdf")) {
    finalContentType = "application/pdf";
  }

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME as string,
    Key: key,
    ContentType: finalContentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl, key, contentType: finalContentType };
}
