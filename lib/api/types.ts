import type { paths } from "./schema";

/** The signed-in user, as `GET /auth/me` returns it. */
export type CurrentUser = paths["/auth/me"]["get"]["responses"][200]["content"]["application/json"];
