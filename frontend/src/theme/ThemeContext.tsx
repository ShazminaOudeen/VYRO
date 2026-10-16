import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { vyroDark, vyroLight, type Mode } from './themes';
import { Ctx } from './context';

function initialMode(): Mode {
  try {
    const saved = localStorage.getItem('vyro-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage unavailable, use default */
  }
  return 'dark'; // VYRO default
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(initialMode);

  useEffect(() => {
    try {
      localStorage.setItem('vyro-theme', mode);
    } catch {
      /* ignore */
    }
    const cfg = mode === 'dark' ? vyroDark : vyroLight;
    document.body.style.background =
      (cfg.token?.colorBgLayout as string) ?? (cfg.token?.colorBgBase as string);
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const value = useMemo(
    () => ({ mode, toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')) }),
    [mode]
  );

  return (
    <Ctx.Provider value={value}>
      <ConfigProvider theme={mode === 'dark' ? vyroDark : vyroLight}>{children}</ConfigProvider>
    </Ctx.Provider>
  );
}
