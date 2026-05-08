import { z } from "zod";
import { UserSchema } from "./user";
import { TourSchema } from "./tour";
import { PaginationSchema } from "./pagination";
export const GuideSchema = z.object({
  id: z.number().int().positive(),
  username: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  role: z.literal("guide"),
  region: z.enum(["northern", "central", "southern"]),
});

export const TicketSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  ticket_code: z.string().max(50),
  issue_date: z.string(),
  valid_from: z.string(),
  valid_until: z.string(),
  status: z.enum(["active", "used", "cancelled"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: UserSchema.pick({username: true, phone: true, email: true}),
  tour: TourSchema.pick({title: true, main_image: true, tour_code: true}),
  guide: GuideSchema.nullable(),
});

export const GetTicketsResponseSchema = z.object({
  success: z.boolean(),
    message: z.string(),
    data: z.array(TicketSchema),
    pagination: PaginationSchema,
})

export type Ticket = z.infer<typeof TicketSchema>;
export type GetTicketsResponse = z.infer<typeof GetTicketsResponseSchema>