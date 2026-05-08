import { z } from "zod";
import { PaginationSchema } from "./pagination";

export const AdminSchema = z.object({
  id: z.number().int().positive(),
  username: z.string().min(1, "Username không được để trống"),
  email: z.string().email("Email không hợp lệ"),
  is_active: z.boolean().default(true),
  role: z.enum(["super_admin", "employee", "guide"]).default("super_admin"),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const AdminLoginDataSchema = AdminSchema.omit({
  createdAt: true,
  updatedAt: true,
  is_active: true,
});
export const AdminGetAdminsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(AdminSchema),
  pagination: PaginationSchema,
});
export type Admin = z.infer<typeof AdminSchema>;
export type AdminLoginData = z.infer<typeof AdminLoginDataSchema>;
export type AdminGetAdminsResponse = z.infer<typeof AdminGetAdminsResponseSchema>
