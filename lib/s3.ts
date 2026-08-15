import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

export const s3 = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

/**
 * Uploads a file buffer to S3 and returns its public URL + key.
 */
export async function uploadFileToS3(
  buffer: Buffer,
  originalFileName: string,
  contentType: string
) {
  const extension = originalFileName.split(".").pop() || "bin";
  const key = `sheets/${randomUUID()}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Remove ACL if your bucket has "Bucket owner enforced" object ownership
      // (uncomment only if your bucket policy requires public-read ACLs)
      // ACL: "public-read",
    })
  );

  const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

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
    })
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
      })
    );
  } catch (error) {
    console.error("Failed to delete old S3 object:", key, error);
  }
}
