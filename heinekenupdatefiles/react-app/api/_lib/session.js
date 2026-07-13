import { SignJWT, jwtVerify } from 'jose';

export const adminCookieName = 'admin_session';
export const staffCookieName = 'staff_session';
export const adminMaxAgeSeconds = 60 * 60 * 12; // 12 hours
export const staffMaxAgeSeconds = 60 * 60 * 12; // 12 hours

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken() {
  return new SignJWT({ type: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${adminMaxAgeSeconds}s`)
    .sign(getSecretKey());
}

export async function verifyAdminSessionToken(token) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.type === 'admin';
  } catch {
    return false;
  }
}

export async function createStaffSessionToken(staffUserId) {
  return new SignJWT({ staffUserId, type: 'staff' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${staffMaxAgeSeconds}s`)
    .sign(getSecretKey());
}

export async function verifyStaffSessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.type !== 'staff' || typeof payload.staffUserId !== 'string') return null;
    return { staffUserId: payload.staffUserId };
  } catch {
    return null;
  }
}

/**
 * The one place that decides whether a request may use the /scan check-in
 * flow: a valid admin session or a valid staff session, either is enough.
 */
export async function resolveScanAuth(adminToken, staffToken) {
  if (adminToken && (await verifyAdminSessionToken(adminToken))) {
    return { kind: 'admin' };
  }
  if (staffToken) {
    const staff = await verifyStaffSessionToken(staffToken);
    if (staff) return { kind: 'staff', staffUserId: staff.staffUserId };
  }
  return null;
}
