import { z } from "zod";

export const orderSchema = z.object({
  clientLabel: z
    .string()
    .trim()
    .max(120, "Client name is too long.")
    .default(""),
  clientFolderId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(5, "Title must be at least 5 characters."),
  contentTypeId: z.string().uuid("Choose a valid content type."),
  serviceTier: z.enum(["on-demand", "rank"], {
    error: "Select a valid tier.",
  }),
  language: z.string().trim().min(2, "Language is required."),
  targetAudience: z.string().trim().max(160, "Target audience is too long."),
  toneOfVoice: z.string().trim().max(120, "Tone of voice is too long."),
  targetKeywords: z.string().trim(),
  dueDate: z.string().trim(),
  wordCount: z.coerce
    .number()
    .int("Word count must be a whole number.")
    .min(300, "Word count must be at least 300.")
    .max(10000, "Word count is too large for MVP intake."),
  priority: z.enum(["standard", "rush", "priority"], {
    error: "Select a valid priority.",
  }),
  primaryCta: z.string().trim().max(160, "Primary CTA is too long."),
  referenceLinks: z.string().trim(),
  brief: z
    .string()
    .trim()
    .max(5000, "Brief is too long.")
    .default(""),
  serviceFields: z.record(z.string(), z.string()).default({}),
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
