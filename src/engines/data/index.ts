import type { Converter } from "../types";
import { parseData } from "./parse";
import { serializeData } from "./serialize";

/**
 * Data files all go through one neutral value: parse into plain objects, then
 * write in the target format. That is why adding a format costs one parser
 * and one writer instead of a converter for every pair.
 */
export const convertData: Converter = async ({ file, from, to, report }) => {
  const value = await parseData(file, from);
  report(0.6);
  const result = serializeData(value, to);
  report(1);
  return result;
};
