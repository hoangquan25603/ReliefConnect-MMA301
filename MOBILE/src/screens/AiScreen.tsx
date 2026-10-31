import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useApp } from "../state/AppContext";
import { parseSosMessage } from "../lib/sosParser";
import {
  Button,
  Card,
  Empty,
  Field,
  Heading,
  Notice,
  Screen,
  palette,
  styles,
} from "../components/ui";

type Status = {
  available: boolean;
  provider: string;
  modelVersion: string;
  trainingExamples: number;
  description: string;
};
type Analysis = {
  category: string;
  categoryLabel: string;
  confidence: number;
  probabilities: { category: string; label: string; probability: number }[];
  suggestedItems: {
    itemName: string;
    unit: string;
    availableQuantity: number;
    warehouseName: string;
  }[];
  explanation: string;
  modelVersion: string;
  requiresHumanReview: boolean;
};
const examples = [
  {
    label: "Thiếu nước sạch",
    text: "Khu dân cư bị ngập lụt, nguồn nước bị ô nhiễm. Người dân cần nước uống sạch và nước sinh hoạt.",
  },
  {
    label: "Thiếu lương thực",
    text: "Các hộ dân bị cô lập do mưa lũ, không còn gạo và thực phẩm. Cần mì ăn liền và lương thực cho 50 hộ.",
  },
  {
    label: "Mất chỗ ở",
    text: "Nhà cửa bị sập sau bão, nhiều gia đình không có nơi ở. Cần lều và chỗ trú tạm để tránh mưa.",
  },
];
const percent = (value: number) =>
  `${(Math.max(0, Math.min(1, value)) * 100).toFixed(1)}%`;

