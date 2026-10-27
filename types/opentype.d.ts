// opentype.js 2.x ships no type declarations; we use only parse().
declare module "opentype.js" {
  export function parse(buffer: ArrayBuffer): unknown;
}
