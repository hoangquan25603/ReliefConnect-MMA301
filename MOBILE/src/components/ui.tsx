import React from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export const palette = {
  navy: "#143448",
  orange: "#E87938",
  bg: "#F3F5F4",
  paper: "#FFFFFF",
  text: "#183547",
  muted: "#607680",
  border: "#DFE7E8",
  red: "#B53C37",
  green: "#157D64",
  light: "#EAF3EF",
};
export function Screen({
  children,
  refreshing = false,
  onRefresh,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: palette.bg }}
      edges={["left", "right"]}
    >
      <ScrollView
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}
export function Heading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ gap: 6, marginVertical: 8 }}>
      <Text accessibilityRole="header" style={styles.heading}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
    </View>
  );
}
export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.secondary,
        variant === "danger" && { backgroundColor: palette.red },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.75 },
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "secondary" ? palette.navy : "white"}
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === "secondary" && { color: palette.navy },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
export function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#8B9BA2"
        style={[
          styles.input,
          props.multiline && { height: 110, textAlignVertical: "top" },
        ]}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}
export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {options.map((o) => (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === o.value }}
            onPress={() => onChange(o.value)}
            style={[
              styles.chip,
              value === o.value && {
                backgroundColor: palette.navy,
                borderColor: palette.navy,
              },
            ]}
          >
            <Text
              style={{
                color: value === o.value ? "white" : palette.text,
                fontWeight: "600",
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
export function Notice({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  return text ? (
    <View
      accessibilityRole="alert"
      style={[styles.notice, error && { backgroundColor: "#FCEDEA" }]}
    >
      <Text
        style={{ color: error ? palette.red : palette.green, lineHeight: 21 }}
      >
        {text}
      </Text>
    </View>
  ) : null;
}
export function Empty({ text }: { text: string }) {
  return (
    <View style={{ padding: 28, alignItems: "center" }}>
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}
export function Badge({ text }: { text: string }) {
  return <Text style={styles.badge}>{labels[text] || text}</Text>;
}
export const labels: Record<string, string> = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Assigned: "Đã phân công",
  Accepted: "Đã nhận",
  OnTheWay: "Đang di chuyển",
  InProgress: "Đang thực hiện",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
  Rejected: "Từ chối",
  Admin: "Quản trị viên",
  Requester: "Người yêu cầu",
  Volunteer: "Tình nguyện viên",
  Coordinator: "Quản lý kho",
  Organization: "Tổ chức",
};
export function confirmAction(title: string, action: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(title)) action();
  } else
    Alert.alert("Xác nhận", title, [
      { text: "Quay lại", style: "cancel" },
      { text: "Xác nhận", onPress: action },
    ]);
}
export const styles = StyleSheet.create({
  screen: {
    padding: 20,
    gap: 16,
    paddingBottom: 36,
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
  },
  card: {
    backgroundColor: palette.paper,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  heading: {
    fontSize: 27,
    fontWeight: "800",
    color: palette.navy,
    letterSpacing: -0.6,
  },
  muted: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: "700", color: palette.text },
  input: {
    backgroundColor: "#FAFCFC",
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    fontSize: 16,
    color: palette.text,
    minHeight: 48,
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: palette.navy,
    padding: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: { backgroundColor: palette.light },
  buttonText: { fontSize: 14, fontWeight: "700", color: "white" },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "white",
  },
  notice: { backgroundColor: palette.light, padding: 14, borderRadius: 12 },
  badge: {
    color: palette.green,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: palette.light,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
});
