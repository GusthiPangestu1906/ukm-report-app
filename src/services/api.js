export const SCRIPT_URL = (import.meta.env.VITE_API_URL || '').trim();

export const reportApi = {
  fetchHistory: async () => {
    const response = await fetch(SCRIPT_URL);
    if (!response.ok) throw new Error("Gagal mengambil data riwayat");
    return response.json();
  },

  submitReport: async (payload) => {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    if (!response.ok) throw new Error("Gagal mengirim laporan");
    return response.json();
  }
};
