/**
 * Database Daftar Resmi UKM & Komunitas
 * Semua nama resmi menggunakan prefiks "UKM" standar.
 */

export const UKM_LIST = [
  { id: 'badminton', name: 'UKM Badminton', aliases: ['badminton', 'bulutangkis', 'bulu tangkis'], category: 'Olahraga' },
  { id: 'basket', name: 'UKM Basket', aliases: ['basket', 'basketball', 'bola basket'], category: 'Olahraga' },
  { id: 'cinemascope', name: 'UKM Cinemascope', aliases: ['cinemascope', 'cinema', 'sinemascope', 'sinema'], category: 'Seni' },
  { id: 'dirgantara', name: 'UKM Dirgantara', aliases: ['dirgantara', 'aeromodelling', 'aero'], category: 'Penalaran' },
  { id: 'etrans', name: 'UKM E-TRANS', aliases: ['e-trans', 'etrans', 'trans'], category: 'Penalaran' },
  { id: 'e2c', name: 'UKM E2C', aliases: ['e2c', 'engineering english club', 'english club'], category: 'Penalaran' },
  { id: 'ent', name: 'UKM ENT', aliases: ['ent', 'electronic news tribune', 'ent news', 'pers'], category: 'Seni' },
  { id: 'frens', name: 'UKM Frens', aliases: ['frens', 'friends'], category: 'Penalaran' },
  { id: 'futsal', name: 'UKM Futsal', aliases: ['futsal', 'sepak bola', 'bola'], category: 'Olahraga' },
  { id: 'gamespace', name: 'UKM Gamespace', aliases: ['gamespace', 'game space', 'game dev'], category: 'Penalaran' },
  { id: 'janaka', name: 'UKM Janaka', aliases: ['janaka'], category: 'Seni' },
  { id: 'karate', name: 'UKM Karate', aliases: ['karate'], category: 'Olahraga' },
  { id: 'mahetala', name: 'UKM Mahetala', aliases: ['mahetala', 'mapala', 'pecinta alam'], category: 'Penalaran' },
  { id: 'mhe', name: 'UKM MHE', aliases: ['mhe'], category: 'Penalaran' },
  { id: 'musik', name: 'UKM Musik', aliases: ['musik', 'music', 'band'], category: 'Seni' },
  { id: 'panahan', name: 'UKM Panahan', aliases: ['panahan', 'archery'], category: 'Olahraga' },
  { id: 'pencaksilat', name: 'UKM Pencak Silat', aliases: ['pencak silat', 'silat'], category: 'Olahraga' },
  { id: 'psm', name: 'UKM PSM', aliases: ['psm', 'paduan suara', 'paduan suara mahasiswa', 'choir'], category: 'Seni' },
  { id: 'roboholic', name: 'UKM Roboholic', aliases: ['roboholic', 'robot', 'robotic', 'robotika', 'robotik'], category: 'Penalaran' },
  { id: 'silat_perisai_diri', name: 'UKM Silat Perisai Diri', aliases: ['silat perisai diri', 'perisai diri', 'pd', 'ukm perisai diri'], category: 'Olahraga' },
  { id: 'silat_psht', name: 'UKM Silat PSHT', aliases: ['silat psht', 'psht', 'setia hati terate', 'ukm psht'], category: 'Olahraga' },
  { id: 'softdev', name: 'UKM Softdev', aliases: ['softdev', 'soft dev', 'software development', 'ukm softdev'], category: 'Penalaran' },
  { id: 'sre', name: 'UKM SRE PENS', aliases: ['sre pens', 'sre', 'society of renewable energy'], category: 'Penalaran' },
  { id: 'taekwondo', name: 'UKM Taekwondo', aliases: ['taekwondo', 'tae kwon do'], category: 'Olahraga' },
  { id: 'tari', name: 'UKM Tari', aliases: ['tari', 'dance', 'tari tradisional'], category: 'Seni' },
  { id: 'tekkes', name: 'UKM Tekkes', aliases: ['tekkes', 'kesehatan', 'teknik kesehatan', 'medis'], category: 'Penalaran' },
  { id: 'tenis_meja', name: 'UKM Tenis Meja', aliases: ['tenis meja', 'pingpong', 'ping pong', 'table tennis'], category: 'Olahraga' },
  { id: 'usi', name: 'UKM USI', aliases: ['usi'], category: 'Penalaran' },
  { id: 'voli', name: 'UKM Voli', aliases: ['voli', 'vooli', 'volleyball', 'bola voli'], category: 'Olahraga' },
];

/**
 * Membersihkan string input dari prefix umum seperti "UKM " atau "Komunitas "
 */
export const cleanUkmInput = (input) => {
  if (!input) return '';
  return input
    .trim()
    .replace(/^(ukm|komunitas|klub|club)\s*/i, '')
    .trim();
};

/**
 * Mencari UKM berdasarkan nama atau alias (case-insensitive & mendukung dengan/tanpa kata 'UKM')
 */
export const findUkm = (input) => {
  if (!input || typeof input !== 'string') return null;
  const rawClean = input.trim().toLowerCase();
  const strippedClean = cleanUkmInput(input).toLowerCase();

  if (!rawClean || rawClean === 'ukm') return null;

  return UKM_LIST.find((ukm) => {
    const officialLower = ukm.name.toLowerCase();
    const officialStripped = cleanUkmInput(ukm.name).toLowerCase();

    if (
      officialLower === rawClean ||
      officialStripped === strippedClean ||
      officialStripped === rawClean ||
      officialLower === `ukm ${strippedClean}`
    ) {
      return true;
    }

    if (
      ukm.aliases.some((alias) => {
        const aLow = alias.toLowerCase();
        return (
          aLow === rawClean ||
          aLow === strippedClean ||
          `ukm ${aLow}` === rawClean
        );
      })
    ) {
      return true;
    }

    return false;
  }) || null;
};

/**
 * Mengecek apakah input merupakan UKM yang valid
 */
export const isValidUkm = (input) => {
  return findUkm(input) !== null;
};

/**
 * Menormalisasi input ke nama resmi UKM (dengan prefiks 'UKM') jika valid
 */
export const normalizeUkmName = (input) => {
  const match = findUkm(input);
  return match ? match.name : input.trim();
};

/**
 * Mencari saran UKM untuk fitur autocomplete saat mengetik
 */
export const searchUkms = (query, limit = 5) => {
  if (!query || typeof query !== 'string') return [];
  const rawQ = query.trim().toLowerCase();
  const cleanQ = cleanUkmInput(query).toLowerCase();

  // Jangan tampilkan saran jika user baru mengetik "ukm" saja tanpa spesifik nama
  if (rawQ === 'ukm' || rawQ === 'ukm ') return [];

  const targetQ = cleanQ.length > 0 ? cleanQ : rawQ;

  return UKM_LIST.filter((ukm) => {
    const rawName = ukm.name.toLowerCase();
    const cleanName = cleanUkmInput(ukm.name).toLowerCase();
    return (
      rawName.includes(rawQ) ||
      cleanName.includes(targetQ) ||
      ukm.aliases.some((alias) => alias.toLowerCase().includes(targetQ))
    );
  }).slice(0, limit);
};
