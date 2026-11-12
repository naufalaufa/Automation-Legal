function randomSuffix(length = 5): string {
  return Math.random().toString(36).slice(2, 2 + length).toUpperCase();
}

/** Membuat nomor referensi unik untuk data test staging. */
export function uniqueReference(
  prefix: string,
  options: { random?: boolean } = {},
): string {
  const timestamp = Date.now();
  return options.random === false
    ? `${prefix}/${timestamp}`
    : `${prefix}/${timestamp}-${randomSuffix()}`;
}
