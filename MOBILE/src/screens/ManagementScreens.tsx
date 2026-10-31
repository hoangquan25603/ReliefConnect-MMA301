import React, { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useApp } from "../state/AppContext";
import { usePaged } from "../hooks/usePaged";
import { items } from "../lib/api";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Heading,
  Notice,
  Select,
  confirmAction,
  palette,
  styles,
  labels,
} from "../components/ui";

export function DonationsScreen() {
  const { api, user } = useApp();
  const staff = ["Admin", "Coordinator"].includes(user!.role);
  const { data, loading, error, reload, loadMore } = usePaged(
    staff ? "/donations/pending" : "/donations/my",
  );
  const [rows, setRows] = useState([{ itemName: "", unit: "", quantity: "1" }]);
  const [note, setNote] = useState("");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouse] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (staff)
      api("/warehouses?pageSize=100")
        .then((x) =>
          setWarehouses(items(x).filter((x) => x.isActive !== false)),
        )
        .catch((e) => setMessage(e.message));
  }, [api, staff]);
  async function act(path: string, body: any, method = "PUT") {
    setBusy(true);
    setMessage("");
    try {
      await api(path, { method, body });
      setRows([{ itemName: "", unit: "", quantity: "1" }]);
      setNote("");
      reload();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <FlatList
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={styles.screen}
      data={data}
      keyExtractor={(x) => String(x.id)}
      refreshing={loading}
      onRefresh={reload}
      onEndReached={loadMore}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 16 }}>
          <Heading
            title="Quyên góp vật tư"
            subtitle={
              staff
                ? "Kiểm tra và tiếp nhận vào kho."
                : "Gửi danh sách vật tư tổ chức muốn đóng góp."
            }
          />
          <Notice text={error || message} error />
          {staff ? (
            <Card>
              <Select
                label="Kho tiếp nhận"
                value={warehouseId}
                onChange={setWarehouse}
                options={warehouses.map((x) => ({
                  value: String(x.id),
                  label: x.name,
                }))}
              />
              <Field
                label="Lý do từ chối (nếu cần)"
                value={reason}
                onChangeText={setReason}
              />
            </Card>
          ) : (
            <Card>
              {rows.map((r, i) => (
                <View key={i} style={{ gap: 10 }}>
                  <Text style={{ fontWeight: "700" }}>Vật tư {i + 1}</Text>
                  {(["itemName", "unit", "quantity"] as const).map((k) => (
                    <Field
                      key={k}
                      label={
                        {
                          itemName: "Tên vật tư",
                          unit: "Đơn vị",
                          quantity: "Số lượng",
                        }[k]
                      }
                      value={r[k]}
                      keyboardType={k === "quantity" ? "number-pad" : "default"}
                      onChangeText={(v) =>
                        setRows((p) =>
                          p.map((x, n) => (n === i ? { ...x, [k]: v } : x)),
                        )
                      }
                    />
                  ))}
                  {rows.length > 1 && (
                    <Button
                      title="Bỏ dòng này"
                      variant="secondary"
                      onPress={() =>
                        setRows((p) => p.filter((_, n) => n !== i))
                      }
                    />
                  )}
                </View>
              ))}
              <Button
                title="+ Thêm vật tư"
                variant="secondary"
                onPress={() =>
                  setRows((p) => [
                    ...p,
                    { itemName: "", unit: "", quantity: "1" },
                  ])
                }
              />
              <Field label="Ghi chú" value={note} onChangeText={setNote} />
              <Button
                title="Gửi quyên góp"
                loading={busy}
                onPress={() => {
                  if (
                    rows.some(
                      (x) =>
                        !x.itemName.trim() ||
                        !x.unit.trim() ||
                        !Number.isInteger(Number(x.quantity)) ||
                        Number(x.quantity) <= 0,
                    )
                  ) {
                    setMessage(
                      "Nhập tên, đơn vị và số lượng nguyên dương cho từng vật tư.",
                    );
                    return;
                  }
                  act(
                    "/donations",
                    {
                      items: rows.map((x) => ({
                        ...x,
                        quantity: Number(x.quantity),
                      })),
                      note,
                    },
                    "POST",
                  );
                }}
              />
            </Card>
          )}
        </View>
      }
      ListEmptyComponent={
        !loading ? <Empty text="Chưa có quyên góp trong danh sách." /> : null
      }
      renderItem={({ item: x }) => (
        <Card>
          <Badge text={x.status} />
          <Text
            style={{ fontWeight: "800", fontSize: 17, color: palette.navy }}
          >
            {x.donorName} · #{x.id}
          </Text>
          {x.items.map((r: any) => (
            <Text key={r.id} style={styles.muted}>
              {r.itemName}: {r.quantity} {r.unit}
            </Text>
          ))}
          {x.note && <Text style={styles.muted}>{x.note}</Text>}
          {x.rejectReason && <Notice text={x.rejectReason} error />}
          {staff && x.status === "Pending" && (
            <>
              <Button
                title="Tiếp nhận vào kho"
                disabled={!warehouseId}
                loading={busy}
                onPress={() =>
                  confirmAction(
                    "Xác nhận vật tư đã được tiếp nhận vào kho đã chọn?",
                    () =>
                      act(`/donations/${x.id}/approve`, {
                        itemMappings: x.items.map((r: any) => ({
                          donationItemId: String(r.id),
                          createNewItem: true,
                          warehouseId,
                          newItemMinimumQuantity: 0,
                        })),
                      }),
                  )
                }
              />
              <Button
                title="Từ chối"
                variant="danger"
                disabled={!reason.trim()}
                loading={busy}
                onPress={() => act(`/donations/${x.id}/reject`, { reason })}
              />
            </>
          )}
        </Card>
      )}
    />
  );
}
export function AdminListScreen({ route }: any) {
  const type = route.name as string;
  const { api, user } = useApp();
  const path =
    type === "Users"
      ? "/admin/users"
      : type === "Volunteers"
        ? "/admin/volunteers"
        : "/admin/role-requests";
  const { data, loading, error, reload, loadMore } = usePaged(path);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState("Requester");
  const [reason, setReason] = useState("");
  async function act(path: string, body?: any) {
    setBusy(true);
    setMessage("");
    try {
      await api(path, { method: "PUT", body });
      reload();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <FlatList
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={styles.screen}
      data={data}
      keyExtractor={(x) => String(x.id || x.userId)}
      refreshing={loading}
      onRefresh={reload}
      onEndReached={loadMore}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 16 }}>
          <Heading
            title={
              type === "Users"
                ? "Quản lý người dùng"
                : type === "Volunteers"
                  ? "Duyệt tình nguyện viên"
                  : "Duyệt nguyện vọng"
            }
          />
          <Notice text={error || message} error />
          {type === "Users" ? (
            <Select
              label="Vai trò áp dụng khi bấm Đổi vai trò"
              value={role}
              onChange={setRole}
              options={[
                "Requester",
                "Volunteer",
                "Coordinator",
                "Organization",
                "Admin",
              ].map((x) => ({ value: x, label: labels[x] }))}
            />
          ) : (
            <Field
              label="Ghi chú / lý do từ chối"
              value={reason}
              onChangeText={setReason}
            />
          )}
        </View>
      }
      ListEmptyComponent={<Empty text="Không có dữ liệu." />}
      renderItem={({ item: x }) => (
        <Card>
          <Text
            style={{ fontWeight: "800", fontSize: 18, color: palette.navy }}
          >
            {x.fullName || x.userFullName}
          </Text>
          <Text style={styles.muted}>{x.email || x.userEmail}</Text>
          {x.role && <Badge text={x.role} />}{" "}
          {x.status && <Badge text={x.status} />}{" "}
          {type === "Users" ? (
            String(x.id || x.userId) !== String(user?.userId) && (
              <>
                <Button
                  title={`Đổi vai trò → ${labels[role]}`}
                  variant="secondary"
                  loading={busy}
                  onPress={() =>
                    confirmAction(`Đổi vai trò của ${x.fullName}?`, () =>
                      act(`/admin/users/${x.id || x.userId}/role`, {
                        roleName: role,
                      }),
                    )
                  }
                />
                <Button
                  title={x.isActive ? "Khóa tài khoản" : "Mở tài khoản"}
                  variant={x.isActive ? "danger" : "secondary"}
                  loading={busy}
                  onPress={() =>
                    confirmAction("Thay đổi trạng thái tài khoản?", () =>
                      act(
                        `/admin/users/${x.id || x.userId}/${x.isActive ? "deactivate" : "activate"}`,
                      ),
                    )
                  }
                />
              </>
            )
          ) : (
            <>
              {x.requestedRoleName && (
                <Text style={styles.muted}>
                  Xin quyền: {labels[x.requestedRoleName]}
                </Text>
              )}
              <Text style={styles.muted}>{x.reason || x.bio || x.address}</Text>
              {x.status === "Pending" && (
                <>
                  <Button
                    title="Duyệt"
                    loading={busy}
                    onPress={() => act(`${path}/${x.id}/approve`)}
                  />
                  <Button
                    title="Từ chối"
                    variant="danger"
                    loading={busy}
                    disabled={type === "RoleRequests" && !reason.trim()}
                    onPress={() =>
                      act(`${path}/${x.id}/reject`, {
                        reviewNote: reason,
                        reason,
                      })
                    }
                  />
                </>
              )}
            </>
          )}
        </Card>
      )}
    />
  );
}
