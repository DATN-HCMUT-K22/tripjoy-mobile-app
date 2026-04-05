import { httpClient } from "./http/client";
import { ApiResponse } from "@/types/user";

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
}

/**
 * Options cho upload video
 */
export interface UploadVideoOptions {
  fileUri: string;
  fileName?: string;
  fileType?: string; // MIME type (mặc định: video/mp4)
  folder?: string;
}

/**
 * Upload ảnh lên Cloudinary qua backend
 * @param options - Options cho upload
 * @returns MediaUploadResponse với secure_url và public_id
 */
export async function uploadImage(
  options: UploadImageOptions
): Promise<MediaUploadResponse> {
  const { fileUri, fileName = "image.jpg", fileType = "image/jpeg", folder } = options;

  // Tạo FormData cho React Native
  // Format cho React Native: { uri, type, name }
  const formData = new FormData();
  formData.append("file", {
    uri: fileUri,
    type: fileType,
    name: fileName,
  } as any);
  
  console.log("[uploadImage] FormData created:", {
    fileUri,
    fileName,
    fileType,
    folder,
    formDataKeys: formData._parts?.map((p: any) => p[0]) || [],
  });

  const uploadWithUrl = (url: string) =>
    httpClient.post<ApiResponse<MediaUploadResponse>>(url, formData);

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
  const { fileUri, fileName = "video.mp4", fileType = "video/mp4", folder } = options;

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
    formData
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

