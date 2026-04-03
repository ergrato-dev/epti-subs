export const Colors = {
  // Backgrounds
  bg: "#0A1628",
  bgCard: "#152238",
  bgCardAlt: "#1A2B42",

  // Accent
  accent: "#06B6D4",
  accentDark: "#0891B2",
  accentLight: "#67E8F9",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#475569",

  // Status
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",

  // Colores de fallback para tarjetas sin color asignado (fondos oscuros)
  cardColors: [
    "#1E3A5F", // azul marino profundo
    "#0F4C5C", // teal oscuro
    "#1A3A2A", // verde oscuro
    "#2D1B69", // índigo
    "#3D1A1A", // rojo oscuro
    "#1A2D3D", // azul grisáceo
  ],

  // Paleta de 20 colores vivos para el selector de color de nuevas suscripciones.
  // Fuente de verdad — usar siempre este array en subscription-form.tsx.
  // Scroll horizontal; los dots tienen 32×32 px con borde blanco al seleccionar.
  subscriptionColors: [
    "#7C3AED", // violeta
    "#9333EA", // púrpura
    "#8B5CF6", // lila
    "#6366F1", // índigo
    "#2563EB", // azul royal
    "#0891B2", // cian oscuro
    "#06B6D4", // cian
    "#14B8A6", // turquesa
    "#0D9488", // teal
    "#059669", // esmeralda
    "#16A34A", // verde
    "#65A30D", // lima
    "#CA8A04", // dorado
    "#D97706", // ámbar
    "#F97316", // naranja
    "#EA580C", // naranja rojizo
    "#DC2626", // rojo
    "#E11D48", // crimson
    "#DB2777", // rosa
    "#EC4899", // fucsia
  ],

  // UI
  border: "#1E3A5F",
  inputBg: "#152238",
  tabBar: "#0D1F35",
  overlay: "rgba(10,22,40,0.85)",
} as const;

export type ColorKey = keyof typeof Colors;
