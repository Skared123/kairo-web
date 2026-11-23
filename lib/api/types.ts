import type { paths } from "./schema";

/** The signed-in user, as `GET /auth/me` returns it. */
export type CurrentUser = paths["/auth/me"]["get"]["responses"][200]["content"]["application/json"];

/** An account as the admin sees it, as `GET /admin/users` returns it. */
export type Account = paths["/admin/users"]["get"]["responses"][200]["content"]["application/json"][number];
