import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AppProvider, useApp } from "./src/state/AppContext";
import { ConnectionScreen, LoginScreen } from "./src/screens/AuthScreens";
import HomeScreen from "./src/screens/HomeScreen";
import RequestsScreen, {
  CreateRequestScreen,
} from "./src/screens/RequestsScreen";
import TasksScreen from "./src/screens/TasksScreen";
import InventoryScreen from "./src/screens/InventoryScreen";
import AiScreen from "./src/screens/AiScreen";
import MoreScreen, {
  NotificationsScreen,
  ProfileScreen,
  VolunteerProfileScreen,
} from "./src/screens/MoreScreens";
import {
  DonationsScreen,
  AdminListScreen,
} from "./src/screens/ManagementScreens";
import RecoveryScreen from "./src/screens/RecoveryScreen";
import { palette } from "./src/components/ui";
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
function Tabs() {
  const { user } = useApp();
  const insets = useSafeAreaInsets();
  const role = user!.role;
  const icons: Record<string, any> = {
    Home: "home-outline",
    Requests: "file-tray-outline",
    Tasks: "people-outline",
    Inventory: "cube-outline",
    AI: "sparkles-outline",
    More: "grid-outline",
  };
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: palette.navy },
        headerTintColor: "white",
        headerTitleStyle: { fontSize: 18, fontWeight: "700" },
        tabBarActiveTintColor: palette.orange,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          borderTopColor: palette.border,
          height: 64 + insets.bottom,
          paddingTop: 5,
          paddingBottom: Math.max(8, insets.bottom),
        },
        tabBarLabelStyle: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Tổng quan" }}
      />
      {["Requester", "Admin"].includes(role) && (
        <Tab.Screen
          name="Requests"
          component={RequestsScreen}
          options={{ title: "Yêu cầu" }}
        />
      )}
      {role === "Volunteer" && (
        <Tab.Screen
          name="Tasks"
          component={TasksScreen}
          options={{ title: "Nhiệm vụ" }}
        />
      )}
      {["Admin", "Coordinator"].includes(role) && (
        <Tab.Screen
          name="Inventory"
          component={InventoryScreen}
          options={{ title: "Kho hàng" }}
        />
      )}
      <Tab.Screen
        name="AI"
        component={AiScreen}
        options={{ title: "Trợ lý AI" }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{ title: "Tiện ích" }}
      />
    </Tab.Navigator>
  );
}
function Root() {
  const { ready, user, serverUrl } = useApp();
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <ActivityIndicator color={palette.navy} />
        <Text>Đang mở ReliefConnect…</Text>
      </View>
    );
  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: palette.navy,
          background: palette.bg,
        },
      }}
    >
      <Stack.Navigator
        key={!serverUrl ? "setup" : user ? "signed-in" : "signed-out"}
        screenOptions={{
          headerStyle: { backgroundColor: palette.navy },
          headerTintColor: "white",
          headerBackTitle: "Quay lại",
        }}
      >
        {!serverUrl ? (
          <Stack.Screen
            name="Connection"
            component={ConnectionScreen}
            options={{ title: "Bắt đầu" }}
          />
        ) : !user ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: "ReliefConnect" }}
            />
            <Stack.Screen
              name="Recovery"
              component={RecoveryScreen}
              options={{ title: "Khôi phục mật khẩu" }}
            />
            <Stack.Screen
              name="Connection"
              component={ConnectionScreen}
              options={{ title: "Kết nối máy chủ" }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={Tabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreateRequest"
              component={CreateRequestScreen}
              options={{ title: "Yêu cầu mới" }}
            />
            <Stack.Screen
              name="Connection"
              component={ConnectionScreen}
              options={{ title: "Kết nối máy chủ" }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: "Thông báo" }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: "Tài khoản" }}
            />
            <Stack.Screen
              name="VolunteerProfile"
              component={VolunteerProfileScreen}
              options={{ title: "Hồ sơ tình nguyện viên" }}
            />
            <Stack.Screen
              name="Donations"
              component={DonationsScreen}
              options={{ title: "Quyên góp" }}
            />
            <Stack.Screen
              name="Users"
              component={AdminListScreen}
              options={{ title: "Người dùng" }}
            />
            <Stack.Screen
              name="Volunteers"
              component={AdminListScreen}
              options={{ title: "Tình nguyện viên" }}
            />
            <Stack.Screen
              name="RoleRequests"
              component={AdminListScreen}
              options={{ title: "Nguyện vọng" }}
            />
            <Stack.Screen
              name="Tasks"
              component={TasksScreen}
              options={{ title: "Phân công" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}
