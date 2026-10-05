import type { Fixture } from "./fixtures";

/**
 * Builds a longer 16 bit stereo WAV, big enough that encoding it takes a few
 * seconds. That gives a real progress bar to look at in screenshots.
 */
export function bigWav(name: string, seconds = 90): Fixture {
  const rate = 44100;
  const frames = rate * seconds;
  const data = Buffer.alloc(frames * 4);
  for (let i = 0; i < frames; i++) {
    const sample = Math.round(9000 * Math.sin((2 * Math.PI * 220 * i) / rate) + 4000 * Math.sin((2 * Math.PI * 330 * i) / rate));
    data.writeInt16LE(sample, i * 4);
    data.writeInt16LE(sample, i * 4 + 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return { name, mimeType: "audio/wav", buffer: Buffer.concat([header, data]) };
}
