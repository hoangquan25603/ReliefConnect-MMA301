import React, { useEffect, useState } from "react";
import { FlatList, Linking, Text, View } from "react-native";
import { useApp } from "../state/AppContext";
import { usePaged } from "../hooks/usePaged";
import { items } from "../lib/api";
import { QRCodeView } from "../components/QRCodeView";
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
} from "../components/ui";
export default function TasksScreen() {
  const { api, user } = useApp();
  const staff = ["Admin", "Coordinator"].includes(user!.role);
  const [mode, setMode] = useState("mine");
  const { data, loading, error, reload, loadMore } = usePaged(
    mode === "open" ? "/relief-requests/open-tasks" : "/assignments",
  );
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [requestId, setRequest] = useState("");
  const [volunteerId, setVolunteer] = useState("");
  const [reason, setReason] = useState("");
  const [cancelId, setCancel] = useState("");
  const [taskQrId, setTaskQrId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [verifyResult, setVerifyResult] = useState<{ [id: string]: string }>({});
  useEffect(() => {
    if (staff)
      Promise.all([
        api("/relief-requests?pageSize=100"),
        api("/admin/volunteers"),
      ])
        .then(([r, v]) => {
          setRequests(
            items(r).filter((x) => ["Approved", "Assigned"].includes(x.status)),
          );
          setVolunteers(items(v).filter((x) => x.status === "Approved"));
        })
        .catch((e) => setMessage(e.message));
  }, [api, staff, data.length]);
  async function act(path: string, method = "PUT", body?: any) {
    setBusy(true);
    setMessage("");
    try {
      await api(path, { method, body });
      setCancel("");
      setReason("");
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
            title={staff ? "Điều phối nhiệm vụ" : "Nhiệm vụ của bạn"}
            subtitle="Nhận nhiệm vụ, cập nhật tiến độ và theo dõi hoàn thành."
          />
          {!staff && (
            <Select
              label="Danh sách"
              value={mode}
              onChange={setMode}
              options={[
                { value: "mine", label: "Của tôi" },
                { value: "open", label: "Đang cần người" },
              ]}
            />
          )}
          <Notice text={error || message} error />
          {staff && (
            <Card>
              <Text style={{ fontWeight: "700" }}>
                Phân công tình nguyện viên
              </Text>
              <Select
                label="Yêu cầu đã duyệt"
                value={requestId}
                onChange={setRequest}
                options={requests.map((x) => ({
                  value: String(x.id),
                  label: x.title,
                }))}
              />
              <Select
                label="Tình nguyện viên"
                value={volunteerId}
                onChange={setVolunteer}
                options={volunteers.map((x) => ({
                  value: String(x.id),
                  label: x.fullName,
                }))}
              />
              <Button
                title="Tạo phân công"
                loading={busy}
                disabled={!requestId || !volunteerId}
                onPress={() =>
                  act("/assignments", "POST", {
                    reliefRequestId: requestId,
                    volunteerProfileId: volunteerId,
                  })
                }
              />
            </Card>
          )}
        </View>
      }
      ListEmptyComponent={
        !loading ? <Empty text="Chưa có nhiệm vụ trong danh sách này." /> : null
      }
      renderItem={({ item: x }) => (
        <Card>
          <Badge text={x.status || "Approved"} />
          <Text
            style={{ fontWeight: "800", fontSize: 18, color: palette.navy }}
          >
            {x.title || x.reliefRequestTitle}
          </Text>
          <Text style={styles.muted}>{x.address}</Text>
          {staff && <Text style={styles.muted}>{x.volunteerFullName}</Text>}
          <Text style={styles.muted}>{x.description || x.note}</Text>
          <Button
            title="Mở chỉ đường"
            variant="secondary"
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/maps/dir/?api=1&destination=${x.latitude},${x.longitude}`,
              ).catch(() => setMessage("Không mở được bản đồ."))
            }
          />
          <Button
            title={taskQrId === String(x.id) ? "Ẩn mã QR nhiệm vụ" : "📱 Xem mã QR nhiệm vụ"}
            variant="secondary"
            onPress={() =>
              setTaskQrId((curr) => (curr === String(x.id) ? null : String(x.id)))
            }
          />
          {taskQrId === String(x.id) && (
            <QRCodeView
              value={`RELIEF:TASK:${x.id}:${x.reliefRequestId || x.id}`}
              title={`Mã nhiệm vụ #${x.id}`}
              subtitle="Mã định danh nhiệm vụ cứu trợ"
            />
          )}
          {mode === "open" ? (
            <Button
              title="Đăng ký tham gia"
              loading={busy}
              onPress={() => act(`/relief-requests/${x.id}/join`, "POST")}
            />
          ) : (
            <>
              {["Assigned", "Accepted", "OnTheWay"].includes(x.status) && (
                <Button
                  title={
                    x.status === "Assigned"
                      ? "Nhận nhiệm vụ"
                      : x.status === "Accepted"
                        ? "Bắt đầu di chuyển"
                        : "Xác nhận hoàn thành"
                  }
                  loading={busy}
                  onPress={() =>
                    confirmAction("Cập nhật tiến độ nhiệm vụ?", () =>
                      act(`/assignments/${x.id}/status`, "PUT", {
                        status:
                          x.status === "Assigned"
                            ? "Accepted"
                            : x.status === "Accepted"
                              ? "OnTheWay"
                              : "Completed",
                      }),
                    )
                  }
                />
              )}
              {x.status === "OnTheWay" && (
                <View style={{ gap: 8, marginTop: 4 }}>
                  <Button
                    title={
                      verifyingId === String(x.id)
                        ? "Đóng xác thực QR"
                        : "🔍 Quét / Đối soát mã nhận hàng"
                    }
                    variant="secondary"
                    onPress={() => {
                      setVerifyingId((curr) =>
                        curr === String(x.id) ? null : String(x.id),
                      );
                      setInputCode("");
                    }}
                  />
                  {verifyingId === String(x.id) && (
                    <View
                      style={{
                        gap: 8,
                        padding: 10,
                        backgroundColor: palette.bg,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: palette.border,
                      }}
                    >
                      <Field
                        label="Mã xác nhận từ người nhận"
                        value={inputCode}
                        onChangeText={setInputCode}
                        placeholder={`Ví dụ: REQ-${x.reliefRequestId || x.id} hoặc dán mã QR`}
                      />
                      <Button
                        title="Điền mã mẫu của người nhận"
                        variant="secondary"
                        onPress={() =>
                          setInputCode(`RELIEF:REQ:${x.reliefRequestId || x.id}`)
                        }
                      />
                      <Button
                        title="Kiểm tra đối soát mã"
                        disabled={!inputCode.trim()}
                        onPress={() => {
                          const expectedReqId = String(
                            x.reliefRequestId || x.id,
                          );
                          if (
                            inputCode.includes(expectedReqId) ||
                            inputCode.trim() === expectedReqId
                          ) {
                            setVerifyResult((p) => ({
                              ...p,
                              [String(x.id)]: `✓ Đã khớp mã yêu cầu #${expectedReqId}! Bằng chứng giao nhận hợp lệ.`,
                            }));
                          } else {
                            setVerifyResult((p) => ({
                              ...p,
                              [String(x.id)]: `✕ Mã không khớp với yêu cầu #${expectedReqId}. Vui lòng kiểm tra lại.`,
                            }));
                          }
                        }}
                      />
                      {verifyResult[String(x.id)] && (
                        <Notice
                          text={verifyResult[String(x.id)]}
                          error={verifyResult[String(x.id)].startsWith("✕")}
                        />
                      )}
                    </View>
                  )}
                </View>
              )}{" "}
              {!staff &&
                ["Assigned", "Accepted", "OnTheWay"].includes(x.status) &&
                !x.cancellationRequested && (
                  <Button
                    title="Đề nghị hủy nhiệm vụ"
                    variant="secondary"
                    onPress={() => setCancel(String(x.id))}
                  />
                )}{" "}
              {cancelId === String(x.id) && (
                <>
                  <Field
                    label="Lý do đề nghị hủy"
                    value={reason}
                    onChangeText={setReason}
                  />
                  <Button
                    title="Gửi đề nghị hủy"
                    disabled={!reason.trim()}
                    loading={busy}
                    variant="danger"
                    onPress={() =>
                      act(`/assignments/${x.id}/request-cancellation`, "POST", {
                        reason,
                      })
                    }
                  />
                </>
              )}{" "}
              {x.cancellationRequested && (
                <Notice text={`Đang đề nghị hủy: ${x.cancellationReason}`} />
              )}{" "}
              {staff && x.cancellationRequested && (
                <>
                  <Button
                    title="Duyệt hủy"
                    variant="danger"
                    loading={busy}
                    onPress={() =>
                      act(`/assignments/${x.id}/approve-cancellation`)
                    }
                  />
                  <Button
                    title="Giữ phân công"
                    variant="secondary"
                    loading={busy}
                    onPress={() =>
                      act(`/assignments/${x.id}/reject-cancellation`)
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
