import { z } from "zod";

/*
 * Form schemas for the auth screens.
 *
 * The limits mirror `src/lib/contracts/auth.ts` (name 2-80, email up to 254,
 * password 8-128). They are redefined here only to attach messages written for
 * the user; the backend validates every request again with the shared contract.
 */
const email = z.email("Enter a valid email address.").max(254, "Use 254 characters or fewer.");

export const loginFormSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(128, "Use 128 characters or fewer."),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter at least 2 characters.")
      .max(80, "Use 80 characters or fewer."),
    email,
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(128, "Use 128 characters or fewer."),
    confirmPassword: z.string().min(1, "Enter your password again."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords do not match.",
  });
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
