export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function items<T = any>(value: any): T[] {
  return Array.isArray(value) ? value : (value?.items ?? []);
}
export function normalizeServer(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Nhập URL đầy đủ, ví dụ http://192.168.1.5:5092");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.hash ||
    url.search
  )
    throw new Error("URL server không hợp lệ.");
  if (!["", "/", "/api", "/api/"].includes(url.pathname))
    throw new Error("Đường dẫn API phải là /api.");
  return `${url.origin}/api`;
}
export async function request<T = any>(
  base: string,
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(base + path, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
    const text = await response.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new ApiError(
        response.status,
        "Máy chủ trả về dữ liệu không đúng định dạng API.",
      );
    }
    if (!response.ok || data?.isSuccess === false)
      throw new ApiError(
        response.status,
        data?.errorMessages?.join(" · ") ||
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(" · ") : "") ||
          (response.status === 401
            ? "Phiên đăng nhập hết hạn."
            : response.status === 403
              ? "Bạn không có quyền thực hiện thao tác này."
              : `Yêu cầu thất bại (${response.status}).`),
      );
    return data && "result" in data ? data.result : data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      0,
      "Không kết nối được máy chủ. Kiểm tra Wi-Fi, địa chỉ server và server đang chạy.",
    );
  } finally {
    clearTimeout(timer);
  }
}
