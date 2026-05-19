export const extractFolderId = (url) => {
  const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

export const getMonthOptions = () => {
  const namaBulanIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const options = [];
  const d = new Date();
  for (let i = 0; i < 6; i++) {
    const m = d.getMonth();
    const y = d.getFullYear();
    options.push({ value: `${y}-${String(m + 1).padStart(2, '0')}`, label: `${namaBulanIndo[m]} ${y}` });
    d.setMonth(m - 1);
  }
  return options;
};
