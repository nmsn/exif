declare module 'fabric' {
  export interface TDataUrlOptions {
    format?: 'jpeg' | 'png' | 'webp';
    quality?: number;
    multiplier?: number;
    enableRetinaScaling?: boolean;
  }
}