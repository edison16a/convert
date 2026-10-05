/**
 * Fetches the heavy image codecs ahead of time (HEIC decoder, AVIF and WebP
 * WASM) so the service worker can cache them. Without this, the first HEIC or
 * AVIF conversion after going offline would fail even though the page loads.
 * Each load is independent: one failing never stops the others.
 */
export async function warmImageCodecs(): Promise<void> {
  await Promise.allSettled([
    import("heic-to/next"),
    import("@jsquash/avif/encode").then((codec) => codec.init()),
    import("@jsquash/avif/decode").then((codec) => codec.init()),
    import("@jsquash/webp/encode").then((codec) => codec.init()),
    import("@jsquash/webp/decode").then((codec) => codec.init()),
  ]);
}