export default function AiScreen({ navigation }: any) {
  const { api, user } = useApp();
  const [description, setDescription] = useState("");
  const [analyzedText, setAnalyzedText] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState("");
  async function loadStatus() {
    setStatusLoading(true);
    try {
      setStatus(await api<Status>("/ai/status"));
    } catch {
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }
  useEffect(() => {
    void loadStatus();
  }, [api]);
  async function analyze() {
    if (loading) return;
    const text = description.trim();
    setError("");
    if (text.length < 10 || text.length > 4000) {
      setError("Nhập mô tả từ 10 đến 4.000 ký tự.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      setResult(
        await api<Analysis>("/ai/analyze", { method: "POST", body: { text } }),
      );
      setAnalyzedText(text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <Screen>
      <Heading
        title="Trợ lý AI cứu trợ"
        subtitle="Phân loại nhu cầu từ mô tả và đối chiếu với vật tư đang có trong kho."
      />
      <Card>
        <Text style={local.label}>MÔ HÌNH HỌC MÁY</Text>
        <Text style={local.title}>
          {status
            ? status.available
              ? "Sẵn sàng phân tích"
              : "Mô hình chưa sẵn sàng"
            : statusLoading
              ? "Đang kiểm tra…"
              : "Chưa lấy được trạng thái"}
        </Text>
        {status ? (
          <Text style={styles.muted}>
            {status.provider} · {status.trainingExamples} mẫu huấn luyện ·{" "}
            {status.modelVersion}
          </Text>
        ) : (
          <Button
            title="Kiểm tra lại mô hình"
            variant="secondary"
            onPress={loadStatus}
            loading={statusLoading}
          />
        )}
        <Text style={styles.muted}>
          Phân tích chạy trên máy chủ của dự án, không gửi nội dung đến dịch vụ
          AI bên ngoài.
        </Text>
      </Card>
      <Card>
        <Field
          label="Mô tả nhu cầu cứu trợ"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={4000}
          editable={!loading}
          placeholder="Ví dụ: 50 hộ dân bị ngập, thiếu nước uống sạch…"
        />
        <Text style={styles.muted}>{description.length}/4.000 ký tự</Text>
        <Text style={local.label}>THỬ MỘT VÍ DỤ</Text>
        {examples.map((example) => (
          <Button
            key={example.label}
            title={example.label}
            variant="secondary"
            disabled={loading}
            onPress={() => setDescription(example.text)}
          />
        ))}
        <Button
          title="Phân tích bằng AI"
          onPress={analyze}
          loading={loading}
          disabled={
            description.trim().length < 10 || status?.available === false
          }
        />
      </Card>
      <Notice text={error} error />
      {result ? (
        <>
          <Heading title="Kết quả phân tích" />
          {analyzedText !== description.trim() && (
            <Notice
              text="Mô tả đã thay đổi. Phân tích lại để cập nhật kết quả."
              error
            />
          )}
          <Card>
            <Text style={local.label}>NHÓM NHU CẦU CHÍNH</Text>
            <View style={local.row}>
              <Text style={local.result}>{result.categoryLabel}</Text>
              <Text style={local.score}>{percent(result.confidence)}</Text>
            </View>
            <Text style={styles.muted}>{result.explanation}</Text>
            <Text style={local.label}>ĐIỂM MÔ HÌNH THEO NHÓM</Text>
            {[...(result.probabilities ?? [])]
              .sort((a, b) => b.probability - a.probability)
              .map((p) => (
                <View key={p.category} style={{ gap: 6 }}>
                  <View style={local.row}>
                    <Text style={styles.muted}>{p.label}</Text>
                    <Text style={local.smallScore}>
                      {percent(p.probability)}
                    </Text>
                  </View>
                  <View
                    accessibilityLabel={`${p.label}: ${percent(p.probability)}`}
                    style={local.track}
                  >
                    <View
                      style={[
                        local.bar,
                        { width: percent(p.probability) as `${number}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
          </Card>
          <Notice text="Cần người phụ trách xác nhận. Điểm mô hình không phải tỷ lệ chính xác đã kiểm định. Mô tả có nhiều nhu cầu có thể chỉ được gợi ý một nhóm chính; hãy kiểm tra lại trước khi điều phối." />
          {["Requester", "Admin"].includes(user?.role || "") && (
            <Button
              title="⚡ Tạo yêu cầu cứu trợ từ nội dung này"
              onPress={() => {
                const parsed = parseSosMessage(description);
                navigation.navigate("CreateRequest", {
                  prefill: {
                    title: parsed.title,
                    description: parsed.description,
                    address: parsed.address,
                    region: parsed.region,
                    contactPhone: parsed.contactPhone,
                    affectedPeople: parsed.affectedPeople,
                    emergencyLevel: parsed.emergencyLevel,
                    foodQuantity: parsed.foodQuantity,
                    waterQuantity: parsed.waterQuantity,
                    medicineQuantity: parsed.medicineQuantity,
                    blanketQuantity: parsed.blanketQuantity,
                    shelterQuantity: parsed.shelterQuantity,
                  },
                  summary: parsed.summary,
                });
              }}
            />
          )}
          <Heading
            title="Vật tư phù hợp"
            subtitle="Tồn kho tại thời điểm phân tích; có thể thay đổi khi phát sinh giao dịch."
          />
          {result.suggestedItems?.length ? (
            result.suggestedItems.map((item, index) => (
              <Card key={`${item.warehouseName}-${index}`}>
                <Text style={local.title}>{item.itemName}</Text>
                <Text style={styles.muted}>{item.warehouseName}</Text>
                <Text style={local.available}>
                  {item.availableQuantity.toLocaleString("vi-VN")} {item.unit}
                </Text>
              </Card>
            ))
          ) : (
            <Empty text="Chưa tìm thấy vật tư sẵn có trong nhóm này. Kiểm tra kho và nhu cầu bổ sung trước khi phân công." />
          )}
        </>
      ) : !loading ? (
        <Empty text="Nhập mô tả hoặc chọn ví dụ để xem kết quả phân tích." />
      ) : null}
      <Card>
        <Text style={local.title}>AI hoạt động như thế nào?</Text>
        <Text style={styles.muted}>
          {status?.description ||
            "Mô hình Naive Bayes học từ các mô tả cứu trợ tiếng Việt có gán nhãn để phân loại nhu cầu."}
        </Text>
        <Text style={styles.muted}>
          AI không tự xuất kho, tạo yêu cầu hay quyết định mức độ khẩn cấp. Đây
          là mô hình phục vụ dự án học tập, cần mở rộng dữ liệu và đánh giá trên
          tập thực tế trước khi dùng cho vận hành cứu trợ.
        </Text>
      </Card>
    </Screen>
  );
}
const local = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: palette.muted,
    letterSpacing: 1,
  },
  title: { fontSize: 17, fontWeight: "800", color: palette.navy },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  result: { fontSize: 25, fontWeight: "800", color: palette.navy, flex: 1 },
  score: { fontSize: 23, fontWeight: "800", color: palette.green },
  smallScore: { fontSize: 13, fontWeight: "700", color: palette.navy },
  track: {
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.bg,
    overflow: "hidden",
  },
  bar: { height: 7, borderRadius: 4, backgroundColor: palette.green },
  available: { fontSize: 20, fontWeight: "800", color: palette.green },
});
