import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from '../../../services/firebase';
import { CACHE_KEYS, cache } from '../../../utils/cache';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [penanggungJawab, setPenanggungJawab] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser) {
        setUserRole('staff');
        const defaultName = currentUser.displayName || currentUser.email.split('@')[0];
        const capitalized = defaultName.replace(/\b\w/g, l => l.toUpperCase());
        setPenanggungJawab(cache.get(CACHE_KEYS.staffName) || capitalized);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      setUserRole('staff');
      const defaultName = result.user.displayName || result.user.email.split('@')[0];
      const capitalized = defaultName.replace(/\b\w/g, l => l.toUpperCase());
      cache.set(CACHE_KEYS.staffName, capitalized);
      setPenanggungJawab(capitalized);
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        alert("Gagal Login: " + error.message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const executeLogout = async () => {
    await signOut(auth);
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
