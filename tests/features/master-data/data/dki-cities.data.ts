/**
 * Data wilayah DKI yang diambil dari daftar kota master Legal.
 *
 * `slug` digunakan pada nama test/command, sedangkan `name` harus sama persis
 * dengan opsi yang terlihat di UI agar pemilihan kota tetap eksplisit.
 */
export const dkiCities = [
  {
    id: 3101,
    slug: 'KEPULAUAN-SERIBU',
    shortCode: 'KEPSER',
    name: 'Kab. Kepulauan Seribu',
  },
  {
    id: 3171,
    slug: 'JAKARTA-SELATAN',
    shortCode: 'JAKSEL',
    name: 'Kota Jakarta Selatan',
  },
  {
    id: 3172,
    slug: 'JAKARTA-TIMUR',
    shortCode: 'JAKTIM',
    name: 'Kota Jakarta Timur',
  },
  {
    id: 3173,
    slug: 'JAKARTA-PUSAT',
    shortCode: 'JAKPUS',
    name: 'Kota Jakarta Pusat',
  },
  {
    id: 3174,
    slug: 'JAKARTA-BARAT',
    shortCode: 'JAKBAR',
    name: 'Kota Jakarta Barat',
  },
  {
    id: 3175,
    slug: 'JAKARTA-UTARA',
    shortCode: 'JAKUT',
    name: 'Kota Jakarta Utara',
  },
] as const;

export type DkiCity = (typeof dkiCities)[number];

