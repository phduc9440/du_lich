import type { z } from "zod";

function validateObject<T extends z.ZodTypeAny>(schema: T, data: unknown, label?: string): z.infer<T> | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn(
      `[Zod Validation Error]${label ? ` (${label})` : ""}:`,
      result.error.flatten().fieldErrors
    );
    return null;
  }
  return result.data;
}
export default validateObject;