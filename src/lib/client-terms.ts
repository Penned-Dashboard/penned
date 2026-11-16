import { readFileSync } from "fs";
import { join } from "path";

/** Lawyer-approved Client Terms of Service. */
export const CLIENT_TERMS_VERSION = "1.0";
export const CLIENT_TERMS_UPDATED = "16 November 2026";
export const CLIENT_TERMS_FILE = "src/content/penned-client-terms.txt";

export function getClientTermsPath() {
  return join(process.cwd(), CLIENT_TERMS_FILE);
}

export function readClientTermsBody() {
  return readFileSync(getClientTermsPath(), "utf8");
}
