import React, { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useApp } from "../state/AppContext";
import { usePaged } from "../hooks/usePaged";
import { items, ApiError } from "../lib/api";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Heading,
  Notice,
  Screen,
  Select,
  confirmAction,
  palette,
  styles,
  labels,
} from "../components/ui";
export default function MoreScreen({ navigation }: any) {
  const { user, logout } = useApp();
  const role = user!.role;
  const links = [
    ["Notifications", "Thông báo"],
    ["Profile", "Tài khoản & mật khẩu"],
    ["Connection", "Kết nối máy chủ"],
    ...(["Admin", "Coordinator", "Organization"].includes(role)
      ? [["Donations", "Quyên góp vật tư"]]
      : []),
    ...(["Requester", "Volunteer"].includes(role)
      ? [["VolunteerProfile", "Hồ sơ tình nguyện viên"]]
      : []),
    ...(role === "Admin"
      ? [
          ["Users", "Người dùng"],
          ["Volunteers", "Duyệt tình nguyện viên"],
          ["RoleRequests", "Duyệt nguyện vọng"],
          ["Tasks", "Phân công & tiến độ"],
        ]
      : []),
    ...(role === "Coordinator" ? [["Tasks", "Phân công & tiến độ"]] : []),
  ];
  return (
    <Screen>
      <Heading
        title="Tài khoản & tiện ích"
        subtitle={`${user?.fullName} · ${labels[role]}`}
      />
      {links.map(([route, title]) => (
        <Button
          key={route}
          title={title}
          variant="secondary"
          onPress={() => navigation.navigate(route)}
        />
      ))}
      <Button
        title="Đăng xuất"
        variant="danger"
        onPress={() =>
          confirmAction("Đăng xuất tài khoản trên thiết bị này?", () =>
            logout(),
          )
        }
      />
      <Card>
        <Text style={{ fontWeight: "700", color: palette.navy }}>
          ReliefConnect 1.0 · MMA301
        </Text>
        <Text style={styles.muted}>
          Ứng dụng cứu trợ phát triển với React Native/Expo. AI chỉ hỗ trợ phân
          loại nhu cầu; mọi quyết định điều phối đều do người phụ trách xác
          nhận.
        </Text>
      </Card>
    </Screen>
  );
}
export function NotificationsScreen() {
  const { api } = useApp();
  const { data, error, loading, reload, loadMore } = usePaged("/notifications");
  const [message, setMessage] = useState("");
  async function read(path: string) {
    try {
      await api(path, { method: "PUT" });
      reload();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <FlatList
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={styles.screen}
      data={data}
      refreshing={loading}
      onRefresh={reload}
      onEndReached={loadMore}
      keyExtractor={(x) => String(x.id)}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 16 }}>
          <Heading
            title="Thông báo"
            subtitle="Cập nhật yêu cầu, phân công và kho hàng."
          />
          <Button
            title="Đánh dấu tất cả đã đọc"
            onPress={() => read("/notifications/read-all")}
            variant="secondary"
          />
          <Notice text={error || message} error />
        </View>
      }
      ListEmptyComponent={<Empty text="Chưa có thông báo." />}
      renderItem={({ item: x }) => (
        <Card>
          <Text
            style={{
              fontWeight: x.isRead ? "500" : "800",
              fontSize: 17,
              color: palette.navy,
            }}
          >
            {x.title}
          </Text>
          <Text style={styles.muted}>{x.message || x.content}</Text>
          <Text style={styles.muted}>
            {new Date(x.createdAt).toLocaleString("vi-VN")}
          </Text>
          {!x.isRead && (
            <Button
              title="Đã đọc"
              variant="secondary"
              onPress={() => read(`/notifications/${x.id}/read`)}
            />
          )}
        </Card>
      )}
    />
  );
}
export function ProfileScreen() {
  const { user, api, logout } = useApp();
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [role, setRole] = useState("Organization");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function change() {
    setBusy(true);
    setError("");
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: { oldPassword, newPassword, confirmPassword },
      });
      await logout();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upgrade() {
    setBusy(true);
    setError("");
    try {
      await api("/role-requests", {
        method: "POST",
        body: { requestedRoleName: role, reason },
      });
      setMessage("Đã gửi nguyện vọng chờ duyệt.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Heading title="Tài khoản" subtitle={user?.email} />
      <Card>
        <Text style={{ fontWeight: "800", fontSize: 20, color: palette.navy }}>
          {user?.fullName}
        </Text>
        <Badge text={user!.role} />
      </Card>
      <Card>
        <Text style={{ fontWeight: "700" }}>Đổi mật khẩu</Text>
        <Field
          label="Mật khẩu hiện tại"
          secureTextEntry
          value={oldPassword}
          onChangeText={setOld}
        />
        <Field
          label="Mật khẩu mới"
          secureTextEntry
          value={newPassword}
          onChangeText={setNew}
        />
        <Field
          label="Nhập lại mật khẩu mới"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirm}
        />
        <Text style={styles.muted}>
          Sau khi đổi thành công, đăng nhập lại bằng mật khẩu mới.
        </Text>
        <Button title="Đổi mật khẩu" loading={busy} onPress={change} />
      </Card>
      {user?.role !== "Admin" && (
        <Card>
          <Text style={{ fontWeight: "700" }}>Nguyện vọng đổi vai trò</Text>
          <Select
            label="Vai trò mong muốn"
            value={role}
            onChange={setRole}
            options={[
              { value: "Organization", label: "Tổ chức" },
              { value: "Coordinator", label: "Quản lý kho" },
            ]}
          />
          <Field
            label="Lý do"
            value={reason}
            onChangeText={setReason}
            multiline
          />
          <Button title="Gửi nguyện vọng" onPress={upgrade} loading={busy} />
        </Card>
      )}
      <Notice text={error} error />
      <Notice text={message} />
    </Screen>
  );
}
export function VolunteerProfileScreen() {
  const { api } = useApp();
  const [existing, setExisting] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [skill, setSkill] = useState("");
  const [form, setForm] = useState({
    address: "",
    latitude: "",
    longitude: "",
    bio: "",
    experienceYears: "0",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      const v = await api("/volunteers/me");
      setExisting(v);
      setForm({
        address: v.address,
        latitude: String(v.latitude),
        longitude: String(v.longitude),
        bio: v.bio || "",
        experienceYears: String(v.experienceYears),
      });
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404))
        setError((e as Error).message);
    }
  }
  useEffect(() => {
    load();
    api("/skills")
      .then((x) => setSkills(items(x)))
      .catch((e) => setError(e.message));
  }, [api]);
  async function save() {
    setBusy(true);
    setError("");
    try {
      if (!form.latitude || !form.longitude)
        throw new Error("Nhập tọa độ khu vực có thể tham gia.");
      await api("/volunteers/profile", {
        method: existing ? "PUT" : "POST",
        body: {
          ...form,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          experienceYears: Number(form.experienceYears),
        },
      });
      setMessage("Đã lưu hồ sơ. Hồ sơ mới cần quản trị viên duyệt.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function addSkill() {
    setBusy(true);
    try {
      await api("/volunteers/skills", {
        method: "POST",
        body: { skillIds: [skill] },
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Heading
        title="Hồ sơ tình nguyện viên"
        subtitle="Cập nhật kinh nghiệm và khu vực bạn có thể hỗ trợ."
      />
      {existing && <Badge text={existing.status} />}
      <Card>
        {(Object.keys(form) as (keyof typeof form)[]).map((k) => (
          <Field
            key={k}
            label={
              {
                address: "Địa chỉ",
                latitude: "Vĩ độ",
                longitude: "Kinh độ",
                bio: "Giới thiệu",
                experienceYears: "Số năm kinh nghiệm",
              }[k]
            }
            value={form[k]}
            onChangeText={(v) => setForm((p) => ({ ...p, [k]: v }))}
            multiline={k === "bio"}
          />
        ))}
        <Button title="Lưu hồ sơ" loading={busy} onPress={save} />
      </Card>
      {existing && (
        <Card>
          <Text style={{ fontWeight: "700" }}>Kỹ năng đã đăng ký</Text>
          {existing.skills?.map((s: any) => (
            <View key={s.id} style={{ gap: 4 }}>
              <Text>{s.name}</Text>
              <Button
                title={`Gỡ ${s.name}`}
                variant="secondary"
                onPress={async () => {
                  try {
                    await api(`/volunteers/skills/${s.id}`, {
                      method: "DELETE",
                    });
                    load();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              />
            </View>
          ))}
          <Select
            label="Thêm kỹ năng"
            value={skill}
            onChange={setSkill}
            options={skills.map((x) => ({
              value: String(x.id),
              label: x.name,
            }))}
          />
          <Button
            title="Thêm kỹ năng"
            disabled={!skill}
            loading={busy}
            onPress={addSkill}
          />
        </Card>
      )}
      <Notice text={error} error />
      <Notice text={message} />
    </Screen>
  );
}
