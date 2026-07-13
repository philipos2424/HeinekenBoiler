const isProd = process.env.NODE_ENV === 'production';

function serialize(name, value, { maxAge, expires } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push('Path=/');
  parts.push('HttpOnly');
  parts.push('SameSite=Lax');
  if (isProd) parts.push('Secure');
  if (typeof maxAge === 'number') parts.push(`Max-Age=${maxAge}`);
  if (expires) parts.push(`Expires=${expires.toUTCString()}`);
  return parts.join('; ');
}

export function setCookie(res, name, value, maxAgeSeconds) {
  const cookie = serialize(name, value, { maxAge: maxAgeSeconds });
  appendSetCookie(res, cookie);
}

export function clearCookie(res, name) {
  const cookie = serialize(name, '', { maxAge: 0, expires: new Date(0) });
  appendSetCookie(res, cookie);
}

function appendSetCookie(res, cookie) {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', cookie);
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookie]);
  } else {
    res.setHeader('Set-Cookie', [existing, cookie]);
  }
}
