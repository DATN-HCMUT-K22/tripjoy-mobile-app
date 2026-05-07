/**
 * AI Service Error Codes
 */
export const AI_ERROR_CODES = {
  SERVICE_DOWN: 9001,      // AI Service không phản hồi
  GENERATION_FAILED: 9002, // AI không thể sinh được dữ liệu phù hợp
  TIMEOUT: 9004,           // Request quá lâu (Timeout)
} as const;
