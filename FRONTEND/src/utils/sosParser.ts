/**
 * Smart SOS Parser for Vietnamese Disaster Relief Messages
 * Extracts contact, location, headcount, needs, and urgency from unstructured messages.
 */

export interface ParsedSosData {
  title: string;
  description: string;
  address: string;
  region: string;
  contactPhone: string;
  affectedPeople: string;
  emergencyLevel: number; // 1 | 2 | 3
  foodQuantity: number | null;
  waterQuantity: number | null;
  medicineQuantity: number | null;
  blanketQuantity: number | null;
  shelterQuantity: number | null;
  needFood: boolean;
  needWater: boolean;
  needMedicine: boolean;
  needBlanket: boolean;
  needShelter: boolean;
  detectedNeeds: string[];
  summary: string;
}

const REGIONS = [
  "Đà Nẵng",
  "Huế",
  "Quảng Nam",
  "Quảng Trị",
  "Quảng Bình",
  "Hà Tĩnh",
  "Nghệ An",
  "Thanh Hóa",
  "Yên Bái",
  "Lào Cai",
  "Thái Nguyên",
  "Tuyên Quang",
  "Cao Bằng",
  "Phú Thọ",
  "Hà Nội",
  "Hải Phòng",
  "Quảng Ninh",
  "Bình Định",
  "Quảng Ngãi",
  "Khánh Hòa",
  "Gia Lai",
  "Đắk Lắk",
  "Kon Tum",
];

