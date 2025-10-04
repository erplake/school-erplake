import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { API_BASE } from '../api';

const GlobalSettingsContext = createContext({ brand: null, refreshBrand: () => {}, updating:false, updateBrand: async () => {} });

export function GlobalSettingsProvider({ children }) {
  const [brand, setBrand] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchBrand = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/brand`);
      if(!res.ok) throw new Error('Failed to load brand settings');
      const data = await res.json();
      setBrand(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { fetchBrand(); }, [fetchBrand]);

  async function updateBrand(patch){
    setUpdating(true);
    const previous = brand;
    // optimistic merge
    setBrand(prev => ({ ...prev, ...patch }));
    try {
      const res = await fetch(`${API_BASE}/settings/brand`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      if(!res.ok) throw new Error('Failed to update');
      const data = await res.json();
      setBrand(data);
    } catch (e){
      console.error(e);
      // revert
      setBrand(previous);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <GlobalSettingsContext.Provider value={{ brand, refreshBrand: fetchBrand, updating, updateBrand }}>
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export function useGlobalSettings(){
  return useContext(GlobalSettingsContext);
}
