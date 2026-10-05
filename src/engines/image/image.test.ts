import { describe, expect, it } from "vitest";
import { encodeBmp } from "./bmp";
import { ICO_MAX_SIZE, fitForIco, wrapPngAsIco } from "./ico";

describe("bmp encoder", () => {
  it("writes a header, pads rows to 4 bytes and flips rows bottom to top", () => {
    // 1 pixel wide, 2 tall: top is red, bottom is blue.
    const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]);
    const bmp = encodeBmp(1, 2, rgba);
    const view = new DataView(bmp.buffer);

    expect(String.fromCharCode(bmp[0], bmp[1])).toBe("BM");
    expect(view.getInt32(18, true)).toBe(1);
    expect(view.getInt32(22, true)).toBe(2);
    expect(view.getUint32(2, true)).toBe(bmp.length);
    expect(bmp.length).toBe(54 + 4 * 2); // 3 bytes padded to 4, two rows
    // First stored row is the bottom pixel (blue), written as B, G, R.
    expect([...bmp.slice(54, 57)]).toEqual([255, 0, 0]);
    expect([...bmp.slice(58, 61)]).toEqual([0, 0, 255]);
  });
});

describe("ico wrapper", () => {
  it("puts the PNG right after a 22 byte header", () => {
    const png = new Uint8Array([1, 2, 3, 4]);
    const ico = wrapPngAsIco(png, 32, 16);
    const view = new DataView(ico.buffer);
    expect(view.getUint16(2, true)).toBe(1);
    expect(view.getUint16(4, true)).toBe(1);
    expect(ico[6]).toBe(32);
    expect(ico[7]).toBe(16);
    expect(view.getUint32(14, true)).toBe(4);
    expect(view.getUint32(18, true)).toBe(22);
    expect([...ico.slice(22)]).toEqual([1, 2, 3, 4]);
  });

  it("stores 256 as zero", () => {
    const ico = wrapPngAsIco(new Uint8Array(1), ICO_MAX_SIZE, ICO_MAX_SIZE);
    expect(ico[6]).toBe(0);
    expect(ico[7]).toBe(0);
  });

  it("scales large images down and leaves small ones alone", () => {
    expect(fitForIco(1024, 512)).toEqual({ width: 256, height: 128 });
    expect(fitForIco(64, 48)).toEqual({ width: 64, height: 48 });
  });
});
