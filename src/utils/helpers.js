export const extractFolderId = (url) => {
  const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

export const base64ToFile = (base64, filename) => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
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

export const getQuickMondayPresets = () => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
  
  const mondayThisWeek = new Date(now);
  mondayThisWeek.setDate(now.getDate() - daysSinceMonday);
  
  const mondayLastWeek = new Date(mondayThisWeek);
  mondayLastWeek.setDate(mondayThisWeek.getDate() - 7);

  const formatDateVal = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatDateLabel = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${m}`;
  };

  return {
    seninIni: {
      value: formatDateVal(mondayThisWeek),
      monthVal: `${mondayThisWeek.getFullYear()}-${String(mondayThisWeek.getMonth() + 1).padStart(2, '0')}`,
      label: `Senin Ini (${formatDateLabel(mondayThisWeek)})`,
      fullLabel: `Senin, ${formatDateLabel(mondayThisWeek)}/${mondayThisWeek.getFullYear()}`
    },
    seninLalu: {
      value: formatDateVal(mondayLastWeek),
      monthVal: `${mondayLastWeek.getFullYear()}-${String(mondayLastWeek.getMonth() + 1).padStart(2, '0')}`,
      label: `Senin Lalu (${formatDateLabel(mondayLastWeek)})`,
      fullLabel: `Senin, ${formatDateLabel(mondayLastWeek)}/${mondayLastWeek.getFullYear()}`
    }
  };
};

