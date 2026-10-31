// ============================================================
//  Toạ độ trung tâm 63 tỉnh/thành Việt Nam (hardcode, chuẩn trước đợt sáp
//  nhập 2025) — CHỈ dùng để vẽ khu vực gần đúng trên bản đồ (vd. cho "Nhiệm
//  vụ mở" bên Volunteer, khi chưa nhận việc thì KHÔNG được lộ toạ độ nhà dân
//  cụ thể, chỉ nên biết "việc ở khu vực nào"). Không cần chính xác tuyệt đối,
//  không phải toạ độ hành chính chính thức — chỉ mang tính minh hoạ.
// ============================================================

export const VN_PROVINCE_CENTERS: Record<string, [number, number]> = {
  'ha noi': [21.0285, 105.8542],
  'ho chi minh': [10.8231, 106.6297],
  'sai gon': [10.8231, 106.6297],
  'tp hcm': [10.8231, 106.6297],
  'hai phong': [20.8449, 106.6881],
  'da nang': [16.0544, 108.2022],
  'can tho': [10.0452, 105.7469],
  'an giang': [10.5216, 105.1259],
  'ba ria vung tau': [10.5417, 107.2429],
  'vung tau': [10.5417, 107.2429],
  'bac giang': [21.2731, 106.1946],
  'bac kan': [22.1477, 105.8348],
  'bac lieu': [9.2941, 105.7278],
  'bac ninh': [21.1861, 106.0763],
  'ben tre': [10.2433, 106.3756],
  'binh dinh': [13.7757, 109.2237],
  'binh duong': [11.1667, 106.6667],
  'binh phuoc': [11.7512, 106.7235],
  'binh thuan': [10.9333, 108.1],
  'ca mau': [9.1769, 105.1524],
  'cao bang': [22.6667, 106.25],
  'dak lak': [12.6667, 108.05],
  'dak nong': [12.0045, 107.6877],
  'dien bien': [21.3833, 103.0167],
  'dong nai': [10.9574, 106.8426],
  'bien hoa': [10.9574, 106.8426],
  'dong thap': [10.4938, 105.6881],
  'gia lai': [13.9833, 108.0],
  'pleiku': [13.9833, 108.0],
  'ha giang': [22.8333, 104.9833],
  'ha nam': [20.5835, 105.923],
  'ha tinh': [18.3428, 105.9057],
  'hai duong': [20.9373, 106.3145],
  'hau giang': [9.7579, 105.6413],
  'hoa binh': [20.8171, 105.3376],
  'hung yen': [20.6464, 106.0512],
  'khanh hoa': [12.2388, 109.1967],
  'nha trang': [12.2388, 109.1967],
  'kien giang': [10.0125, 105.0808],
  'rach gia': [10.0125, 105.0808],
  'kon tum': [14.3545, 108.0076],
  'lai chau': [22.3964, 103.4703],
  'lam dong': [11.9404, 108.4583],
  'da lat': [11.9404, 108.4583],
  'lang son': [21.8537, 106.7614],
  'lao cai': [22.4833, 103.95],
  'long an': [10.5333, 106.4167],
  'nam dinh': [20.42, 106.1683],
  'nghe an': [18.679, 105.6816],
  'vinh': [18.679, 105.6816],
  'ninh binh': [20.2506, 105.9744],
  'ninh thuan': [11.5645, 108.9899],
  'phan rang': [11.5645, 108.9899],
  'phu tho': [21.3227, 105.4023],
  'viet tri': [21.3227, 105.4023],
  'phu yen': [13.0882, 109.0929],
  'quang binh': [17.4684, 106.6223],
  'dong hoi': [17.4684, 106.6223],
  'quang nam': [15.5736, 108.474],
  'tam ky': [15.5736, 108.474],
  'quang ngai': [15.1214, 108.8044],
  'quang ninh': [20.95, 107.0833],
  'ha long': [20.95, 107.0833],
  'quang tri': [16.75, 107.2],
  'dong ha': [16.75, 107.2],
  'soc trang': [9.6025, 105.9739],
  'son la': [21.3256, 103.9188],
  'tay ninh': [11.31, 106.0989],
  'thai binh': [20.4463, 106.3365],
  'thai nguyen': [21.5928, 105.8442],
  'thanh hoa': [19.8067, 105.7764],
  'thua thien hue': [16.4637, 107.5909],
  'hue': [16.4637, 107.5909],
  'tien giang': [10.36, 106.36],
  'my tho': [10.36, 106.36],
  'tra vinh': [9.9347, 106.3453],
  'tuyen quang': [21.8233, 105.2144],
  'vinh long': [10.2537, 105.9722],
  'vinh phuc': [21.3089, 105.6049],
  'vinh yen': [21.3089, 105.6049],
  'yen bai': [21.7229, 104.9111],
}

// Bỏ dấu bằng cách lọc theo mã Unicode (tránh literal regex chứa ký tự dấu
// tổ hợp trong source file, dễ bị lưu sai encoding) — sau NFD, mỗi dấu tách
// thành 1 ký tự combining mark riêng trong khoảng 0x0300-0x036F.
function stripDiacritics(input: string): string {
  let out = ''
  for (const ch of input.normalize('NFD')) {
    const code = ch.codePointAt(0) ?? 0
    if (code >= 0x0300 && code <= 0x036f) continue
    out += ch
  }
  return out
}

function normalize(s: string): string {
  return stripDiacritics(s)
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Tra toạ độ trung tâm tỉnh/thành gần đúng nhất theo tên tự do (vd "Tỉnh Thanh Hóa",
 * "TP. Hồ Chí Minh"...). Trả về null nếu không khớp được tên nào — lúc đó không nên
 * đoán bừa một khu vực, để nơi gọi tự quyết định hiển thị gì (thường là ẩn bản đồ).
 */
export function resolveProvinceCenter(region: string | null | undefined): [number, number] | null {
  if (!region) return null
  const norm = normalize(region)
  if (!norm) return null

  if (VN_PROVINCE_CENTERS[norm]) return VN_PROVINCE_CENTERS[norm]

  for (const [name, coords] of Object.entries(VN_PROVINCE_CENTERS)) {
    if (norm.includes(name)) return coords
  }

  return null
}
