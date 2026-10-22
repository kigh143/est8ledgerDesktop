import apiClient from "../services/api";

// Mirrors the mobile app's presigned flow: the backend issues a short-lived
// Bunny PUT url per file (POST /uploads/presigned-urls) and the browser uploads
// straight to Bunny with it, so no storage credentials ever reach the client.
export type UploadCategory =
  | "PROFILE_PHOTO"
  | "PROPERTY_PHOTO"
  | "PROPERTY_LISTING_PHOTO"
  | "INSPECTION_PHOTO"
  | "RENT_PAYMENT_PROOF"
  | "REPAIR_REQUEST_PHOTO";

const CONTENT_TYPE = "image/jpeg"; // compressImage always re-encodes to JPEG
const MAX_WIDTH = 1024;
const QUALITY = 0.7;

interface PresignedFile {
  key: string;
  publicUrl: string;
  uploadUrl: string;
}

/** Resize to at most 1024px wide and re-encode as JPEG, matching the mobile app's output. */
export const compressImage = async (file: File): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image processing isn't supported in this browser");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(`Couldn't process ${file.name}`))),
      CONTENT_TYPE,
      QUALITY
    )
  );
};

const requestUploadUrls = async (
  category: UploadCategory,
  entityId: number | string,
  fileSizes: number[]
): Promise<PresignedFile[]> => {
  const { data } = await apiClient.post("/uploads/presigned-urls", {
    category,
    entityId,
    files: fileSizes.map((fileSize) => ({ contentType: CONTENT_TYPE, fileSize })),
  });
  return data.files;
};

const putToPresignedUrl = async (uploadUrl: string, blob: Blob) => {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": CONTENT_TYPE },
    body: blob,
  });
  if (!response.ok) throw new Error(`Photo upload failed (${response.status})`);
};

/** Compress then upload images in one request, returning their public CDN urls in order. */
export const uploadImages = async (
  files: File[],
  category: UploadCategory,
  entityId: number | string
): Promise<string[]> => {
  if (files.length === 0) return [];

  const blobs = await Promise.all(files.map(compressImage));
  const presigned = await requestUploadUrls(
    category,
    entityId,
    blobs.map((blob) => blob.size)
  );
  if (!Array.isArray(presigned) || presigned.length !== blobs.length) {
    throw new Error("The server didn't return an upload link for every photo");
  }

  await Promise.all(blobs.map((blob, index) => putToPresignedUrl(presigned[index].uploadUrl, blob)));
  return presigned.map((file) => file.publicUrl);
};
