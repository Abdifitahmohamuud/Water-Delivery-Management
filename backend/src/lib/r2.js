import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

// 1. Habaynta S3 Client ee Cloudflare R2
const accountId = process.env.R2_ACCOUNT_ID || "demo-account-id";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "demo-access-key";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "demo-secret-key";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "decoratione-commerce";
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || "https://pub-r2.com").replace(/\/$/, "");

/**
 * Ku shubida sawirka/faylka Cloudflare R2
 */
export const uploadToR2 = async (file, folder = "products") => {
  if (!file || !file.buffer) {
    throw new Error("No file buffer provided for R2 upload");
  }

  const fileExtension = file.originalname ? file.originalname.split(".").pop() : "jpg";
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `${folder}/${fileName}`;

  // If R2 credentials are configured, execute R2 S3 command
  if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID) {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: file.buffer,
      ContentType: file.mimetype || "image/jpeg",
    });

    await s3Client.send(command);
    return `${PUBLIC_URL}/${filePath}`;
  } else {
    // Fallback data URI for local demo if R2 keys not set
    const base64 = file.buffer.toString("base64");
    const mime = file.mimetype || "image/jpeg";
    return `data:${mime};base64,${base64}`;
  }
};

/**
 * Ka tirida faylka Cloudflare R2
 */
export const deleteFromR2 = async (url) => {
  if (!url || typeof url !== "string" || !url.startsWith("http")) return;

  try {
    const urlObj = new URL(url);
    const filePath = urlObj.pathname.startsWith("/")
      ? urlObj.pathname.slice(1)
      : urlObj.pathname;

    if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID) {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filePath,
      });

      await s3Client.send(command);
    }
  } catch (error) {
    console.error("Error deleting from R2:", error);
  }
};
