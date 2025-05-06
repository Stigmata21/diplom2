// Объявляем модуль для html-pdf-node, чтобы TypeScript его распознавал
declare module 'html-pdf-node' {
  export interface Options {
    format?: string;
    path?: string;
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    printBackground?: boolean;
    landscape?: boolean;
    scale?: number;
    displayHeaderFooter?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
    pageRanges?: string;
    preferCSSPageSize?: boolean;
  }

  export interface File {
    content?: string;
    url?: string;
    path?: string;
  }

  export function generatePdf(file: File, options?: Options): Promise<Buffer>;
  export function generatePdfs(files: File[], options?: Options): Promise<Buffer[]>;
} 