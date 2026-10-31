// ============================================================
//  Validation helpers dùng chung
// ============================================================

// Chỉ cho phép chữ cái (kể cả có dấu tiếng Việt) và khoảng trắng —
// không cho số và ký tự đặc biệt.
const NAME_REGEX = /^[\p{L}\s]+$/u

export function isValidName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length > 0 && NAME_REGEX.test(trimmed)
}
