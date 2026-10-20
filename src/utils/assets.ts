/**
 * Campaign Amplify - Asset & Image URI Utilities
 *
 * Enforces image persistence policy:
 * - Durable remote URLs (http://, https://) can be persisted to backend PostgreSQL.
 * - Device-local URIs (file://, content://, blob://, ph://) are local working copies
 *   and must NOT be persisted to the server as durable URLs until a dedicated
 *   cloud upload storage pipeline is established.
 */

export function isRemoteAssetUrl(uri?: string | null): boolean {
  if (!uri || typeof uri !== 'string') return false;
  return uri.startsWith('http://') || uri.startsWith('https://');
}

export function isLocalAssetUri(uri?: string | null): boolean {
  if (!uri || typeof uri !== 'string') return false;
  return (
    uri.startsWith('file:') ||
    uri.startsWith('content:') ||
    uri.startsWith('blob:') ||
    uri.startsWith('ph:') ||
    uri.startsWith('data:')
  );
}

/**
 * Sanitizes an image URI for server transmission.
 * Returns the remote URL if valid, or undefined if the URI is device-local or empty.
 */
export function sanitizeRemoteImageUrl(uri?: string | null): string | undefined {
  if (!uri) return undefined;
  return isRemoteAssetUrl(uri) ? uri : undefined;
}
