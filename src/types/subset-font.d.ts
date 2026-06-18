declare module "subset-font" {
  /**
   * Subset (and optionally instance) a font to the glyphs needed for `text`,
   * using harfbuzz. Returns the new font as a Buffer.
   */
  export default function subsetFont(
    font: Buffer | Uint8Array,
    text: string,
    options?: {
      targetFormat?: "sfnt" | "woff" | "woff2" | "truetype";
      variationAxes?: Record<string, number>;
      preserveNameIds?: number[];
      noLayoutClosure?: boolean;
    }
  ): Promise<Buffer>;
}
