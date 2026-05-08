import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { View } from "react-native";

import MiniPlayer from "../../components/MiniPlayer";

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,

          tabBarActiveTintColor: "#ffffff",
          tabBarInactiveTintColor: "#7e7e7e",

          tabBarBackground: () => (
            <BlurView
              intensity={95}
              tint="dark"
              style={{
                flex: 1,
                borderRadius: 40,
                overflow: "hidden",
              }}
            />
          ),

          tabBarStyle: {
            position: "absolute",
            left: 14,
            right: 14,
            bottom: 16,
            height: 82,
            borderRadius: 40,
            borderTopWidth: 0,
            backgroundColor: "rgba(5,5,5,0.92)",
            overflow: "hidden",
            elevation: 0,
            paddingTop: 8,
            paddingBottom: 10,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.06)",
          },

          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "900",
            marginBottom: 4,
            letterSpacing: 0.4,
          },

          tabBarItemStyle: {
            borderRadius: 30,
            marginHorizontal: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: focused
                    ? "rgba(255,0,51,0.16)"
                    : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={24}
                  color={focused ? "#ff0033" : color}
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: focused
                    ? "rgba(168,85,247,0.18)"
                    : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={focused ? "compass" : "compass-outline"}
                  size={24}
                  color={focused ? "#a855f7" : color}
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="player"
          options={{
            title: "Player",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: focused
                    ? "rgba(255,0,51,0.16)"
                    : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={focused ? "play-circle" : "play-circle-outline"}
                  size={23}
                  color={focused ? "#ff0033" : color}
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="favorites"
          options={{
            title: "Library",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: focused
                    ? "rgba(255,0,102,0.16)"
                    : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={focused ? "heart" : "heart-outline"}
                  size={23}
                  color={focused ? "#ff0066" : color}
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="tv"
          options={{
            title: "TV",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: focused
                    ? "rgba(255,0,51,0.18)"
                    : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={focused ? "tv" : "tv-outline"}
                  size={24}
                  color={focused ? "#ff0033" : color}
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: focused
                    ? "rgba(34,211,238,0.16)"
                    : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={23}
                  color={focused ? "#22d3ee" : color}
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="queue"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="search"
          options={{
            href: null,
          }}
        />
      </Tabs>

      <MiniPlayer />
    </>
  );
}