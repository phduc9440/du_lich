import { z } from "zod";

function validateArray<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown[],
  label?: string
): z.infer<T>[] {
  return data
    .map((item, index) => {
      const result = schema.safeParse(item);
      if (!result.success) {
        console.warn(
          `[Zod Validation Error]${
            label ? ` (${label})` : ""
          } - Item at index ${index}:`,
          result.error.flatten().fieldErrors,
          "Raw item:",
          item
        );
      }
      return result;
    })
    .filter((r): r is z.ZodSafeParseSuccess<z.infer<T>> => r.success)
    .map((r) => r.data);
}

export default validateArray;