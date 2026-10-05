import type { Converter } from "../types";
import { decodeImage } from "./decode";
import { encodeImage } from "./encode";

/** Decode once into a bitmap, encode once into the target. The bitmap is freed right away. */
export const convertImage: Converter = async ({ file, from, to, report }) => {
  report(0.1);
  const bitmap = await decodeImage(file, from);
  report(0.5);
  try {
    const blob = await encodeImage(bitmap, to);
    report(1);
    return { blob, extension: to };
  } finally {
    bitmap.close();
  }
};
