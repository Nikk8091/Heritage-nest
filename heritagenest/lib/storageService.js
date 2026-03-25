import { supabase, BUCKET_NAME } from "./supabase";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/x-m4a"];

export function validateFile(file) {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    if (file.size > MAX_IMAGE_SIZE) return { valid: false, error: "Image must be under 10MB" };
    return { valid: true, mediaType: "image" };
  }
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
    if (file.size > MAX_VIDEO_SIZE) return { valid: false, error: "Video must be under 100MB" };
    return { valid: true, mediaType: "video" };
  }
  if (ALLOWED_AUDIO_TYPES.includes(file.type)) {
    if (file.size > MAX_AUDIO_SIZE) return { valid: false, error: "Audio must be under 20MB" };
    return { valid: true, mediaType: "audio" };
  }
  return {
    valid: false,
    error: "Unsupported file type. Use JPEG, PNG, WebP, MP4, WebM, MP3, WAV, or OGG.",
  };
}

export async function uploadMediaFile(file, userId, onProgress) {
  const validation = validateFile(file);
  if (!validation.valid) return { url: null, mediaType: null, error: validation.error };

  const ext = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;

  try {
    // Supabase doesn't support native progress events, simulate with XHR if needed
    if (onProgress) onProgress(10);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) return { url: null, mediaType: null, error: error.message };

    if (onProgress) onProgress(100);

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl, mediaType: validation.mediaType, error: null };
  } catch (error) {
    return { url: null, mediaType: null, error: error.message };
  }
}

export async function deleteMediaFile(fileUrl) {
  try {
    // Extract path from public URL
    const urlParts = fileUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) return { error: "Invalid file URL" };
    const filePath = urlParts[1];
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    if (error) return { error: error.message };
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}
