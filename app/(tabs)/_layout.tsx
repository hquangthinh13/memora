import { Redirect, Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, components } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/cn";
import { needsPasswordSetup } from "@/services/auth";

const tabs = [
  {
    name: "index",
    title: "Home",
    icon: "H",
  },
  {
    name: "decks",
    title: "Decks",
    icon: "D",
  },
];

const hiddenScreens = [
  "cards/edit",
  "decks/new",
  "decks/[deckId]/index",
  "decks/[deckId]/edit",
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
  icon: string;
}) => {
  return (
    <View className="size-12 items-center justify-center">
      <View
        className={cn(
          "size-12 items-center justify-center rounded-full border border-border",
          focused && "bg-primary",
        )}
      >
        <Text
          className={cn(
            "font-sans-bold text-base",
            focused ? "text-primary-foreground" : "text-text-muted",
          )}
        >
          {icon}
        </Text>
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
              <TabsIcon focused={focused} icon={tab.icon} />
            ),
            tabBarLabel: ({ focused }) => (
              <Text
                className={cn(
                  "mt-1 text-center font-sans-medium text-xs",
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
