import { describe, expect, it } from "vitest";
import { buildArgs, isAudioTarget } from "./args";

describe("ffmpeg recipes", () => {
  it("puts the input first and the output last", () => {
    const args = buildArgs("/in/a.wav", "out.mp3", "mp3");
    expect(args.slice(0, 2)).toEqual(["-i", "/in/a.wav"]);
    expect(args.at(-1)).toBe("out.mp3");
    expect(args).toContain("libmp3lame");
  });

  it("drops video when extracting audio", () => {
    expect(buildArgs("in.mov", "o.mp3", "mp3")).toContain("-vn");
    expect(isAudioTarget("mp3")).toBe(true);
    expect(isAudioTarget("mp4")).toBe(false);
  });

  it("forces even dimensions for H.264", () => {
    const args = buildArgs("in.mov", "o.mp4", "mp4");
    expect(args.join(" ")).toContain("trunc(iw/2)*2");
    expect(args).toContain("yuv420p");
  });

  it("builds a palette for GIFs and removes audio", () => {
    const args = buildArgs("in.mp4", "o.gif", "gif");
    expect(args).toContain("-an");
    expect(args.join(" ")).toContain("palettegen");
  });

  it("refuses targets it has no recipe for", () => {
    expect(() => buildArgs("a", "b", "png")).toThrow(/No ffmpeg recipe/);
  });
});
