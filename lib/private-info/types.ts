/**
 * Contrato entre la ruta /private-info/[file] y el lugar donde viven los PDFs.
 * Producción usa Supabase (supabase-source.ts); los tests usan una fuente en memoria.
 */

/** Versión publicada de un documento, tal como la necesita la ruta para responder. */
export type PublishedPdf = {
  /** Nombre exacto del archivo (case-sensitive). Es lo que está impreso en el QR. */
  fileName: string;
  /** Id de la versión publicada: cambia en cada publicación. */
  versionId: string;
  /** SHA-256 en hex del PDF de esa versión. Se usa como ETag. */
  sha256: string;
  /** Tamaño en bytes. */
  size: number;
  /** Descarga el contenido del PDF de esa versión. */
  read: () => Promise<Uint8Array>;
};

export interface PdfSource {
  /**
   * Devuelve la versión publicada del documento con ese file_name exacto,
   * o null si no existe o todavía no tiene versión publicada.
   * Debe lanzar un error si la fuente no responde (la ruta devuelve 503, no 404).
   */
  getPublished(fileName: string): Promise<PublishedPdf | null>;
}
