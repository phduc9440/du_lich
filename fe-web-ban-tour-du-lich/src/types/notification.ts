import { z } from "zod";

export const NotificationTypeEnum = z.enum([
  "order",
  "ticket",
  "review",
  "support",
  "system",
  "promotion",
]);

export const AppNotificationSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  admin_id: z.number().int().positive(),
  title: z.string().max(255),
  message: z.string(),
  type: NotificationTypeEnum,
  is_read: z.boolean().optional().default(false),
  created_at: z.string(),
});

export const GetNotificationsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    notifications: z.array(AppNotificationSchema),
    unreadCount: z.number().default(0)
  })
})

export type AppNotification = z.infer<typeof AppNotificationSchema>;
export type GetNotificationsResponse = z.infer<typeof GetNotificationsResponseSchema>

