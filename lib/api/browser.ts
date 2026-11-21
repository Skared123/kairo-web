import createClient from "openapi-fetch";
import type { paths } from "./schema";

/**
 * The API client for Client Components. It calls /api on this origin, which next.config.ts rewrites to the API, so
 * the browser sends the session cookie itself (decision 018).
 */
export const browserApi = createClient<paths>({ baseUrl: "/api", credentials: "same-origin" });
