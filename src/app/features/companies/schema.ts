import { z } from "zod/v4";

export const registerCompanySchema = z
  .object({
    companyName: z.string().trim().min(1, "Company name is required.").max(200, "Company name must be 200 characters or fewer."),
    email: z.string().trim().email("A valid email is required."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
    phone: z.string().trim().optional().or(z.literal("")),
    plan: z.enum(["Basic", "Premium", "Enterprise"]),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

export type RegisterCompanyFormInput = z.input<typeof registerCompanySchema>;
export type RegisterCompanyFormOutput = z.output<typeof registerCompanySchema>;
