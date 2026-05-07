import { httpClient } from "./http/client";
import { ApiResponse } from "@/types/user";
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Response từ API upload media
 */
export interface MediaUploadResponse {
  url: string;
  secure_url: string; // URL HTTPS - dùng để hiển thị và lưu vào DB
  public_id: string; // ID trên Cloudinary - cần lưu để xóa sau
  format: string; // Định dạng sau xử lý (vd: webp)
  width: number;
  height: number;
  bytes: number;
  duration?: number; // Video only (seconds)
  resource_type: "image" | "video";
}

/**
 * Options cho upload image
 */
export interface UploadImageOptions {
  fileUri: string; // URI của file (từ ImagePicker)
  fileName?: string; // Tên file (mặc định: image.jpg)
  fileType?: string; // MIME type (mặc định: image/jpeg)
  folder?: string; // Folder Cloudinary (mặc định: tripjoy/misc)
  timeoutMs?: number; // Timeout upload (mặc định: 60 giây)
  compress?: boolean; // Compress image before upload (mặc định: true)
  maxWidth?: number; // Max width for compression (mặc định: 1920)
  quality?: number; // JPEG quality 0-1 (mặc định: 0.8)
}

/**
 * Options cho upload video
 */
export interface UploadVideoOptions {
  fileUri: string;
  fileName?: string;
  fileType?: string; // MIME type (mặc định: video/mp4)
  folder?: string;
  timeoutMs?: number; // Timeout upload (mặc định: 120 giây)
}

/**
 * Compress image before upload to reduce file size
 * @param fileUri - Local file URI
 * @param maxWidth - Maximum width (default: 1920px)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Compressed image URI
 */
