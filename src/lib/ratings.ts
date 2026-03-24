import { z } from "zod";

const ratingSchema = z
  .union([
    z.number().min(1).max(10),
    z.string().trim().length(0),
    z.null(),
    z.undefined(),
  ])
  .transform((value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const numericValue = typeof value === "number" ? value : Number(value);

    if (Number.isNaN(numericValue)) {
      throw new Error("Invalid rating");
    }

    const rounded = Math.round(numericValue * 10) / 10;

    if (rounded < 1 || rounded > 10) {
      throw new Error("Rating must be between 1.0 and 10.0");
    }

    return rounded;
  });

export function parseNullableRating(value: unknown) {
  return ratingSchema.parse(value);
}

export function decimalToNumber(value?: number | null) {
  return typeof value === "number" ? value : null;
}
