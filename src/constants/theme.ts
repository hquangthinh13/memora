export const colors = {
  background: "#f7f1ec",
  surface: "#fffdf9",
  surfaceSoft: "#f1e8e1",
  text: "#111015",
  textMuted: "#706a68",
  primary: "#111015",
  primaryForeground: "#ffffff",
  border: "#e8ddd6",
  mint: "#bdefd9",
  pink: "#f4bfc4",
  peach: "#f8d7ae",
  lavender: "#cbc7f6",
} as const;

export const spacing = {
  tabBarHeight: 72,
  tabBarIconFrame: 48,
} as const;

export const components = {
  tabBar: {
    height: spacing.tabBarHeight,
    iconFrame: spacing.tabBarIconFrame,
  },
} as const;

export const theme = {
  colors,
  spacing,
  components,
} as const;
