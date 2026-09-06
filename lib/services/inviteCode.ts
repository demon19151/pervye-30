/** Буквы и цифры без 0/O/1/I — код легче продиктовать. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Код комнаты вида P30K7M2 — тот же формат, что демо P30WORK. */
export function generateInviteCode(): string {
  const suffix = Array.from({ length: 4 }, () => {
    const index = Math.floor(Math.random() * ALPHABET.length);
    return ALPHABET[index];
  }).join("");

  return `P30${suffix}`;
}

export function normalizeInviteCode(code: string): string {
  return code.replace(/\s+/g, "").trim().toUpperCase();
}
