/** Membaca environment variable wajib tanpa menyebarkan secret ke test. */
export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Environment variable ${name} belum diisi di file .env.`);
  }

  return value;
}

/** Feature flag mutating hanya aktif ketika nilainya persis `true`. */
export function featureEnabled(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === 'true';
}

/** Mengambil konfigurasi opsional dengan fallback yang eksplisit. */
export function optionalEnv(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}
