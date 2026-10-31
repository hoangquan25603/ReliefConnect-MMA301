import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Linking, Share, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { useApp } from "../state/AppContext";
import { usePaged } from "../hooks/usePaged";
import { parseSosMessage } from "../lib/sosParser";
import { QRCodeView } from "../components/QRCodeView";
import { formatVoucherText } from "../lib/voucher";
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
} from "../components/ui";

export default function RequestsScreen({ navigation }: any) {
  const { user, api } = useApp();
  const { data, loading, error, more, reload, loadMore } =
    usePaged("/relief-requests");
  const [actionError, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [headcount, setHeadcount] = useState("1");
  const [expandedQr, setExpandedQr] = useState<string | null>(null);
  const [previewVoucherId, setPreviewVoucherId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [emergencyFilter, setEmergencyFilter] = useState("ALL");

  const stats = useMemo(() => {
    const total = data.length;
    const pending = data.filter((x: any) => x.status === "Pending").length;
    const approved = data.filter((x: any) => x.status === "Approved").length;
    const inProgress = data.filter((x: any) =>
      ["Assigned", "Accepted", "OnTheWay"].includes(x.status),
    ).length;
    const completed = data.filter((x: any) => x.status === "Completed").length;
    return { total, pending, approved, inProgress, completed };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((x: any) => {
      if (statusFilter !== "ALL" && x.status !== statusFilter) return false;
      if (
        emergencyFilter !== "ALL" &&
        String(x.emergencyLevel) !== emergencyFilter
      )
        return false;
      if (keyword.trim()) {
        const q = keyword.trim().toLowerCase();
        const matchTitle = (x.title || "").toLowerCase().includes(q);
        const matchAddr = (x.address || "").toLowerCase().includes(q);
        const matchPhone = (x.contactPhone || "").includes(q);
        const matchDesc = (x.description || "").toLowerCase().includes(q);
        return matchTitle || matchAddr || matchPhone || matchDesc;
      }
      return true;
    });
  }, [data, statusFilter, emergencyFilter, keyword]);
  async function change(id: string, status: string) {
    if (
      status === "Approved" &&
      (!Number.isInteger(Number(headcount)) ||
        Number(headcount) < 1 ||
        Number(headcount) > 100)
    ) {
      setError("Số tình nguyện viên phải là số nguyên từ 1 đến 100.");
      return;
    }
    setBusy(id);
    setError("");
    try {
      await api(`/relief-requests/${id}/status`, {
        method: "PUT",
        body: { status, targetHeadcount: Number(headcount) },
      });
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <FlatList
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={styles.screen}
      data={filteredData}
      keyExtractor={(x) => String(x.id)}
      refreshing={loading}
      onRefresh={reload}
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={
        <View style={{ gap: 14, marginBottom: 16 }}>
          <Heading
            title="Yêu cầu cứu trợ"
            subtitle={
              user?.role === "Admin"
                ? "Xem xét, duyệt và theo dõi yêu cầu."
                : "Theo dõi các yêu cầu bạn đã gửi."
            }
          />
          {user?.role === "Requester" && (
            <Button
              title="+ Tạo yêu cầu hỗ trợ"
              onPress={() => navigation.navigate("CreateRequest")}
            />
          )}
          <Notice text={error || actionError} error />

          {/* Quick Statistics Banner */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
              padding: 10,
              backgroundColor: palette.paper,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: palette.border,
            }}
          >
            <Badge text={`Tổng: ${stats.total}`} />
            <Badge text={`Chờ duyệt: ${stats.pending}`} />
            <Badge text={`Đã duyệt: ${stats.approved}`} />
            <Badge text={`Đang xử lý: ${stats.inProgress}`} />
            <Badge text={`Hoàn thành: ${stats.completed}`} />
          </View>

          {/* Filter and Search Controls */}
          <Card>
            <Field
              label="Tìm kiếm nhanh"
              value={keyword}
              onChangeText={setKeyword}
              placeholder="Tìm theo tiêu đề, địa chỉ, SĐT..."
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Select
                  label="Trạng thái"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: "ALL", label: "Tất cả trạng thái" },
                    { value: "Pending", label: "Chờ duyệt" },
                    { value: "Approved", label: "Đã duyệt" },
                    { value: "Assigned", label: "Đã phân công" },
                    { value: "OnTheWay", label: "Đang vận chuyển" },
                    { value: "Completed", label: "Hoàn thành" },
                    { value: "Cancelled", label: "Đã hủy" },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Select
                  label="Mức khẩn cấp"
                  value={emergencyFilter}
                  onChange={setEmergencyFilter}
                  options={[
                    { value: "ALL", label: "Tất cả mức" },
                    { value: "3", label: "Mức 3 · Nghiêm trọng" },
                    { value: "2", label: "Mức 2 · Quy mô lớn" },
                    { value: "1", label: "Mức 1 · Thông thường" },
                  ]}
                />
              </View>
            </View>
            {(keyword || statusFilter !== "ALL" || emergencyFilter !== "ALL") && (
              <Button
                title="Đặt lại bộ lọc"
                variant="secondary"
                onPress={() => {
                  setKeyword("");
                  setStatusFilter("ALL");
                  setEmergencyFilter("ALL");
                }}
              />
            )}
          </Card>

          {user?.role === "Admin" && (
            <Field
              label="Số tình nguyện viên dự kiến khi duyệt"
              value={headcount}
              onChangeText={setHeadcount}
              keyboardType="number-pad"
            />
          )}
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListEmptyComponent={
        !loading ? (
          <Empty
            text={
              keyword || statusFilter !== "ALL" || emergencyFilter !== "ALL"
                ? "Không tìm thấy yêu cầu phù hợp với bộ lọc."
                : "Chưa có yêu cầu cứu trợ."
            }
          />
        ) : null
      }
      ListFooterComponent={
        more ? (
          <Button title="Tải thêm" onPress={loadMore} loading={loading} />
        ) : null
      }
      renderItem={({ item: x }) => (
        <Card>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Badge text={x.status} />
            <Text style={styles.muted}>#{x.id}</Text>
          </View>
          <Text
            style={{ fontSize: 18, fontWeight: "800", color: palette.navy }}
          >
            {x.title}
          </Text>
          <Text style={styles.muted}>{x.description}</Text>
          <Text style={styles.muted}>
            {x.address} · {x.affectedPeople} người
          </Text>
          <Text style={{ color: palette.orange, fontWeight: "700" }}>
            Mức khẩn cấp: {x.emergencyLevel}/3
          </Text>
          {x.photoDataUrl && (
            <Image
              source={{ uri: x.photoDataUrl }}
              style={{ width: "100%", height: 180, borderRadius: 12 }}
              accessibilityLabel="Ảnh hiện trường"
            />
          )}
          <Button
            title="Xem vị trí trên bản đồ"
            variant="secondary"
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${x.latitude},${x.longitude}`)}`,
              ).catch(() => setError("Không mở được ứng dụng bản đồ."))
            }
          />
          <Button
            title={expandedQr === String(x.id) ? "Ẩn mã QR xác nhận" : "📱 Mã QR giao nhận"}
            variant="secondary"
            onPress={() =>
              setExpandedQr((curr) => (curr === String(x.id) ? null : String(x.id)))
            }
          />
          {expandedQr === String(x.id) && (
            <QRCodeView
              value={`RELIEF:REQ:${x.id}:${x.emergencyLevel}`}
              title={`Mã giao nhận #${x.id}`}
              subtitle="Đưa mã này cho TNV đối soát khi nhận hàng cứu trợ."
            />
          )}
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Button
              title="📄 Xuất / Chia sẻ phiếu"
              variant="secondary"
              onPress={() => {
                const text = formatVoucherText({
                  id: x.id,
                  title: x.title,
                  address: x.address,
                  region: x.region,
                  contactPhone: x.contactPhone,
                  status: x.status,
                  affectedPeople: x.affectedPeople,
                  emergencyLevel: x.emergencyLevel,
                  inventoryIssues: x.inventoryIssues,
                });
                Share.share({
                  title: `Phiếu bàn giao cứu trợ #${x.id}`,
                  message: text,
                }).catch(() => setError("Không mở được trình chia sẻ."));
              }}
            />
            <Button
              title={
                previewVoucherId === String(x.id)
                  ? "Đóng xem phiếu"
                  : "👁️ Xem phiếu"
              }
              variant="secondary"
              onPress={() =>
                setPreviewVoucherId((curr) =>
                  curr === String(x.id) ? null : String(x.id),
                )
              }
            />
          </View>
          {previewVoucherId === String(x.id) && (
            <View
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 8,
                padding: 10,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <Text
                style={{
                  fontFamily: "monospace",
                  fontSize: 11,
                  color: palette.navy,
                  lineHeight: 16,
                }}
              >
                {formatVoucherText({
                  id: x.id,
                  title: x.title,
                  address: x.address,
                  region: x.region,
                  contactPhone: x.contactPhone,
                  status: x.status,
                  affectedPeople: x.affectedPeople,
                  emergencyLevel: x.emergencyLevel,
                  inventoryIssues: x.inventoryIssues,
                })}
              </Text>
            </View>
          )}
          {x.contactPhone && (
            <Text style={styles.muted}>Liên hệ: {x.contactPhone}</Text>
          )}
          {x.inventoryIssues?.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={{ fontWeight: "700", color: palette.navy }}>
                Cấp phát tại thời điểm duyệt
              </Text>
              {x.inventoryIssues.map((issue: any) => (
                <Notice
                  key={issue.category}
                  error={!issue.isFullyIssued}
                  text={`${({ Food: "Lương thực", Water: "Nước uống", Medicine: "Y tế", Blanket: "Chăn", Shelter: "Nơi trú" } as Record<string, string>)[issue.category] || issue.category}: đã cấp ${issue.issuedQuantity}/${issue.requestedQuantity}.${issue.reason ? " " + issue.reason : !issue.isFullyIssued ? " Cần người phụ trách bổ sung vật tư." : ""}`}
                />
              ))}
              {x.status === "Cancelled" && (
                <Text style={styles.muted}>
                  Yêu cầu đã hủy. Kiểm tra lịch sử kho để biết vật tư đã được
                  hoàn hay chưa.
                </Text>
              )}
            </View>
          )}
          {user?.role === "Admin" && x.status === "Pending" && (
            <Button
              title="Duyệt yêu cầu"
              loading={busy === x.id}
              onPress={() =>
                confirmAction(
                  "Duyệt yêu cầu và cấp phát vật tư theo nhu cầu đã nhập?",
                  () => change(x.id, "Approved"),
                )
              }
            />
          )}{" "}
          {!["Completed", "Cancelled"].includes(x.status) && (
            <Button
              title="Hủy yêu cầu"
              variant="danger"
              loading={busy === x.id}
              onPress={() =>
                confirmAction("Hủy yêu cầu cứu trợ này?", () =>
                  change(x.id, "Cancelled"),
                )
              }
            />
          )}
        </Card>
      )}
    />
  );
}
const blank = {
  title: "",
  description: "",
  address: "",
  region: "",
  latitude: "",
  longitude: "",
  affectedPeople: "1",
  contactPhone: "",
  emergencyLevel: "1",
  foodQuantity: "0",
  waterQuantity: "0",
  medicineQuantity: "0",
  blanketQuantity: "0",
  shelterQuantity: "0",
  photoDataUrl: "",
};
export function CreateRequestScreen({ navigation, route }: any) {
  const { api, user, serverUrl } = useApp();
  const [form, setForm] = useState(blank);
  const [sosInput, setSosInput] = useState("");
  const [sosSummary, setSosSummary] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const key = `relief-draft:${serverUrl}:${user?.userId}`;
  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw) setForm({ ...blank, ...JSON.parse(raw) });
      })
      .catch(() => setError("Không đọc được bản nháp trên máy."));
  }, [key]);
  useEffect(() => {
    if (route?.params?.prefill) {
      setForm((p) => ({ ...p, ...route.params.prefill }));
      if (route.params.summary) {
        setSosSummary(route.params.summary);
      }
    }
  }, [route?.params]);
  const change = (name: keyof typeof blank, value: string) =>
    setForm((p) => ({ ...p, [name]: value }));
  async function draft() {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(form));
      setMessage("Đã lưu bản nháp trên máy. Chưa gửi đến điều phối viên.");
    } catch {
      setError("Không lưu được bản nháp.");
    }
  }
  async function locate() {
    setBusy(true);
    setError("");
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted")
        throw new Error(
          "Bạn chưa cấp quyền vị trí. Có thể nhập tọa độ thủ công.",
        );
      const point = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setForm((p) => ({
        ...p,
        latitude: String(point.coords.latitude),
        longitude: String(point.coords.longitude),
      }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function photo(camera: boolean) {
    setError("");
    try {
      if (camera) {
        const p = await ImagePicker.requestCameraPermissionsAsync();
        if (!p.granted) throw new Error("Chưa có quyền máy ảnh.");
      }
      const result = await (
        camera
          ? ImagePicker.launchCameraAsync
          : ImagePicker.launchImageLibraryAsync
      )({
        mediaTypes: ["images"],
        quality: 0.3,
        base64: true,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        const value = `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`;
        if (!asset.base64 || value.length > 1400000)
          throw new Error("Ảnh lớn hơn 1 MB. Chọn ảnh nhỏ hơn.");
        change("photoDataUrl", value);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function submit() {
    setError("");
    setMessage("");
    const lat = Number(form.latitude),
      lng = Number(form.longitude);
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.address.trim() ||
      !form.contactPhone.trim() ||
      !form.latitude ||
      !form.longitude ||
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lng) ||
      lng < -180 ||
      lng > 180 ||
      !Number.isInteger(Number(form.affectedPeople)) ||
      Number(form.affectedPeople) < 1
    ) {
      setError(
        "Điền tiêu đề, mô tả, địa chỉ, liên hệ, tọa độ hợp lệ và số người tối thiểu 1.",
      );
      return;
    }
    const payload: any = {
      ...form,
      latitude: lat,
      longitude: lng,
      region: form.region || form.address,
      affectedPeople: Number(form.affectedPeople),
      emergencyLevel: Number(form.emergencyLevel),
    };
    for (const type of ["food", "water", "medicine", "blanket", "shelter"]) {
      const q = Number((form as any)[`${type}Quantity`]);
      if (!Number.isInteger(q) || q < 0) {
        setError("Số lượng vật tư phải là số nguyên không âm.");
        return;
      }
      payload[`${type}Quantity`] = q > 0 ? q : null;
      payload[`need${type[0].toUpperCase()}${type.slice(1)}`] = q > 0;
    }
    setBusy(true);
    try {
      await api("/relief-requests", { method: "POST", body: payload });
      // The server already accepted the request. A local cleanup failure must
      // not keep the submit form open and encourage a duplicate submission.
      await AsyncStorage.removeItem(key).catch(() => {});
      navigation.goBack();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Heading
        title="Tạo yêu cầu hỗ trợ"
        subtitle="Điền thông tin cụ thể để đội điều phối chuẩn bị đúng vật tư."
      />
      <Card>
        <Text style={{ fontWeight: "800", color: palette.navy, fontSize: 16 }}>
          ⚡ Nhập nhanh từ tin nhắn kêu cứu (SOS Parser)
        </Text>
        <Text style={styles.muted}>
          Dán tin nhắn kêu cứu từ Zalo/Facebook/SMS để tự động bóc tách SĐT, địa chỉ, số người, mức độ khẩn cấp và nhu cầu vật tư.
        </Text>
        <Field
          label="Nội dung tin nhắn kêu cứu"
          value={sosInput}
          onChangeText={setSosInput}
          multiline
          placeholder="Dán tin nhắn tại đây, ví dụ: Nhà 4 người ngập sâu tại số 12 đường Trưng Nữ Vương, Đà Nẵng, cần mì và nước gấp. LH 0905123456"
        />
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Button
            title="Mẫu ngập sâu Đà Nẵng"
            variant="secondary"
            onPress={() =>
              setSosInput(
                "Cứu hộ khẩn cấp! Nhà 4 người tại số 12 đường Trưng Nữ Vương, Đà Nẵng, nước ngập sâu ngang ngực, có người già. SĐT liên hệ: 0905123456. Cần 5 thùng mì tôm, 10 bình nước sạch gấp!",
              )
            }
          />
          <Button
            title="Mẫu cô lập Quảng Nam"
            variant="secondary"
            onPress={() =>
              setSosInput(
                "Khu vực thôn 3, xã Đại Lộc, Quảng Nam bị cô lập do sạt lở. Hộ 6 người thiếu lương thực và thuốc men hạ sốt. LH 0988776655. Cần chăn ấm và gạo.",
              )
            }
          />
        </View>
        <Button
          title="Trích xuất & Tự động điền"
          disabled={!sosInput.trim()}
          onPress={() => {
            const parsed = parseSosMessage(sosInput);
            setForm((p) => ({
              ...p,
              title: parsed.title,
              description: parsed.description,
              address: parsed.address || p.address,
              region: parsed.region || p.region,
              contactPhone: parsed.contactPhone || p.contactPhone,
              affectedPeople: parsed.affectedPeople,
              emergencyLevel: parsed.emergencyLevel,
              foodQuantity: parsed.foodQuantity,
              waterQuantity: parsed.waterQuantity,
              medicineQuantity: parsed.medicineQuantity,
              blanketQuantity: parsed.blanketQuantity,
              shelterQuantity: parsed.shelterQuantity,
              latitude:
                p.latitude ||
                (parsed.region === "Đà Nẵng"
                  ? "16.0544"
                  : parsed.region === "Huế"
                    ? "16.4637"
                    : "15.8801"),
              longitude:
                p.longitude ||
                (parsed.region === "Đà Nẵng"
                  ? "108.2022"
                  : parsed.region === "Huế"
                    ? "107.5909"
                    : "108.3380"),
            }));
            setSosSummary(`✓ Đã nhận diện: ${parsed.summary}`);
          }}
        />
        {sosSummary ? <Notice text={sosSummary} /> : null}
      </Card>
      <Card>
        <Field
          label="Tiêu đề"
          value={form.title}
          onChangeText={(v) => change("title", v)}
          maxLength={200}
        />
        <Field
          label="Mô tả tình hình"
          value={form.description}
          onChangeText={(v) => change("description", v)}
          multiline
          maxLength={4000}
        />
        <Field
          label="Địa chỉ"
          value={form.address}
          onChangeText={(v) => change("address", v)}
        />
        <Field
          label="Tỉnh / khu vực"
          value={form.region}
          onChangeText={(v) => change("region", v)}
        />
        <Field
          label="Số điện thoại liên hệ"
          value={form.contactPhone}
          onChangeText={(v) => change("contactPhone", v)}
          keyboardType="phone-pad"
        />
        <Field
          label="Số người cần hỗ trợ"
          value={form.affectedPeople}
          onChangeText={(v) => change("affectedPeople", v)}
          keyboardType="number-pad"
        />
        <Select
          label="Mức khẩn cấp do bạn đánh giá"
          value={form.emergencyLevel}
          onChange={(v) => change("emergencyLevel", v)}
          options={[
            { value: "1", label: "1 · Thông thường" },
            { value: "2", label: "2 · Quy mô lớn" },
            { value: "3", label: "3 · Nghiêm trọng" },
          ]}
        />
      </Card>
      <Card>
        <Text style={{ fontWeight: "700" }}>Vị trí hiện trường</Text>
        <Field
          label="Vĩ độ"
          value={form.latitude}
          onChangeText={(v) => change("latitude", v)}
          keyboardType="numbers-and-punctuation"
        />
        <Field
          label="Kinh độ"
          value={form.longitude}
          onChangeText={(v) => change("longitude", v)}
          keyboardType="numbers-and-punctuation"
        />
        <Button
          title="Lấy vị trí hiện tại"
          variant="secondary"
          loading={busy}
          onPress={locate}
        />
      </Card>
      <Card>
        <Text style={{ fontWeight: "700" }}>Vật tư cần hỗ trợ</Text>
        {(
          [
            ["foodQuantity", "Lương thực"],
            ["waterQuantity", "Nước uống"],
            ["medicineQuantity", "Y tế"],
            ["blanketQuantity", "Chăn"],
            ["shelterQuantity", "Nơi trú / lều"],
          ] as const
        ).map(([key, label]) => (
          <Field
            key={key}
            label={label}
            value={form[key]}
            onChangeText={(v) => change(key, v)}
            keyboardType="number-pad"
          />
        ))}
      </Card>
      <Card>
        <Text style={{ fontWeight: "700" }}>
          Ảnh hiện trường (không bắt buộc)
        </Text>
        {form.photoDataUrl ? (
          <>
            <Image
              source={{ uri: form.photoDataUrl }}
              style={{ height: 180, width: "100%", borderRadius: 12 }}
            />
            <Button
              title="Gỡ ảnh"
              variant="secondary"
              onPress={() => change("photoDataUrl", "")}
            />
          </>
        ) : null}
        <Button
          title="Chọn ảnh"
          variant="secondary"
          onPress={() => photo(false)}
        />
        <Button
          title="Chụp ảnh"
          variant="secondary"
          onPress={() => photo(true)}
        />
      </Card>
      <Notice text={error} error />
      <Notice text={message} />
      <Button title="Gửi yêu cầu" onPress={submit} loading={busy} />
      <Button
        title="Lưu bản nháp trên máy"
        variant="secondary"
        onPress={draft}
      />
    </Screen>
  );
}
