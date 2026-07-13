// Vercel's catch-all rest-parameter naming in req.query has proven unreliable
// across versions (observed as literally "...path" instead of "path" in
// production), so segments are parsed directly from the URL instead of
// trusting req.query for the catch-all param.
export function pathSegments(req, prefix) {
  const pathname = req.url.split('?')[0];
  const rest = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : '';
  return rest.split('/').filter(Boolean).map(decodeURIComponent);
}
