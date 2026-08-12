export const colors = {
  primary: "oklch(66.5% 0.138 214.3)", // #00ACC1
  primaryDark: "oklch(52.2% 0.125 214.3)", // #00838F
  background: "oklch(98.3% 0.009 210.8)", // #F3FBFC
  surface: "oklch(100% 0 0)", // #FFFFFF
  surfaceSoft: "oklch(96.2% 0.021 211.5)", // #E0F7FA
  surfaceSage: "oklch(91.8% 0.045 212.1)", // #B2EBF2
  textPrimary: "oklch(24.5% 0.045 214.3)", // #0F2F34
  textSecondary: "oklch(48% 0.042 214.3)", // #376E76
  border: "oklch(85.8% 0.076 212.8)", // #80DEEA
  accent: "oklch(79.2% 0.108 213.5)", // #4DD0E1
  warning: "oklch(62.64% 0.1248 70.45)",
  danger: "oklch(54.01% 0.1486 23.49)",
  success: "oklch(52.32% 0.0954 155.85)",
  warningInk: "oklch(43% 0.105 70.45)",
  dangerInk: "oklch(45% 0.13 23.49)",
  successInk: "oklch(42% 0.08 155.85)",
  focus: "oklch(66.5% 0.138 214.3)",
  focusGuard: "oklch(100% 0 0)",
  accentInk: "oklch(24.5% 0.045 214.3)",
  onPrimary: "oklch(100% 0 0)",
  onDanger: "oklch(100% 0 0)",
  info: "oklch(66.5% 0.138 214.3)",
  disabled: "oklch(79.2% 0.035 212.8)",
  loading: "oklch(96.2% 0.021 211.5)",
  neutral: "oklch(48% 0.042 214.3)",
  paper3: "oklch(96.2% 0.021 211.5)",
  ink2: "oklch(35% 0.045 214.3)",
  rule2: "oklch(85.8% 0.076 212.8)",
} as const;

export const fonts = {
  display:
    '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  body: '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
} as const;

export const fontSizes = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  md: "1.125rem",
  lg: "1.25rem",
  xl: "1.5rem",
  "2xl": "2rem",
  "3xl": "2.5rem",
  displaySmall: "clamp(2rem, 4vw + 0.5rem, 3.25rem)",
  display: "clamp(2.5rem, 5vw + 0.75rem, 4.5rem)",
} as const;

export const spacing = {
  "3xs": "0.125rem",
  "2xs": "0.25rem",
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2.5rem",
  "2xl": "4rem",
  "3xl": "6rem",
  "4xl": "9rem",
} as const;

export const radii = {
  sm: "0.5rem",
  md: "0.75rem",
  button: "0.5rem",
  input: "0.625rem",
  card: "0.75rem",
  modal: "0.875rem",
  sheet: "1.125rem",
} as const;

export const motion = {
  easing: {
    out: "cubic-bezier(0.16, 1, 0.3, 1)",
    in: "cubic-bezier(0.7, 0, 0.84, 0)",
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  },
  duration: {
    micro: "120ms",
    short: "220ms",
    long: "420ms",
    press: "90ms",
    release: "120ms",
    hover: "160ms",
    page: "200ms",
    sheet: "240ms",
    modal: "180ms",
  },
} as const;

export const interaction = {
  focusWidth: "2px",
  focusOffset: "2px",
  focusInputOffset: "1px",
  minimumControlSize: "2.75rem",
  controlHeight: "3rem",
  disabledOpacity: 0.55,
  mutedOpacity: 0.72,
} as const;

export const zIndices = {
  base: 1,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  modal: 400,
  toast: 500,
  tooltip: 600,
} as const;

export const designTokens = {
  colors,
  fonts,
  fontSizes,
  spacing,
  radii,
  motion,
  interaction,
  zIndices,
} as const;

export type ColorToken = keyof typeof colors;
export type FontSizeToken = keyof typeof fontSizes;
export type RadiusToken = keyof typeof radii;
export type SpacingToken = keyof typeof spacing;
