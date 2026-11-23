import { z } from "zod";
import type { ValidationMessages } from "./auth-schemas";

// The same limits as the API's createAccountSchema (kairo-api src/users/accounts.schemas.ts); the API still decides.
const MAX_NAME = 100;

export const ROLES = ["user", "admin"] as const;

export function createAccountSchema(m: ValidationMessages) {
  return z.object({
    name: z.string().trim().min(1, m.required).max(MAX_NAME, m.tooLong(MAX_NAME)),
    email: z.string().trim().min(1, m.required).pipe(z.email(m.email)),
    role: z.enum(ROLES),
  });
}
export type CreateAccountValues = z.infer<ReturnType<typeof createAccountSchema>>;
