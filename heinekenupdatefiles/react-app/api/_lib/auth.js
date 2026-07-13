import { adminCookieName, staffCookieName, verifyAdminSessionToken, resolveScanAuth } from './session.js';

/**
 * Returns true and lets the caller continue, or writes a 401 response and
 * returns false. Every /api/admin/* handler (other than login) should call
 * this first, since there's no middleware layer for a Vite SPA.
 */
export async function requireAdmin(req, res) {
  const token = req.cookies?.[adminCookieName];
  const valid = await verifyAdminSessionToken(token);
  if (!valid) {
    res.status(401).json({ error: 'Not authenticated' });
    return false;
  }
  return true;
}

/**
 * Returns the scan auth context (admin or staff) if authenticated, else
 * writes a 401 response and returns null.
 */
export async function requireScanAuth(req, res) {
  const auth = await resolveScanAuth(req.cookies?.[adminCookieName], req.cookies?.[staffCookieName]);
  if (!auth) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  return auth;
}
