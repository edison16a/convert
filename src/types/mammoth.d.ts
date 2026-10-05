/** mammoth ships types for its Node entry only. The browser bundle has the same API. */
declare module "mammoth/mammoth.browser" {
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<{
    value: string;
    messages: { type: string; message: string }[];
  }>;
}
