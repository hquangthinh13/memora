import { Redirect, Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BookBookmark02Icon,
  Home07Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, HugeiconsProps } from "@hugeicons/react-native";

import { colors, components } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/cn";
import { needsPasswordSetup } from "@/services/auth";

const tabs = [
  {
    name: "index",
    title: "Home",
    icons: Home07Icon,
  },
  {
    name: "rooms/index",
    title: "Rooms",
    icons: Search01Icon,
  },
  {
    name: "library/index",
    title: "My Library",
    icons: BookBookmark02Icon,
  },
  {
    name: "profile/index",
    title: "Profile",
    icons: Home07Icon,
  },
];

const hiddenScreens = [
  "cards/edit",
  "decks/index",
  "decks/[deckId]/index",
  "decks/[deckId]/edit",
  "decks/new",
  "rooms/lobby",
  "rooms/play",
  "rooms/result",
  "study",
];
const TabsIcon = ({
  focused,
  icon,
}: {
  focused: boolean;
  icon: HugeiconsProps["icon"];
}) => {
  return (
    <View className="size-12 items-center justify-center">
      <View
        className={cn(
          "size-12 items-center justify-center rounded-full ",
          focused && "bg-primary",
        )}
      >
        <HugeiconsIcon
          className="tabs-glyph"
          icon={icon}
          color={focused ? "#ffffff" : "rgba(0, 0, 0, 0.6)"}
        />
      </View>
    </View>
  );
};

const TabsLayout = () => {
  const insets = useSafeAreaInsets();
  const { loading, session, user } = useAuth();

  if (loading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/onboarding" />;
  }

  if (needsPasswordSetup(user)) {
    return <Redirect href="/setup-password" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarStyle: {
          position: "absolute",
          height: components.tabBar.height + insets.bottom + 16,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: insets.bottom,
        },
        tabBarItemStyle: {
          paddingVertical:
            components.tabBar.height / 2 - components.tabBar.iconFrame / 1.6,
        },
        tabBarIconStyle: {
          width: components.tabBar.iconFrame,
          height: components.tabBar.iconFrame,
          alignItems: "center",
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => (
              <TabsIcon focused={focused} icon={tab.icons} />
            ),
            tabBarLabel: ({ focused }) => (
              <Text
                className={cn(
                  "mt-2 text-center font-sans-medium text-xs",
                  focused ? "text-text" : "text-text-muted",
                )}
              >
                {tab.title}
              </Text>
            ),
          }}
        />
      ))}
      {hiddenScreens.map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            href: null,
          }}
        />
      ))}
    </Tabs>
  );
};

export default TabsLayout;
