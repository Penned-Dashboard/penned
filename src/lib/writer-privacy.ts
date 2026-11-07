export function firstNameOnly(fullName: string | null | undefined) {
  const value = (fullName ?? "").trim();
  if (!value || /^unassigned|pending|marketplace/i.test(value)) return "Writer";
  return value.split(/\s+/)[0] || "Writer";
}

export function redactContactDetails(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[Contact details hidden]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[Contact details hidden]")
    .replace(
      /https?:\/\/(www\.)?(linkedin|twitter|x|instagram|facebook|whatsapp|telegram)\.[^\s)]+/gi,
      "[Contact details hidden]",
    );
}
