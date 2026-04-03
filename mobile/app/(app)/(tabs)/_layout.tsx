import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Colors } from "../../../constants/Colors";

function TabIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.icon, focused && styles.iconActive]}>{children}</View>
  );
}

// Íconos SVG mínimos inline (sin dependencia extra de icon libs)
const HomeIcon = ({ color }: { color: string }) => (
  <View
    style={{
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <View
      style={[
        {
          width: 14,
          height: 12,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: 3,
        },
      ]}
    />
  </View>
);
const ListIcon = ({ color }: { color: string }) => (
  <View style={{ width: 22, height: 22, gap: 4, justifyContent: "center" }}>
    {[0, 1, 2].map((i) => (
      <View
        key={i}
        style={{
          height: 2.5,
          width: 18,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
    ))}
  </View>
);
const ChartIcon = ({ color }: { color: string }) => (
  <View
    style={{
      width: 22,
      height: 22,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 3,
    }}
  >
    {[10, 16, 8, 14].map((h, i) => (
      <View
        key={i}
        style={{ width: 4, height: h, backgroundColor: color, borderRadius: 2 }}
      />
    ))}
  </View>
);
const SettingsIcon = ({ color }: { color: string }) => (
  <View
    style={{
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <View
      style={{
        width: 16,
        height: 16,
        borderWidth: 2,
        borderColor: color,
        borderRadius: 8,
      }}
    />
  </View>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <HomeIcon color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <ListIcon color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <ChartIcon color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <SettingsIcon color={color} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBar,
    borderTopWidth: 0,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  icon: {
    padding: 6,
    borderRadius: 12,
  },
  iconActive: {
    backgroundColor: "rgba(6,182,212,0.15)",
  },
});
