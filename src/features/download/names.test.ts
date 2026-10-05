import { describe, expect, it } from "vitest";
import { dedupeNames } from "./names";

describe("dedupeNames", () => {
  it("adds numeric suffixes before the extension", () => {
    expect(dedupeNames(["photo.jpg", "photo.jpg", "photo.jpg"])).toEqual(["photo.jpg", "photo (1).jpg", "photo (2).jpg"]);
  });

  it("treats names that differ only by case as the same", () => {
    expect(dedupeNames(["Photo.jpg", "photo.JPG"])).toEqual(["Photo.jpg", "photo (1).JPG"]);
  });

  it("does not collide with a name that already has a suffix", () => {
    expect(dedupeNames(["a (1).txt", "a.txt", "a.txt"])).toEqual(["a (1).txt", "a.txt", "a (2).txt"]);
  });

  it("handles names without an extension", () => {
    expect(dedupeNames(["notes", "notes"])).toEqual(["notes", "notes (1)"]);
  });

  it("leaves unique names alone", () => {
    expect(dedupeNames(["a.png", "b.png"])).toEqual(["a.png", "b.png"]);
  });
});
