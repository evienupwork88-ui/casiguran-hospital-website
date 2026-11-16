const FACEBOOK_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "web.facebook.com",
  "fb.watch",
]);

export function isFacebookPortraitVideo(postUrl: string): boolean {
  try {
    const url = new URL(postUrl);
    return /\/(reel|reels|share\/r)(?:\/|$)/i.test(url.pathname);
  } catch {
    return false;
  }
}

export function getFacebookEmbedUrl(postUrl: string | null | undefined): string | null {
  if (!postUrl) return null;

  let url: URL;
  try {
    url = new URL(postUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || !FACEBOOK_HOSTS.has(url.hostname.toLowerCase())) return null;

  const isVideo = url.hostname.toLowerCase() === "fb.watch"
    || /\/(videos?|watch|reel|reels|share\/[vr])(?:\/|$)/i.test(url.pathname)
    || url.searchParams.has("v");
  if (!isVideo) return null;

  const params = new URLSearchParams({
    href: url.toString(),
    show_text: "false",
    width: "500",
  });

  return `https://www.facebook.com/plugins/video.php?${params.toString()}`;
}
