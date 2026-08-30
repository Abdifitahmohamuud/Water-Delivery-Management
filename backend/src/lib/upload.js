// import { v4 as uuidv4 } from "uuid";
// import path from "path";
// import { supabase } from "./supabase.js";

// const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || "agr";

// export const uploadToSupabase = async (file, folder = "products") => {
//   const fileExtension = path.extname(file.originalname || "").replace(".", "") || "bin";
//   const fileName = `${uuidv4()}.${fileExtension}`;
//   const filePath = `${folder}/${fileName}`;

//   if (!supabase) {
//     throw new Error("Supabase storage is not configured for file uploads");
//   }

//   const { data, error } = await supabase.storage
//     .from(supabaseBucket)
//     .upload(filePath, file.buffer, {
//       contentType: file.mimetype,
//       upsert: false,
//     });

//   if (error) {
//     throw error;
//   }

//   const { data: publicUrlData } = supabase.storage
//     .from(supabaseBucket)
//     .getPublicUrl(filePath);

//   return publicUrlData.publicUrl;
// };

// export const deleteFromSupabase = async (url) => {
//   if (!url) return;

//   if (!supabase || !/^https?:\/\//i.test(url)) return;

//   const marker = `/storage/v1/object/public/${supabaseBucket}/`;
//   const remotePath = url.includes(marker) ? url.split(marker)[1] : null;
//   if (remotePath) {
//     const { error } = await supabase.storage.from(supabaseBucket).remove([remotePath]);
//     if (error) throw error;
//   }
// };

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// 1. Habaynta S3 Client ee Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = "decoratione-commerce";
const PUBLIC_URL = process.env.R2_PUBLIC_URL; 

/**
 * Ku shubida sawirka/faylka Cloudflare R2
 */
export const uploadToR2 = async (file, folder = "products") => {
  const fileExtension = file.originalname.split(".").pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `${folder}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filePath,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  // Wuxuu soo celinayaa URL-ka sawirka laga eegi karo websaytka
  return `${PUBLIC_URL}/${filePath}`;
};

/**
 * Ka tirida faylka Cloudflare R2
 */
export const deleteFromR2 = async (url) => {
  try {
    const urlObj = new URL(url);
    const filePath = urlObj.pathname.startsWith("/")
      ? urlObj.pathname.slice(1)
      : urlObj.pathname;

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting from R2:", error);
  }
};