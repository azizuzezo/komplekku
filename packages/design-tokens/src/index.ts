export const colors = {
  primary: "oklch(40.9% 0.1753 287.9)", // #4B2DA1
  primaryDark: "oklch(34.1% 0.1783 281.6)", // #32178F
  background: "oklch(100% 0 0)",
  surface: "oklch(100% 0 0)",
  surfaceSoft: "oklch(97.4% 0.003 286)", // #F6F6F8
  surfaceSage: "oklch(94.4% 0.03 296.2)", // #EEE9FF soft purple
  textPrimary: "oklch(26.2% 0.015 297)", // #25232B
  textSecondary: "oklch(56.6% 0.019 297)", // #777480
  border: "oklch(89% 0.006 296)",
  accent: "oklch(74.1% 0.1249 221.9)", // #32BCE3 cyan
  warning: "oklch(62.64% 0.1248 70.45)",
  danger: "oklch(62.6% 0.1933 23)", // #E5484D
  success: "oklch(63.6% 0.1453 155.9)", // #20A464
  warningInk: "oklch(43% 0.105 70.45)",
  dangerInk: "oklch(45% 0.13 23.49)",
  successInk: "oklch(42% 0.08 155.85)",
  focus: "oklch(48% 0.19 288)",
  focusGuard: "oklch(100% 0 0)",
  accentInk: "oklch(26.2% 0.015 297)",
  onPrimary: "oklch(100% 0 0)",
  onDanger: "oklch(100% 0 0)",
  info: "oklch(40.9% 0.1753 287.9)",
  disabled: "oklch(82% 0.008 296)",
  loading: "oklch(97.4% 0.003 286)",
  neutral: "oklch(46% 0.016 297)",
  paper3: "oklch(93% 0.003 286)",
  ink2: "oklch(38% 0.014 297)",
  rule2: "oklch(80% 0.01 296)",
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
