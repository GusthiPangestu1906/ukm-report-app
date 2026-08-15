import { useState, useEffect, useCallback } from 'react';
import { CACHE_KEYS, cache } from '../../../utils/cache';
import { HISTORY_CACHE_TTL } from '../../../utils/constants';
import { reportApi } from '../../../services/api';

export const useReportHistory = (user) => {
  const [historyData, setHistoryData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [publicSpreadsheetUrl, setPublicSpreadsheetUrl] = useState('');
  const [submittedUkms, setSubmittedUkms] = useState([]);

  const fetchHistory = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cachedHistory = cache.get(CACHE_KEYS.historyData);
      const cachedTs = cache.get(CACHE_KEYS.historyTimestamp);
      if (cachedHistory && cachedTs && (Date.now() - cachedTs) < HISTORY_CACHE_TTL) {
        setHistoryData(cachedHistory);
        return;
      }
    }

    setIsLoadingHistory(true);
    try {
      const result = await reportApi.fetchHistory();
      if (result.status === "success") {
        setHistoryData(result.data);
        if (result.publicSpreadsheetUrl) setPublicSpreadsheetUrl(result.publicSpreadsheetUrl);
        cache.set(CACHE_KEYS.historyData, result.data);
        cache.set(CACHE_KEYS.historyTimestamp, Date.now());
      }
    } catch (error) {
      console.error("Gagal menarik data:", error);
      const cachedHistory = cache.get(CACHE_KEYS.historyData);
      if (cachedHistory) setHistoryData(cachedHistory);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user, fetchHistory]);

  const updateSubmittedUkms = useCallback((tanggal) => {
    if (tanggal && historyData.length > 0) {
      setSubmittedUkms(historyData.filter(item => item.tanggal === tanggal).map(item => item.ukm));
    } else {
      setSubmittedUkms([]);
    }
  }, [historyData]);

  return {
    historyData,
    isLoadingHistory,
    publicSpreadsheetUrl,
    submittedUkms,
    fetchHistory,
    updateSubmittedUkms
  };
};
