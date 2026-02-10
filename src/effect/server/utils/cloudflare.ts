export function isCloudflare() {
  return /Cloudflare/i.test(navigator.userAgent);
}
