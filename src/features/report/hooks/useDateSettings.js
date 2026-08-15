import { useState, useEffect } from 'react';
import { getMonthOptions } from '../../../utils/helpers';
import { CACHE_KEYS, cache } from '../../../utils/cache';

export const useDateSettings = (isAppInitialized) => {
  const [bulanOptions, setBulanOptions] = useState([]);
  const [selectedBulan, setSelectedBulan] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [tanggal, setTanggal] = useState('');
  const [completedSteps, setCompletedSteps] = useState({ bulan: false, tanggal: false });
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    const options = getMonthOptions();
    setBulanOptions(options);
    const savedFormState = cache.get(CACHE_KEYS.formState);
    if (!savedFormState?.selectedBulan) {
      setSelectedBulan(options[0].value);
      setCompletedSteps(prev => ({ ...prev, bulan: true }));
    }
  }, []);

  useEffect(() => {
    if (!isAppInitialized) return;
    const savedFormState = cache.get(CACHE_KEYS.formState);
    if (savedFormState) {
      if (savedFormState.selectedBulan) {
        setSelectedBulan(savedFormState.selectedBulan);
        setCompletedSteps(prev => ({ ...prev, bulan: true }));
      }
      if (savedFormState.tanggal) {
        setTanggal(savedFormState.tanggal);
        setCompletedSteps(prev => ({ ...prev, bulan: true, tanggal: true }));
      }
    }
  }, [isAppInitialized]);

  useEffect(() => {
    if (!isAppInitialized) return;
    cache.set(CACHE_KEYS.formState, { selectedBulan, tanggal });
  }, [selectedBulan, tanggal, isAppInitialized]);

  useEffect(() => {
    if (!selectedBulan) return;
    const mondays = [];
    const [year, month] = selectedBulan.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
      if (date.getDay() === 1) {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        mondays.push({ value: `${date.getFullYear()}-${m}-${d}`, label: `Senin, ${d}/${m}/${date.getFullYear()}` });
      }
      date.setDate(date.getDate() + 1);
    }
    setAvailableDates(mondays);

    const savedFormState = cache.get(CACHE_KEYS.formState);
    if (savedFormState?.tanggal && mondays.some(m => m.value === savedFormState.tanggal)) {
      setTanggal(savedFormState.tanggal);
      setCompletedSteps(prev => ({ ...prev, bulan: true, tanggal: true }));
    } else if (mondays.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const pastOrToday = mondays.filter(m => m.value <= todayStr);
      const autoMonday = pastOrToday.length > 0 ? pastOrToday[pastOrToday.length - 1].value : mondays[0].value;
      setTanggal(autoMonday);
      setCompletedSteps(prev => ({ ...prev, bulan: true, tanggal: true }));
    }
  }, [selectedBulan, isAppInitialized]);

  const handleBulanSelect = (val) => {
    setSelectedBulan(val);
    setOpenDropdown(null);
    setCompletedSteps(prev => ({ ...prev, bulan: true }));
    setTanggal('');
    setCompletedSteps(prev => ({ ...prev, tanggal: false }));
  };

  const handleTanggalSelect = (val) => {
    setTanggal(val);
    setOpenDropdown(null);
    setCompletedSteps(prev => ({ ...prev, tanggal: true }));
  };

  const isTanggalLocked = !completedSteps.bulan;
  const isEntriLocked = !completedSteps.tanggal;

  return {
    bulanOptions,
    selectedBulan,
    availableDates,
    tanggal,
    completedSteps,
    openDropdown,
    setOpenDropdown,
    handleBulanSelect,
    handleTanggalSelect,
    isTanggalLocked,
    isEntriLocked,
    setTanggal,
    setCompletedSteps
  };
};
