export const colors = {
  primary: "oklch(42.5% 0.0593 170.96)",
  primaryDark: "oklch(35.46% 0.0487 170.49)",
  background: "oklch(100% 0 0)",
  surface: "oklch(100% 0 0)",
  surfaceSoft: "oklch(96% 0.002 0)",
  surfaceSage: "oklch(92.7% 0.018 153)",
  textPrimary: "oklch(22.5% 0.021 163)",
  textSecondary: "oklch(46% 0.022 160)",
  border: "oklch(84.5% 0.018 150)",
  accent: "oklch(63.48% 0.1234 42.27)",
  warning: "oklch(62.64% 0.1248 70.45)",
  danger: "oklch(54.01% 0.1486 23.49)",
  success: "oklch(52.32% 0.0954 155.85)",
  warningInk: "oklch(43% 0.105 70.45)",
  dangerInk: "oklch(45% 0.13 23.49)",
  successInk: "oklch(42% 0.08 155.85)",
  focus: "oklch(55% 0.14 171)",
  focusGuard: "oklch(100% 0 0)",
  accentInk: "oklch(22.5% 0.021 163)",
  onPrimary: "oklch(100% 0 0)",
  onDanger: "oklch(100% 0 0)",
  info: "oklch(42.5% 0.0593 170.96)",
  disabled: "oklch(72% 0.018 155)",
  loading: "oklch(91% 0.002 0)",
  neutral: "oklch(38% 0.021 162)",
  paper3: "oklch(91% 0.002 0)",
  ink2: "oklch(35% 0.021 163)",
  rule2: "oklch(76% 0.02 153)",
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
