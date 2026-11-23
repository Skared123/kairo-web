import { z } from "zod";

/** Translates validation messages; built from next-intl's "Validation" namespace in each form. */
export type ValidationMessages = {
  required: string;
  email: string;
  tooLong: (max: number) => string;
  passwordsDontMatch: string;
  samePassword: string;
};

// The same limits as the API's schemas (kairo-api src/auth/auth.schemas.ts); the API still decides (decision 024).
const MAX_PASSWORD = 128;
const MAX_NAME = 100;

function email(m: ValidationMessages) {
  return z.string().trim().min(1, m.required).pipe(z.email(m.email));
}

function password(m: ValidationMessages) {
  return z.string().min(1, m.required).max(MAX_PASSWORD, m.tooLong(MAX_PASSWORD));
}

export function signInSchema(m: ValidationMessages) {
  return z.object({ email: email(m), password: password(m) });
}
export type SignInValues = z.infer<ReturnType<typeof signInSchema>>;

export function setupSchema(m: ValidationMessages) {
  return z.object({
    name: z.string().trim().min(1, m.required).max(MAX_NAME, m.tooLong(MAX_NAME)),
    email: email(m),
    password: password(m),
  });
}
export type SetupValues = z.infer<ReturnType<typeof setupSchema>>;

/** The API checks the current password and that the new one differs (POST /auth/password); the confirmation is UI only. */
export function changePasswordSchema(m: ValidationMessages) {
  return z
    .object({ currentPassword: password(m), newPassword: password(m), confirmPassword: z.string().min(1, m.required) })
    .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: m.passwordsDontMatch })
    .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: m.samePassword });
}
export type ChangePasswordValues = z.infer<ReturnType<typeof changePasswordSchema>>;
