/**
 * pdf-parse 모듈에 대한 TypeScript 선언 파일
 * 
 * pdf-parse는 공식 타입 정의가 없으므로 기본 선언을 제공합니다.
 */
declare module 'pdf-parse' {
  interface PDFInfo {
    [key: string]: any;
  }

  interface PDFMetadata {
    [key: string]: any;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: PDFMetadata | null;
    text: string;
    version: string;
  }

  interface PDFParseOptions {
    pagerender?: (pageData: any) => string;
    max?: number;
    version?: string;
  }

  function PDFParser(
    dataBuffer: Buffer,
    options?: PDFParseOptions
  ): Promise<PDFData>;

  export = PDFParser;
}











