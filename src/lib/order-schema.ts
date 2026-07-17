import { z } from "zod";

export const orderSchema = z.object({
  clientLabel: z
    .string()
    .trim()
    .min(2, "Client name is required.")
    .max(120, "Client name is too long."),
  title: z.string().trim().min(5, "Title must be at least 5 characters."),
  contentTypeId: z.string().uuid("Choose a valid content type."),
  targetAudience: z
    .string()
    .trim()
    .min(3, "Target audience is required.")
    .max(160, "Target audience is too long."),
  toneOfVoice: z
    .string()
    .trim()
    .min(3, "Tone of voice is required.")
    .max(120, "Tone of voice is too long."),
  targetKeywords: z
    .string()
    .trim()
    .min(3, "Add at least one target keyword."),
  dueDate: z.string().trim().min(1, "Due date is required."),
  wordCount: z.coerce
    .number()
    .int("Word count must be a whole number.")
    .min(300, "Word count must be at least 300.")
    .max(5000, "Word count is too large for MVP intake."),
  priority: z.enum(["standard", "rush", "priority"], {
    error: "Select a valid priority.",
  }),
  primaryCta: z
    .string()
    .trim()
    .min(3, "Primary CTA is required.")
    .max(160, "Primary CTA is too long."),
  referenceLinks: z
    .string()
    .trim()
    .min(3, "At least one reference link or note is required."),
  brief: z
    .string()
    .trim()
    .min(20, "Brief must be at least 20 characters.")
    .max(5000, "Brief is too long."),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

export type OrderFormState = {
  success: boolean;
  message: string;
  errors: Partial<Record<keyof OrderFormValues, string>>;
};

export const initialOrderFormState: OrderFormState = {
  success: false,
  message: "",
  errors: {},
};
