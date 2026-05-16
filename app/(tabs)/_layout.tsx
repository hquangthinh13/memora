import { Redirect, Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Home07Icon,
  UserIcon,
  LibraryIcon,
  BookOpen01Icon,
  UserGroup02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, HugeiconsProps } from "@hugeicons/react-native";

import { colors, components } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useDeckInvites } from "@/hooks/useDeckInvites";
import { useFriends } from "@/hooks/useFriends";
import { cn } from "@/lib/cn";
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
  const { pendingCount: friendRequests } = useFriends();
  const { pendingCount: deckInvites } = useDeckInvites();
  const totalPending = friendRequests + deckInvites;

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
      {tabs.map((tab) => {
        const isFriendsTab = tab.name === "friends/index";
        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ focused }) => (
                <View>
                  <TabsIcon focused={focused} icon={tab.icons} />
                  {isFriendsTab && totalPending > 0 ? (
                    <View
                      className="absolute right-1 top-1 min-w-5 items-center justify-center rounded-full bg-peach px-1"
                      style={{ height: 18 }}
                    >
                      <Text className="font-sans-semibold text-xs text-text">
                        {totalPending > 99 ? "99+" : totalPending}
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
