import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "../state/AppContext";
import { items } from "../lib/api";
import {
  Badge,
  Button,
  Card,
  Heading,
  Notice,
  Screen,
  palette,
  styles,
  labels,
} from "../components/ui";
export default function HomeScreen({ navigation }: any) {
  const { user, api } = useApp();
  const [data, setData] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const staff = ["Admin", "Coordinator"].includes(user!.role);
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      setData(
        items(
          await api(
            staff
              ? "/inventory-items?pageSize=100"
              : user?.role === "Volunteer"
                ? "/assignments?pageSize=100"
                : "/notifications?pageSize=5",
          ),
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [api, staff, user?.role]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  return (
    <Screen refreshing={busy} onRefresh={load}>
      <View
        style={{
          backgroundColor: palette.navy,
          borderRadius: 22,
          padding: 24,
          gap: 12,
        }}
      >
        <Text style={{ color: "#AAC6CA", letterSpacing: 2, fontSize: 11 }}>
          RELIEFCONNECT / MMA301
        </Text>
        <Text style={{ color: "white", fontSize: 26, fontWeight: "800" }}>
          Xin chào,{"\n"}
          {user?.fullName}
        </Text>
        <Text style={{ color: "#DBEAE6" }}>{labels[user!.role]}</Text>
      </View>
      <Heading
        title="Cùng hành động"
        subtitle="Thông tin cập nhật từ máy chủ của nhóm."
      />
      <Notice text={error} error />
      {staff ? (
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Card>
              <Text
                style={{ fontSize: 34, fontWeight: "800", color: palette.navy }}
              >
                {data.length}
              </Text>
              <Text style={styles.muted}>Vật tư đã tải</Text>
            </Card>
          </View>
          <View style={{ flex: 1 }}>
            <Card>
              <Text
                style={{
                  fontSize: 34,
                  fontWeight: "800",
                  color: palette.orange,
                }}
              >
                {data.filter((x) => x.quantity <= x.minimumQuantity).length}
              </Text>
              <Text style={styles.muted}>Chạm ngưỡng thấp</Text>
            </Card>
          </View>
        </View>
      ) : (
        <Card>
          <Text
            style={{ fontSize: 18, fontWeight: "700", color: palette.navy }}
          >
            {user?.role === "Volunteer"
              ? "Nhiệm vụ đang chờ bạn"
              : "Theo dõi hành trình cứu trợ"}
          </Text>
          <Text style={styles.muted}>
            Kéo xuống để tải mới. Yêu cầu và giao dịch chỉ được ghi nhận sau khi
            server xác nhận.
          </Text>
        </Card>
      )}
      <Card>
        <Text style={{ fontWeight: "800", fontSize: 18, color: palette.navy }}>
          Trợ lý AI cứu trợ
        </Text>
        <Text style={styles.muted}>
          Phân tích mô tả nhu cầu và đối chiếu vật tư sẵn có. Người phụ trách
          xác nhận trước khi điều phối.
        </Text>
        <Button
          title="Mở trợ lý AI"
          onPress={() => navigation.navigate("AI")}
        />
      </Card>
      {staff ? (
        <Button
          title="Quản lý vật tư & kho"
          variant="secondary"
          onPress={() => navigation.navigate("Inventory")}
        />
      ) : (
        <Button
          title={
            user?.role === "Volunteer"
              ? "Xem nhiệm vụ của tôi"
              : user?.role === "Organization"
                ? "Quản lý quyên góp"
                : "Mở yêu cầu cứu trợ"
          }
          variant="secondary"
          onPress={() =>
            navigation.navigate(
              user?.role === "Volunteer"
                ? "Tasks"
                : user?.role === "Organization"
                  ? "Donations"
                  : "Requests",
            )
          }
        />
      )}
      <Text style={{ fontWeight: "700", fontSize: 17, color: palette.navy }}>
        {staff ? "Vật tư cần chú ý" : "Cập nhật gần đây"}
      </Text>
      {(staff ? data.filter((x) => x.quantity <= x.minimumQuantity) : data)
        .slice(0, 4)
        .map((x, i) => (
          <Card key={x.id || i}>
            <Text style={{ fontWeight: "700", color: palette.text }}>
              {x.itemName || x.title || x.reliefRequestTitle || "Thông báo"}
            </Text>
            <Text style={styles.muted}>
              {x.message ||
                x.content ||
                x.address ||
                `${x.warehouseName ? x.warehouseName + ": " : ""}${x.quantity} ${x.unit}`}
            </Text>
            {x.status && <Badge text={x.status} />}
          </Card>
        ))}
    </Screen>
  );
}