async function compressImage(
  fileUri: string,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<string> {
  try {
    console.log("[compressImage] Compressing image:", { fileUri, maxWidth, quality });

    const result = await ImageManipulator.manipulateAsync(
      fileUri,
      [{ resize: { width: maxWidth } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    console.log("[compressImage] Compression complete:", result.uri);
    return result.uri;
  } catch (error) {
    console.warn("[compressImage] Compression failed, using original:", error);
    return fileUri; // Fallback to original if compression fails
  }
}

/**
 * Upload ảnh lên Cloudinary qua backend
 * @param options - Options cho upload
 * @returns MediaUploadResponse với secure_url và public_id
 */
export async function uploadImage(
  options: UploadImageOptions
): Promise<MediaUploadResponse> {
  const {
    fileUri,
    fileName = "image.jpg",
    fileType = "image/jpeg",
    folder,
    timeoutMs = 60000,
    compress = true,
    maxWidth = 1920,
    quality = 0.8,
  } = options;

  // Compress image before upload (if enabled)
  let uploadUri = fileUri;
  if (compress) {
    uploadUri = await compressImage(fileUri, maxWidth, quality);
  }

  // Tạo FormData cho React Native
  // Format cho React Native: { uri, type, name }
  const formData = new FormData();
  formData.append("file", {
    uri: uploadUri,
    type: fileType,
    name: fileName,
  } as any);

  console.log("[uploadImage] FormData created:", {
    originalUri: fileUri,
    uploadUri,
    fileName,
    fileType,
    folder,
    compressed: compress,
    formDataKeys: formData._parts?.map((p: any) => p[0]) || [],
  });

  const uploadWithUrl = (url: string) =>
    httpClient.post<ApiResponse<MediaUploadResponse>>(url, formData, {
      timeout: timeoutMs,
    });

  // Build URL với query params
  let response: ApiResponse<MediaUploadResponse>;
  if (folder) {
    const urlWithFolder = `/media/upload/image?folder=${encodeURIComponent(folder)}`;
    try {
      response = await uploadWithUrl(urlWithFolder);
    } catch (error) {
      console.warn(
        "[uploadImage] Upload with folder failed, fallback to default folder:",
        folder
      );
      response = await uploadWithUrl("/media/upload/image");
    }
  } else {
    response = await uploadWithUrl("/media/upload/image");
  }

  if (response.code !== 1000) {
    throw new Error(response.message || "Failed to upload image");
  }

  if (!response.data) {
    throw new Error("No data returned from upload API");
  }

  return response.data;
}

/**
 * Upload video lên Cloudinary qua backend
 * @param options - Options cho upload
 * @returns MediaUploadResponse với secure_url và public_id
 */
export async function uploadVideo(
  options: UploadVideoOptions
): Promise<MediaUploadResponse> {
  const { fileUri, fileName = "video.mp4", fileType = "video/mp4", folder, timeoutMs = 120000 } = options;

  const formData = new FormData();
  formData.append("file", {
    uri: fileUri,
    type: fileType,
    name: fileName,
  } as any);

  let url = "/media/upload/video";
  if (folder) {
    url += `?folder=${encodeURIComponent(folder)}`;
  }

  // Không set Content-Type header - React Native sẽ tự động set với boundary
  const response = await httpClient.post<ApiResponse<MediaUploadResponse>>(
    url,
    formData,
    { timeout: timeoutMs }
  );

  if (response.code !== 1000) {
    throw new Error(response.message || "Failed to upload video");
  }

  if (!response.data) {
    throw new Error("No data returned from upload API");
  }

  return response.data;
}

/**
 * Xóa media trên Cloudinary
 * @param publicId - Cloudinary public_id
 * @param resourceType - "image" hoặc "video" (mặc định: "image")
 */
export async function deleteMedia(
  publicId: string,
  resourceType: "image" | "video" = "image"
): Promise<void> {
  const url = `/media/delete?publicId=${encodeURIComponent(publicId)}&resourceType=${resourceType}`;
  
  const response = await httpClient.delete<ApiResponse<void>>(url);

  if (response.code !== 1000) {
    throw new Error(response.message || "Failed to delete media");
  }
}

/**
 * Lấy chữ ký để upload trực tiếp lên Cloudinary (client-side)
 * @param folder - Folder Cloudinary (mặc định: tripjoy/misc)
 * @param uploadPreset - Upload preset name (optional)
 * @returns Object chứa signature, timestamp, apiKey, cloudName
 */
export async function getUploadSignature(
  folder?: string,
  uploadPreset?: string
): Promise<{
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  uploadPreset?: string;
}> {
  let url = "/media/sign";
  const params: string[] = [];
  if (folder) {
    params.push(`folder=${encodeURIComponent(folder)}`);
  }
  if (uploadPreset) {
    params.push(`uploadPreset=${encodeURIComponent(uploadPreset)}`);
  }
  if (params.length > 0) {
    url += `?${params.join("&")}`;
  }

  const response = await httpClient.get<ApiResponse<{
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    uploadPreset?: string;
  }>>(url);

  if (response.code !== 1000) {
    throw new Error(response.message || "Failed to get upload signature");
  }

  if (!response.data) {
    throw new Error("No data returned from sign API");
  }

  return response.data;
}

/**
 * Apply Cloudinary transformations to optimize image delivery
 * @param imageUrl - Original Cloudinary URL
 * @param transformation - Transformation string (e.g., "c_fill,w_600,h_600")
 * @returns Transformed URL
 */
export function applyCloudinaryTransformation(
  imageUrl: string,
  transformation: string
): string {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return imageUrl; // Return original if not Cloudinary URL
  }

  // Insert transformation after /upload/
  const uploadIndex = imageUrl.indexOf('/upload/');
  if (uploadIndex === -1) {
    return imageUrl;
  }

  const beforeUpload = imageUrl.substring(0, uploadIndex + 8); // Include /upload/
  const afterUpload = imageUrl.substring(uploadIndex + 8);

  return `${beforeUpload}${transformation}/${afterUpload}`;
}

/**
 * Get optimized image URL for feed thumbnail
 * Uses Cloudinary transformations: c_fill,w_600,h_600,q_80
 */
export function getFeedThumbnailUrl(imageUrl: string): string {
  return applyCloudinaryTransformation(imageUrl, 'c_fill,w_600,h_600,q_80');
}

/**
 * Get optimized image URL for full resolution display
 * Uses Cloudinary transformations: c_limit,w_1920,q_80
 */
export function getFullResolutionUrl(imageUrl: string): string {
  return applyCloudinaryTransformation(imageUrl, 'c_limit,w_1920,q_80');
}

/**
 * Get optimized image URL for avatar/profile pictures
 * Uses Cloudinary transformations: c_fill,w_256,h_256,q_85
 */
export function getAvatarUrl(imageUrl: string): string {
  return applyCloudinaryTransformation(imageUrl, 'c_fill,w_256,h_256,q_85');
}