export function parseSosMessage(rawText: string): ParsedSosData {
  const text = (rawText || "").trim();
  const lower = text.toLowerCase();

  // 1. Phone extraction
  let contactPhone = "";
  const phoneRegex = /(?:\+84|0)(?:[\s.-]*\d){9,10}/g;
  const phoneMatches = text.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    const rawMatch = phoneMatches[0];
    const digitsOnly = rawMatch.replace(/\D/g, "");
    if (rawMatch.startsWith("+84") || digitsOnly.startsWith("84")) {
      contactPhone = "0" + digitsOnly.replace(/^84/, "");
    } else {
      contactPhone = digitsOnly;
    }
  }

  // 2. People count extraction
  let affectedPeople = "1";
  const peoplePatterns = [
    /(?:(\d+)\s*(?:người|nhân khẩu|thành viên|khẩu|nguoi))/i,
    /(?:gia đình|nhà|hộ)\s*(?:có\s*)?(\d+)\s*(?:người|khẩu)?/i,
    /(?:khoảng|tầm|hơn)\s*(\d+)\s*(?:người|khẩu)/i,
  ];
  for (const pat of peoplePatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      const val = parseInt(match[1], 10);
      if (val > 0 && val <= 1000) {
        affectedPeople = String(val);
        break;
      }
    }
  }

  // 3. Region and Address detection
  let detectedRegion = "";
  for (const reg of REGIONS) {
    if (lower.includes(reg.toLowerCase())) {
      detectedRegion = reg;
      break;
    }
  }

  let address = "";
  const addressPatterns = [
    /(?:địa chỉ(?:\s*là)?|tại|ở|khu vực|thôn|xã|phường|số nhà|đường)\s*[:]?\s*([^.,;\n]+(?:,\s*[^.,;\n]+){1,3})/i,
    /(?:số\s+\d+[^.,;\n]+)/i,
  ];
  for (const pat of addressPatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      address = match[1].trim();
      break;
    } else if (match && match[0]) {
      address = match[0].trim();
      break;
    }
  }

  if (!address && detectedRegion) {
    address = detectedRegion;
  } else if (address && detectedRegion && !address.toLowerCase().includes(detectedRegion.toLowerCase())) {
    address = `${address}, ${detectedRegion}`;
  }

  // 4. Urgency Level estimation
  let emergencyLevel = 1;
  const highRiskKeywords = [
    "ngập sâu", "nóc nhà", "mái nhà", "sắp chìm", "sạt lở", "cuốn trôi",
    "cô lập hoàn toàn", "nguy kịch", "cấp cứu", "trẻ sơ sinh", "bà bầu",
    "sắp sinh", "nguy hiểm tính mạng", "không còn gì ăn", "kiệt sức",
    "kêu cứu", "gấp lắm", "khẩn cấp"
  ];
  const mediumRiskKeywords = [
    "ngập", "cô lập", "mất điện", "hết thức ăn", "hết nước", "cạn nước",
    "thiếu lương thực", "ngập nước", "mưa to"
  ];

  if (highRiskKeywords.some((kw) => lower.includes(kw))) {
    emergencyLevel = 3;
  } else if (mediumRiskKeywords.some((kw) => lower.includes(kw))) {
    emergencyLevel = 2;
  }

  // 5. Need categories & quantities
  const detectedNeeds: string[] = [];
  let needFood = false;
  let foodQuantity: number | null = null;
  let needWater = false;
  let waterQuantity: number | null = null;
  let needMedicine = false;
  let medicineQuantity: number | null = null;
  let needBlanket = false;
  let blanketQuantity: number | null = null;
  let needShelter = false;
  let shelterQuantity: number | null = null;

  const numPeople = parseInt(affectedPeople, 10) || 1;

  if (
    lower.includes("gạo") || lower.includes("mì") || lower.includes("lương thực") ||
    lower.includes("thực phẩm") || lower.includes("đồ ăn") || lower.includes("bánh mì")
  ) {
    needFood = true;
    detectedNeeds.push("Lương thực");
    const foodMatch = text.match(/(\d+)\s*(?:thùng|thung|gói|goi|kg|ký|suất|phần)\s*(?:mì|gạo|lương thực|đồ ăn)/i);
    foodQuantity = foodMatch && foodMatch[1] ? parseInt(foodMatch[1], 10) : Math.max(5, numPeople * 2);
  }

  if (
    lower.includes("nước") || lower.includes("nước uống") || lower.includes("nước sạch") ||
    lower.includes("bình nước") || lower.includes("chai nước")
  ) {
    needWater = true;
    detectedNeeds.push("Nước sạch");
    const waterMatch = text.match(/(\d+)\s*(?:bình|binh|lốc|loc|chai|thùng|lít|lit)\s*(?:nước)/i);
    waterQuantity = waterMatch && waterMatch[1] ? parseInt(waterMatch[1], 10) : Math.max(6, numPeople * 3);
  }

  if (
    lower.includes("thuốc") || lower.includes("y tế") || lower.includes("sơ cứu") ||
    lower.includes("băng gạc") || lower.includes("dầu gió") || lower.includes("hạ sốt") || lower.includes("cảm cúm")
  ) {
    needMedicine = true;
    detectedNeeds.push("Vật tư y tế");
    const medMatch = text.match(/(\d+)\s*(?:bộ|bo|hộp|hop|gói|vỉ)\s*(?:thuốc|y tế|sơ cứu)/i);
    medicineQuantity = medMatch && medMatch[1] ? parseInt(medMatch[1], 10) : 1;
  }

  if (
    lower.includes("chăn") || lower.includes("mền") || lower.includes("áo ấm") ||
    lower.includes("đồ ấm") || lower.includes("quần áo") || lower.includes("giữ ấm")
  ) {
    needBlanket = true;
    detectedNeeds.push("Chăn & Đồ ấm");
    const blanketMatch = text.match(/(\d+)\s*(?:cái|chiếc|chiec|bộ)\s*(?:chăn|mền|áo ấm)/i);
    blanketQuantity = blanketMatch && blanketMatch[1] ? parseInt(blanketMatch[1], 10) : Math.max(1, Math.ceil(numPeople / 2));
  }

  if (
    lower.includes("lều") || lower.includes("bạt") || lower.includes("chỗ ở") ||
    lower.includes("trú tạm") || lower.includes("sập nhà") || lower.includes("phao") ||
    lower.includes("thuyền") || lower.includes("cano") || lower.includes("mái nhà") || lower.includes("sắp chìm")
  ) {
    needShelter = true;
    detectedNeeds.push("Chỗ ở tạm / Cứu hộ");
    shelterQuantity = 1;
  }

  if (detectedNeeds.length === 0) {
    needFood = true;
    foodQuantity = Math.max(5, numPeople * 2);
    needWater = true;
    waterQuantity = Math.max(6, numPeople * 3);
    detectedNeeds.push("Lương thực", "Nước sạch");
  }

  const locationSummary = address || detectedRegion || "Khu vực khẩn cấp";
  const title = `[SOS] Cứu trợ ${locationSummary} — ${affectedPeople} người`;

  const summaryParts = [];
  if (contactPhone) summaryParts.push(`SĐT: ${contactPhone}`);
  summaryParts.push(`${affectedPeople} người`);
  summaryParts.push(`Mức khẩn cấp ${emergencyLevel}/3`);
  if (detectedNeeds.length > 0) summaryParts.push(`Nhu cầu: ${detectedNeeds.join(", ")}`);

  return {
    title,
    description: text,
    address,
    region: detectedRegion,
    contactPhone,
    affectedPeople,
    emergencyLevel,
    foodQuantity,
    waterQuantity,
    medicineQuantity,
    blanketQuantity,
    shelterQuantity,
    needFood,
    needWater,
    needMedicine,
    needBlanket,
    needShelter,
    detectedNeeds,
    summary: summaryParts.join(" · "),
  };
}
