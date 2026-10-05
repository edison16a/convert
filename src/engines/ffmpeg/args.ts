import type { FormatId } from "@/features/formats/types";

const AUDIO_ARGS: Partial<Record<FormatId, string[]>> = {
  mp3: ["-vn", "-c:a", "libmp3lame", "-q:a", "2"],
  wav: ["-vn", "-c:a", "pcm_s16le"],
  flac: ["-vn", "-c:a", "flac"],
  ogg: ["-vn", "-c:a", "libvorbis", "-q:a", "5"],
  m4a: ["-vn", "-c:a", "aac", "-b:a", "192k"],
};

/**
 * H.264 needs even dimensions, so the scale filter rounds both down to the
 * nearest even number. Without it, an odd sized clip fails with a cryptic error.
 */
const EVEN_SIZE = "scale=trunc(iw/2)*2:trunc(ih/2)*2";

const VIDEO_ARGS: Partial<Record<FormatId, string[]>> = {
  mp4: [
    "-vf", EVEN_SIZE,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart",
  ],
  // VP8 encodes far faster than VP9 in WASM, which matters more than size here.
  webm: ["-c:v", "libvpx", "-deadline", "realtime", "-cpu-used", "6", "-crf", "10", "-b:v", "1M", "-c:a", "libvorbis"],
  gif: [
    "-an",
    "-vf", "fps=10,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse",
    "-loop", "0",
  ],
};

/** True when the target writes only audio, so any video track must be dropped. */
export const isAudioTarget = (to: FormatId) => to in AUDIO_ARGS;

/**
 * Builds the ffmpeg command line for one conversion. Kept as plain data in,
 * plain array out so every codec choice can be unit tested without WASM.
 */
export function buildArgs(input: string, output: string, to: FormatId): string[] {
  const codec = AUDIO_ARGS[to] ?? VIDEO_ARGS[to];
  if (!codec) throw new Error(`No ffmpeg recipe for ${to}`);
  return ["-i", input, ...codec, "-y", output];
}
