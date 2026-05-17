import { cssInterop } from "nativewind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

cssInterop(RNSafeAreaView, {
  className: "style",
});

export const SafeAreaView = RNSafeAreaView;
