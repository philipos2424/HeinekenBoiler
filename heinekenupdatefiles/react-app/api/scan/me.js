import { requireScanAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  const auth = await requireScanAuth(req, res);
  if (!auth) return;
  return res.status(200).json({ ok: true, kind: auth.kind });
}
