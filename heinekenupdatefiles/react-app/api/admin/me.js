import { requireAdmin } from '../_lib/auth.js';

// Lightweight endpoint the SPA polls on mount to decide whether to render the
// dashboard or bounce to /admin/login (there's no server middleware in a
// Vite SPA to gate routes before render).
export default async function handler(req, res) {
  const ok = await requireAdmin(req, res);
  if (!ok) return;
  return res.status(200).json({ ok: true });
}
