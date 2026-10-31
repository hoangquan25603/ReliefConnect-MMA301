/**
 * Relief Receipt Voucher & Delivery Proof Generator for Web
 */

export interface VoucherData {
  id: string | number;
  title: string;
  recipientName?: string;
  contactPhone?: string;
  address: string;
  region?: string;
  status: string;
  affectedPeople: number | string;
  emergencyLevel: number | string;
  createdAt?: string;
  inventoryIssues?: {
    category: string;
    requestedQuantity: number;
    issuedQuantity: number;
    unit?: string;
    reason?: string;
  }[];
  volunteerName?: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  Food: "Lương thực (Gạo, mì tôm)",
  Water: "Nước sạch",
  Medicine: "Vật tư y tế",
  Blanket: "Chăn & đồ giữ ấm",
  Shelter: "Lều bạt / Chỗ trú",
};

export function formatVoucherText(data: VoucherData): string {
  const dateStr = new Date().toLocaleDateString("vi-VN");
  const timeStr = new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const lines = [
    "══════════════════════════════════════════",
    "       RELIEFCONNECT — BIÊN BẢN CỨU TRỢ    ",
    "       PHIẾU BÀN GIAO VẬT TƯ CỨU TRỢ      ",
    "══════════════════════════════════════════",
    `Mã phiếu: #VOUCHER-${data.id}`,
    `Thời gian lập: ${timeStr} — ${dateStr}`,
    `Trạng thái: ${data.status}`,
    "──────────────────────────────────────────",
    "1. THÔNG TIN NGƯỜI NHẬN CỨU TRỢ:",
    ` • Đại diện / Yêu cầu: ${data.title}`,
    ` • Địa chỉ: ${data.address}${data.region ? `, ${data.region}` : ""}`,
    ` • Số điện thoại: ${data.contactPhone || "Chưa cập nhật"}`,
    ` • Số nhân khẩu: ${data.affectedPeople} người`,
    ` • Mức độ khẩn cấp: ${data.emergencyLevel}/3`,
    "──────────────────────────────────────────",
    "2. CHI TIẾT VẬT TƯ CẤP PHÁT & BÀN GIAO:",
  ];

  if (data.inventoryIssues && data.inventoryIssues.length > 0) {
    data.inventoryIssues.forEach((item, idx) => {
      const name = CATEGORY_NAMES[item.category] || item.category;
      lines.push(
        ` [${idx + 1}] ${name}: Đã cấp ${item.issuedQuantity}/${item.requestedQuantity}`,
      );
      if (item.reason) {
        lines.push(`     Ghi chú: ${item.reason}`);
      }
    });
  } else {
    lines.push(" • Cấp phát theo danh mục phê duyệt của Ban Điều phối");
  }

  lines.push(
    "──────────────────────────────────────────",
    "3. XÁC NHẬN GIAO NHẬN:",
    ` • Tình nguyện viên vận chuyển: ${data.volunteerName || "Đội xung kích ReliefConnect"}`,
    " • Người nhận: [Xác nhận đã nhận đủ hàng]",
    " • Mã đối soát QR: RELIEF:REQ:" + data.id,
    "══════════════════════════════════════════",
    "ReliefConnect Vietnam — Hệ thống điều phối cứu trợ khẩn cấp",
  );

  return lines.join("\n");
}
