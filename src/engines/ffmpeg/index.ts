import type { Converter } from "../types";
import { ConversionError } from "../errors";
import { buildArgs } from "./args";
import { loadFfmpeg } from "./core";

/** Maps ffmpeg's last log lines to a calm explanation of what went wrong. */
function explain(log: string): ConversionError {
  if (/Invalid data found|moov atom not found|could not find codec parameters/i.test(log)) {
    return new ConversionError("This file could not be read. It may be damaged.", "corrupt");
  }
  if (/does not contain any stream|Output file does not contain/i.test(log)) {
    return new ConversionError("This file has no audio track to convert.", "unsupported");
  }
  if (/memory|alloc/i.test(log)) {
    return new ConversionError("This file is too large for your browser's memory.", "memory");
  }
  return new ConversionError("The converter could not process this file.", "unknown");
}

/**
 * Runs one audio or video conversion. The input is mounted straight from the
 * File with WORKERFS, so a multi-gigabyte video is read on demand instead of
 * being copied into memory first.
 */
export const convertMedia: Converter = async ({ file, from, to, report, phase }) => {
  phase("preparing");
  const ffmpeg = await loadFfmpeg();
  phase("converting");

  const id = crypto.randomUUID().slice(0, 8);
  const dir = `/in-${id}`;
  const input = `${dir}/input.${from}`;
  const output = `out-${id}.${to}`;
  const tail: string[] = [];

  const onLog = ({ message }: { message: string }) => {
    tail.push(message);
    if (tail.length > 12) tail.shift();
  };
  const onProgress = ({ progress }: { progress: number }) => report(Math.min(0.99, Math.max(0, progress)));
  ffmpeg.on("log", onLog);
  ffmpeg.on("progress", onProgress);

  try {
    await ffmpeg.createDir(dir);
    await ffmpeg.mount("WORKERFS" as never, { files: [new File([file], `input.${from}`)] }, dir);
    const code = await ffmpeg.exec(buildArgs(input, output, to));
    if (code !== 0) throw explain(tail.join("\n"));
    const data = (await ffmpeg.readFile(output)) as Uint8Array;
    report(1);
    return { blob: new Blob([data as BlobPart], { type: "application/octet-stream" }), extension: to };
  } finally {
    ffmpeg.off("log", onLog);
    ffmpeg.off("progress", onProgress);
    await ffmpeg.deleteFile(output).catch(() => {});
    await ffmpeg.unmount(dir).catch(() => {});
    await ffmpeg.deleteDir(dir).catch(() => {});
  }
};
