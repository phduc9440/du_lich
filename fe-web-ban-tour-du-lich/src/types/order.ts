import { z } from "zod";
import { TourSchema } from "./tour";
import { UserSchema } from "./user";
import { PaginationSchema } from "./pagination";

export const OrderSchema = z.object({
  id: z.number().int().positive(),
  order_code: z.string(),
  user_id: z.number().int().positive(),
  tour_id: z.number().int().positive(),
  quantity: z.number().int().min(1),
  total_price: z.number(),
  status: z
    .enum(["pending", "confirmed", "cancelled", "completed"])
    .default("pending"),
  start_date: z.string(),
  end_date: z.string(),
  payment_url: z.string(),
  is_paid: z.boolean(),
  is_review: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  tour: TourSchema.pick({ tour_code: true, main_image: true, title: true }),
  user: UserSchema.pick({ id: true, username: true, email: true }),
});

export const GetOrdersResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(OrderSchema),
  pagination: PaginationSchema,
});

export type Order = z.infer<typeof OrderSchema>;
export type GetOrdersResponse = z.infer<typeof GetOrdersResponseSchema>
