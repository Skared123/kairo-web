/** Ports apart from `pnpm dev` (3000) and the API's dev server (4000), so both can keep running (decision 027). */
export const WEB_PORT = 3100;
export const API_PORT = 4100;
export const WEB_URL = `http://localhost:${WEB_PORT}`;
export const API_URL = `http://localhost:${API_PORT}`;
