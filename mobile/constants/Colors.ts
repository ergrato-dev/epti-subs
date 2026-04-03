export const Colors = {
  // Backgrounds
  bg: '#0A1628',
  bgCard: '#152238',
  bgCardAlt: '#1A2B42',

  // Accent
  accent: '#06B6D4',
  accentDark: '#0891B2',
  accentLight: '#67E8F9',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#475569',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',

  // Subscription card palette (colores rotativos para tarjetas)
  cardColors: [
    '#1E3A5F', // azul marino profundo
    '#0F4C5C', // teal oscuro
    '#1A3A2A', // verde oscuro
    '#2D1B69', // índigo
    '#3D1A1A', // rojo oscuro
    '#1A2D3D', // azul grisáceo
  ],

  // UI
  border: '#1E3A5F',
  inputBg: '#152238',
  tabBar: '#0D1F35',
  overlay: 'rgba(10,22,40,0.85)',
} as const;

export type ColorKey = keyof typeof Colors;
