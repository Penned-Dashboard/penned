/** Lawyer-supplied Writer and Editor Terms of Service. */
export const WRITER_EDITOR_TERMS_VERSION = "1.0";
export const WRITER_EDITOR_TERMS_UPDATED = "16 November 2026";
export const WRITER_EDITOR_TERMS_FILE = "src/content/penned-writer-editor-terms.txt";

export function getWriterEditorTermsPath() {
  return `${process.cwd()}/${WRITER_EDITOR_TERMS_FILE}`;
}
