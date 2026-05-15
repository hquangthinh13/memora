export const fontFamilies = {
  sans: "Comfortaa-Regular",
  sansMedium: "Comfortaa-Medium",
  sansSemiBold: "Comfortaa-SemiBold",
  sansBold: "Comfortaa-Bold",
} as const;

// Static Comfortaa files are used instead of the variable font for reliable
// Expo/React Native weight mapping across native platforms.
export const fontAssets = {
  [fontFamilies.sans]: require("../../assets/fonts/Comfortaa-Regular.ttf"),
  [fontFamilies.sansMedium]: require("../../assets/fonts/Comfortaa-Medium.ttf"),
  [fontFamilies.sansSemiBold]: require("../../assets/fonts/Comfortaa-SemiBold.ttf"),
  [fontFamilies.sansBold]: require("../../assets/fonts/Comfortaa-Bold.ttf"),
};
