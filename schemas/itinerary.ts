import { z } from 'zod';

export const createItinerarySchema = z.object({
  name: z.string()
    .min(3, 'Tên lịch trình phải có ít nhất 3 ký tự')
    .max(100, 'Tên lịch trình không quá 100 ký tự'),
  description: z.string().optional(),
  start_date: z.string()
    .refine((val: string) => !isNaN(Date.parse(val)), 'Ngày không hợp lệ'),
  end_date: z.string()
    .refine((val: string) => !isNaN(Date.parse(val)), 'Ngày không hợp lệ'),
  people_quantity: z.number()
    .int('Số người phải là số nguyên')
    .min(1, 'Ít nhất 1 người')
    .max(50, 'Tối đa 50 người'),
  budget_estimate: z.number()
    .nonnegative('Ngân sách không được âm')
    .optional(),
  destination: z.string().optional(),
  themes: z.array(z.string()).optional(),
  group_id: z.string().optional(),
}).refine(
  (data: any) => new Date(data.end_date) >= new Date(data.start_date),
  { message: 'Ngày kết thúc phải sau ngày bắt đầu', path: ['end_date'] }
);

// Matches TripItemRequest from services/itineraries.ts
export const tripItemSchema = z.object({
  location_id: z.string().min(1, 'Vui lòng chọn địa điểm'),
  start_time: z.string()
    .refine((val: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val), 'Thời gian không hợp lệ'),
  duration: z.number()
    .int('Thời lượng phải là số nguyên')
    .min(15, 'Thời lượng tối thiểu 15 phút')
    .max(1440, 'Thời lượng tối đa 24 giờ')
    .optional(),
  note: z.string().max(500, 'Ghi chú không quá 500 ký tự').optional(),
});

export const expenseSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên chi phí'),
  amount: z.number()
    .positive('Số tiền phải lớn hơn 0'),
  type: z.enum(['FOOD', 'TRANSPORT', 'ACCOMMODATION', 'ACTIVITY', 'OTHER']).optional(),
  method: z.enum(['CASH', 'CARD', 'TRANSFER', 'OTHER']).optional(),
  description: z.string().max(500, 'Mô tả không quá 500 ký tự').optional(),
});

// Type inference for TypeScript
export type CreateItineraryInput = z.infer<typeof createItinerarySchema>;
export type TripItemInput = z.infer<typeof tripItemSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
