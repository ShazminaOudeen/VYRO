import { theme, type ThemeConfig } from 'antd';

export type Mode = 'dark' | 'light';

const font =
  "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export const vyroDark: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#d4f76a',
    colorTextLightSolid: '#10201a', // text on lime buttons
    colorBgBase: '#10201a',
    colorBgContainer: '#1a2f26',
    colorBgElevated: '#243a30',
    colorBorder: '#2f4a3d',
    borderRadius: 10,
    fontFamily: font,
  },
};

export const vyroLight: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#2f7d32',
    colorBgBase: '#ffffff',
    colorBgLayout: '#f3f7f1',
    colorBgContainer: '#ffffff',
    borderRadius: 10,
    fontFamily: font,
  },
};