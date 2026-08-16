import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from '../../../services/firebase';
import { CACHE_KEYS, cache } from '../../../utils/cache';

const DEFINED_CREDENTIALS = {
  email: (import.meta.env.VITE_AUTH_EMAIL || '').trim().toLowerCase(),
  password: (import.meta.env.VITE_AUTH_PASSWORD || '').trim(),
  name: 'Medfo LMB'
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [penanggungJawab, setPenanggungJawab] = useState('');

  useEffect(() => {
    // Check saved session in cache first
    const savedUser = cache.get(CACHE_KEYS.userRole);
    const savedName = cache.get(CACHE_KEYS.staffName) || '';

    if (savedUser === 'staff') {
      setUser({ email: DEFINED_CREDENTIALS.email, displayName: savedName });
      setUserRole('staff');
      setPenanggungJawab(savedName);
      setIsAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (currentUser.email?.toLowerCase() === DEFINED_CREDENTIALS.email.toLowerCase()) {
          setUser(currentUser);
          setUserRole('staff');
          const savedStaffName = cache.get(CACHE_KEYS.staffName) || '';
          cache.set(CACHE_KEYS.userRole, 'staff');
          setPenanggungJawab(savedStaffName);
        } else {
          await signOut(auth);
          setUser(null);
          setUserRole(null);
        }
      } else {
        if (!cache.get(CACHE_KEYS.userRole)) {
          setUser(null);
          setUserRole(null);
        }
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (emailInput, passwordInput) => {
    setIsGoogleLoading(true);
    try {
      const cleanEmail = (emailInput || '').trim().toLowerCase();
      const cleanPassword = (passwordInput || '').trim();

      if (cleanEmail === DEFINED_CREDENTIALS.email.toLowerCase() && cleanPassword === DEFINED_CREDENTIALS.password) {
        const savedStaffName = cache.get(CACHE_KEYS.staffName) || '';
        const authUser = { email: DEFINED_CREDENTIALS.email, displayName: savedStaffName };
        setUser(authUser);
        setUserRole('staff');
        cache.set(CACHE_KEYS.userRole, 'staff');
        setPenanggungJawab(savedStaffName);
        return { success: true };
      } else {
        return { success: false, message: 'Email atau Password yang Anda masukkan salah!' };
      }
    } catch (error) {
      return { success: false, message: 'Terjadi kesalahan saat login: ' + error.message };
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const executeLogout = async () => {
    try { await signOut(auth); } catch (e) { /* ignore */ }
    setUser(null);
    cache.remove(CACHE_KEYS.userRole);
    cache.remove(CACHE_KEYS.staffName);
    cache.remove(CACHE_KEYS.formState);
    setUserRole(null);
    setPenanggungJawab('');
  };

  const handlePenanggungChange = (value) => {
    setPenanggungJawab(value);
    try { cache.set(CACHE_KEYS.staffName, value); } catch (e) { /* ignore */ }
  };

  return {
    user,
    isAuthLoading,
    userRole,
    isGoogleLoading,
    penanggungJawab,
    handleLogin,
    executeLogout,
    handlePenanggungChange
  };
};
