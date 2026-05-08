import { z } from "zod";
import { PaginationSchema } from "./pagination";

export const TourSchema = z.object({
  id: z.number(),
  tour_code: z.string(),
  title: z.string(),
  description: z.string(),
  destination: z.string(),
  departure: z.string(),
  start_date: z.string(),
  end_date: z.string(),   
  duration: z.string(),   
  price: z.string(),      
  capacity: z.number(),
  ticket_solded: z.number(),
  rating: z.string(),     
  total_reviews: z.number(),
  latitude: z.string(),
  longitude: z.string(),
  main_image: z.string(),
  is_active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
/** Category */
export const TourCategorySchema = z.object({
  id: z.number(),
  category: z.string(),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Schedule */
export const TourScheduleSchema = z.object({
  id: z.number(),
  tour_id: z.number(),
  day_number: z.number(),
  title: z.string(),
  detail: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Include / Exclude */
export const TourItemSchema = z.object({
  id: z.number(),
  tour_id: z.number(),
  item: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Gallery */
export const TourGallerySchema = z.object({
  id: z.number(),
  tour_id: z.number(),
  image_url: z.string(),
});

export const TourDetailSchema = TourSchema.extend({
  categories: z.array(TourCategorySchema),
  schedule: z.array(TourScheduleSchema).optional(),
  includes: z.array(TourItemSchema).optional(),
  excludes: z.array(TourItemSchema).optional(),
  gallery: z.array(TourGallerySchema),
});

export const GetToursResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(TourSchema),
  pagination: PaginationSchema,
});
export const GetTourDetailResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: TourDetailSchema,
});
export const GetTourCategoryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(TourCategorySchema),
})


export type Tour = z.infer<typeof TourSchema>;
export type TourCategory = z.infer<typeof TourCategorySchema>;
export type TourSchedule = z.infer<typeof TourScheduleSchema>;
export type TourItem = z.infer<typeof TourItemSchema>;
export type TourGallery = z.infer<typeof TourGallerySchema>;
export type GetToursResponse = z.infer<typeof GetToursResponseSchema>;
export type GetTourDetailResponse = z.infer<typeof GetTourDetailResponseSchema>;
export type GetTourCategoryResponse = z.infer<typeof GetTourCategoryResponseSchema>