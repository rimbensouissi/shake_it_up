import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../utils/storage';

const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  ready: false,
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    loadSettings().then((saved) => {
      if (!alive) return;
      setSettings(saved);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Persist every change once the stored values have been loaded.
  useEffect(() => {
    if (ready) saveSettings(settings);
  }, [settings, ready]);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo(() => ({ settings, updateSettings, ready }), [settings, updateSettings, ready]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
