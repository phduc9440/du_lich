import { z } from "zod";
import { PaginationSchema } from "./pagination";

//User schema
export const UserSchema = z.object({
  id: z.number().int().positive(),
  username: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  avatar_url: z.string().nullable(),
  google_id: z.string().nullable(),
  gender: z.enum(['male', 'female', 'other']).default('other'),
  is_active: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export const LoginDataSchema = UserSchema.omit({ gender: true, createdAt: true, updatedAt: true, google_id: true, is_active: true }).extend({role: z.string().default('user')})
export const GetUserProfileResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: UserSchema
})
export const AdminGetUsersResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(UserSchema),
  pagination: PaginationSchema
})

export type User = z.infer<typeof UserSchema>;
export type LoginData = z.infer<typeof LoginDataSchema>;
export type GetUserProfileResponse = z.infer<typeof GetUserProfileResponseSchema>
export type AdminGetUsersResponse = z.infer<typeof AdminGetUsersResponseSchema>

