import { z } from "zod";

// ReviewContent schema
export const ReviewContentSchema = z.object({
  type: z.string(),
  content: z.string().min(1, "Nội dung không được để trống"),
});

// Review schema
export const ReviewSchema = z.object({
  user_id: z.string(),
  username: z.string().min(1, "Tên người dùng không được để trống"),
  avatar_url: z.string().optional(),
  rating: z.number().min(0).max(5),
  created_at: z.string(),
  contents: z.array(ReviewContentSchema).min(1, "Phải có ít nhất một nội dung"),
});

export type ReviewContent = z.infer<typeof ReviewContentSchema>;
export type Review = z.infer<typeof ReviewSchema>;