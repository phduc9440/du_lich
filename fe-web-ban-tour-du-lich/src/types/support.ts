import { z } from "zod";

export const SupportSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  title: z.string().max(255).optional().nullable(),
  message: z.string().optional().nullable(),
  type_error: z.enum(["system"]),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).default("open"),
  created_at: z.string(),
});

export type Support = z.infer<typeof SupportSchema>;
