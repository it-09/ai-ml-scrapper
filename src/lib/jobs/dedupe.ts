import { createHash } from "node:crypto";

function normalizeForHash(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 +#.]/g, "");
}

export function computeHash(
  company: string,
  title: string,
  location: string,
): string {
  const fingerprint = [company, title, location]
    .map(normalizeForHash)
    .join("|");
  return createHash("sha256").update(fingerprint).digest("hex");
}
