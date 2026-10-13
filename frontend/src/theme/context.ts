import { createContext, useContext } from 'react';
import type { Mode } from './themes';

export interface ThemeCtx {
  mode: Mode;
  toggle: () => void;
}

export const Ctx = createContext<ThemeCtx>({ mode: 'dark', toggle: () => {} });
export const useThemeMode = () => useContext(Ctx);