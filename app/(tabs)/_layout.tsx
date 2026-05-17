import { Redirect, Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Home07Icon,
  Notification03Icon,
  UserIcon,
  BookOpen01Icon,
  UserGroup02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, HugeiconsProps } from "@hugeicons/react-native";

import { colors, components } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/cn";
import { useOverlayState } from "@/providers/OverlayProvider";
import { needsPasswordSetup } from "@/services/auth";

const tabs = [
  {
    name: "index",
    title: "Home",
    icons: Home07Icon,
  },
  {
    name: "library/index",
    title: "My Library",
    icons: BookOpen01Icon,
  },
  {
    name: "friends/index",
    title: "Friends",
    icons: UserGroup02Icon,
  },
  {
    name: "notifications/index",
    title: "Notifications",
    icons: Notification03Icon,
  },
  {
    name: "profile/index",
    title: "Profile",
    icons: UserIcon,
  },
];

const hiddenScreens = [
  "cards/edit",
  "topics/index",
  "decks/index",
  "decks/[deckId]/index",
  "decks/[deckId]/edit",
  "decks/new",
  "profile/edit",
  "profile/change-password",
  "quiz",
  "rooms/lobby",
  "rooms/index",
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
  const { unreadCount } = useNotifications();
  const { hasActiveOverlay } = useOverlayState();

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
          display: hasActiveOverlay ? "none" : "flex",
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
      {tabs.map((tab) => {
        const isNotificationsTab = tab.name === "notifications/index";
        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ focused }) => (
                <View>
                  <TabsIcon focused={focused} icon={tab.icons} />
                  {isNotificationsTab && unreadCount > 0 ? (
                    <View
                      className="absolute right-1 top-1 min-w-5 items-center justify-center rounded-full bg-peach px-1"
                      style={{ height: 18 }}
                    >
                      <Text className="font-sans-semibold text-xs text-text">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Text>
                    </View>
                  ) : null}
                </View>
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
        );
      })}
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
