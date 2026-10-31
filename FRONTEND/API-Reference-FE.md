# API Reference cho Frontend — DisasterRelief

> Bản người-đọc-được, chuẩn theo API **đang sống thật** tại `https://disasterrelief-api.runasp.net` (kiểm chứng 2026-07-13). Bản đặc tả máy-đọc-được đầy đủ schema từng field: `docs/swagger.json` — mở bằng https://editor.swagger.io (dán nội dung hoặc kéo-thả file), server mặc định đã trỏ sẵn Production nên bấm "Try it out" gọi được luôn.
>
> ⚠️ **Lưu ý về Swagger schema**: `ApiResponseWrapperFilter` bọc response ở tầng runtime (result filter), Swashbuckle không nhìn thấy việc bọc này khi sinh schema tĩnh — vì vậy trong `swagger.json`/Swagger UI, schema response của mỗi endpoint chỉ hiện đúng phần **bên trong** `result` (vd `LoginResponse`), không hiện bọc `ApiResponse<T>` ra ngoài. Response THẬT khi gọi luôn có đủ 4 field `statusCode/isSuccess/errorMessages/result` như mô tả ở mục 4.

---

## 1. Base URL

**Base URL chính thức (dùng cho mọi ví dụ trong tài liệu này): `https://disasterrelief-api.runasp.net`**

- HTTPS đã bật (Let's Encrypt), **force redirect ON** — gọi nhầm `http://` sẽ nhận `307 Temporary Redirect` sang `https://` (tốn thêm 1 round-trip). FE nên cấu hình thẳng `https://` trong biến môi trường/config, không dùng `http://` hay hardcode trong code.
- Swagger UI **tắt hoàn toàn** ở Production (thiết kế bảo mật, xem `Program.cs` — chỉ bật khi `IsDevelopment()`). Dùng `docs/swagger.json` thay thế.

**Chạy BE local nếu cần** (debug, tích hợp tính năng chưa deploy): `http://localhost:<port>` (mặc định `5092`, xem `launchSettings.json`) — CORS Development đang mở `AllowAnyOrigin` nên FE chạy port bất kỳ đều gọi được, không cần khai báo origin.

---

## 2. Xác thực

1. `POST /api/auth/login` (hoặc `/api/auth/register`) → nhận `accessToken` + `refreshToken`.
2. Gắn header sau vào **mọi** request cần đăng nhập:
   ```
   Authorization: Bearer <accessToken>
   ```
3. `accessToken` hết hạn sau **60 phút**. Khi nhận `401`, gọi:
   ```
   POST https://disasterrelief-api.runasp.net/api/auth/refresh-token
   Body: { "refreshToken": "<refreshToken đang có>" }
   ```
   lấy cặp token mới rồi gọi lại request vừa lỗi.
4. `refreshToken` hết hạn sau **7 ngày** — hết hạn thì phải `login` lại từ đầu.
5. Đổi role (Admin thao tác `PUT /api/admin/users/{id}/role`) **không tự cập nhật** JWT đang có hiệu lực của user bị đổi — user đó phải `login`/`refresh-token` lại mới nhận role mới.

### Tài khoản seed để FE test

> ⚠️ Dữ liệu demo, chỉ dùng để test tích hợp — không phải tài khoản thật.

| Email | Password | Role | Ghi chú |
|---|---|---|---|
| `admin@relief.vn` | `Admin@123` | Admin | Tài khoản duy nhất được seed sẵn khi DB khởi tạo lần đầu. |

**Chưa có seed sẵn cho Requester/Volunteer/WarehouseManager/Organization.** Cách tự tạo:
1. `POST /api/auth/register` → tài khoản mới luôn nhận role **Requester** mặc định.
2. Muốn Volunteer/WarehouseManager/Organization: đăng nhập Admin, gọi `PUT /api/admin/users/{id}/role` với `{"roleName": "Volunteer"}` (hoặc tên role khác) — rồi `login` lại tài khoản đó để lấy JWT role mới.
3. Riêng Volunteer: sau khi có role, gọi thêm `POST /api/volunteers/profile` (hồ sơ vào `Pending`), Admin duyệt qua `PUT /api/admin/volunteers/{id}/approve` — chỉ hồ sơ `Approved` mới nhận Assignment / xuất hiện trong `suggested-volunteers`.

---

## 3. Format `ApiResponse` chung

Mọi response (trừ 3 API tải file Excel ở mục Reports, trả file `.xlsx` thô) đều bọc trong:

```typescript
interface ApiResponse<T> {
  statusCode: number;       // 200/201/400/401/403/404/409/500...
  isSuccess: boolean;
  errorMessages: string[];  // rỗng [] nếu thành công
  result: T | null;         // null nếu lỗi
}
```

### Ví dụ thành công — THẬT, gọi trực tiếp Production 2026-07-13

`POST https://disasterrelief-api.runasp.net/api/auth/login`

```json
{
  "statusCode": 200,
  "isSuccess": true,
  "errorMessages": [],
  "result": {
    "userId": "2e2e12d0-eaf1-44a7-a8cf-08dedfe3aa11",
    "fullName": "System Administrator",
    "email": "admin@relief.vn",
    "role": "Admin",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "ExZrCIKzovqq7XAUmt7wZp5...",
    "expiresAt": "2026-07-13T03:10:44.77Z"
  }
}
```

### Ví dụ lỗi validation — THẬT, gọi trực tiếp Production 2026-07-13

`POST https://disasterrelief-api.runasp.net/api/auth/login` với email/password sai định dạng:

```json
{
  "statusCode": 400,
  "isSuccess": false,
  "errorMessages": [
    "Email: 'Email' is not a valid email address.",
    "Password: The length of 'Password' must be at least 6 characters. You entered 2 characters."
  ],
  "result": null
}
```

### ⚠️ Ngoại lệ: 401/403 có thể KHÔNG có body `ApiResponse`

Nếu bị chặn ở tầng `[Authorize]`/Policy — **trước khi vào tới Controller** (vd token role `Volunteer` gọi endpoint `[AdminOnly]`) — response trả **body rỗng**. Chỉ lỗi phát sinh **bên trong Handler** mới có body `ApiResponse` đầy đủ. FE nên kiểm tra `response.status` trước khi `JSON.parse()`.

Mọi response đều có header `X-Correlation-Id` — log lại khi cần báo lỗi cho BE tra log.

---

## 4. Danh mục endpoint

> Cột "Role" ghi role **thực sự vượt qua được** permission check trong code (đọc trực tiếp Controller attribute + `PermissionHelper`/`RolePermissions` + logic chủ sở hữu nếu có) — không chép từ tài liệu kế hoạch. Đã kiểm chứng 5 endpoint đọc (đánh dấu ✅ ở cột Mô tả) gọi thật trên Production 2026-07-13, xem mục 7.

### Auth (`api/auth`)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| POST | `/api/auth/login` | Không cần đăng nhập | Đăng nhập, nhận `accessToken`/`refreshToken` |
| POST | `/api/auth/register` | Không cần đăng nhập | Đăng ký tài khoản mới, role mặc định `Requester` |
| POST | `/api/auth/refresh-token` | Không cần đăng nhập | Lấy `accessToken` mới bằng `refreshToken` còn hạn |
| POST | `/api/auth/logout` | Không cần đăng nhập | Thu hồi 1 `refreshToken` |
| GET | `/api/auth/me` | Mọi role đã đăng nhập | Lấy thông tin user hiện tại từ JWT |
| POST | `/api/auth/change-password` | Mọi role đã đăng nhập | Đổi mật khẩu tài khoản hiện tại |

### Volunteer — tự quản lý (`api/volunteers`)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/api/volunteers/me` | Requester, Volunteer | Lấy hồ sơ Volunteer của chính mình |
| POST | `/api/volunteers/profile` | Requester, Volunteer | Tạo hồ sơ Volunteer (trạng thái `Pending`) |
| PUT | `/api/volunteers/profile` | Requester, Volunteer | Cập nhật hồ sơ Volunteer của chính mình |
| POST | `/api/volunteers/skills` | Requester, Volunteer | Thêm kỹ năng vào hồ sơ của chính mình |
| DELETE | `/api/volunteers/skills/{skillId}` | Requester, Volunteer | Xoá 1 kỹ năng khỏi hồ sơ của chính mình |

### Admin — Volunteer (`api/admin/volunteers`)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/api/admin/volunteers` | Admin | Danh sách toàn bộ hồ sơ Volunteer |
| GET | `/api/admin/volunteers/{id}` | Admin | Chi tiết 1 hồ sơ Volunteer |
| PUT | `/api/admin/volunteers/{id}/approve` | Admin | Duyệt hồ sơ (đồng thời đổi role User sang `Volunteer`) |
| PUT | `/api/admin/volunteers/{id}/reject` | Admin | Từ chối hồ sơ Volunteer |

### Skills (`api/skills`)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/api/skills` | Không cần đăng nhập (public) | ✅ Danh sách Skill (đã lọc Skill xoá mềm) |
| POST | `/api/skills` | Admin | Tạo Skill mới |
| PUT | `/api/skills/{id}` | Admin | Cập nhật tên/mô tả Skill |
| DELETE | `/api/skills/{id}` | Admin | Xoá mềm Skill |

### Warehouse (`api/warehouses`)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/api/warehouses` | Mọi role đã đăng nhập | ✅ Danh sách kho (phân trang) |
| GET | `/api/warehouses/{id}` | Mọi role đã đăng nhập | Chi tiết 1 kho |
| POST | `/api/warehouses` | Admin, WarehouseManager | Tạo kho mới |
| PUT | `/api/warehouses/{id}` | Admin, WarehouseManager | Cập nhật thông tin kho |
| DELETE | `/api/warehouses/{id}` | Admin, WarehouseManager | Ngưng hoạt động kho (`IsActive=false`) |

### Admin — User (`api/admin/users`)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/api/admin/users` | Admin | Danh sách User, lọc theo role, phân trang |
| GET | `/api/admin/users/{id}` | Admin | Chi tiết 1 User |
| PUT | `/api/admin/users/{id}/activate` | Admin | Mở khoá tài khoản |
| PUT | `/api/admin/users/{id}/deactivate` | Admin | Khoá tài khoản (không tự khoá chính mình) |
| PUT | `/api/admin/users/{id}/role` | Admin | Đổi role User (không tự đổi role chính mình) |

### Admin — Role (`api/admin/roles`)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/api/admin/roles` | Admin | ✅ Danh sách 5 Role hệ thống — hỗ trợ FE dựng dropdown |

### ReliefRequest (`api/relief-requests`)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| POST | `/api/relief-requests` | Requester | Tạo yêu cầu cứu trợ mới (trạng thái `Pending`) |
| GET | `/api/relief-requests` | Mọi role đã đăng nhập | Danh sách yêu cầu — Admin xem tất cả, role khác chỉ thấy do chính mình tạo |
| GET | `/api/relief-requests/{id}` | Chủ sở hữu hoặc Admin | Chi tiết 1 yêu cầu |
| PUT | `/api/relief-requests/{id}/status` | Chủ sở hữu (chỉ `Cancelled`) hoặc Admin (mọi bước) | Đổi trạng thái theo state machine |
| GET | `/api/relief-requests/{id}/suggested-volunteers` | Admin | Gợi ý Volunteer theo khoảng cách cho yêu cầu đang `Approved` |

### Assignment (`api/assignments`)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| POST | `/api/assignments` | Admin | Phân công tay 1 Volunteer cho 1 ReliefRequest đang `Approved` |
| GET | `/api/assignments` | Admin, Volunteer | ✅ Danh sách phân công — Admin xem tất cả, Volunteer chỉ thấy của mình |
| GET | `/api/assignments/pending-cancellations` | Admin | Danh sách đơn xin huỷ đang chờ duyệt |
| GET | `/api/assignments/{id}` | Admin, hoặc Volunteer chủ sở hữu | Chi tiết 1 phân công |
| PUT | `/api/assignments/{id}/status` | Volunteer chủ sở hữu | Cập nhật tiến độ (`Assigned→Accepted→OnTheWay→Completed`) |
| POST | `/api/assignments/{id}/request-cancellation` | Volunteer chủ sở hữu | Gửi đơn xin huỷ (bắt buộc `reason`) |
| PUT | `/api/assignments/{id}/approve-cancellation` | Admin | Duyệt đơn xin huỷ → `Cancelled`, request quay về `Approved` |
| PUT | `/api/assignments/{id}/reject-cancellation` | Admin | Từ chối đơn xin huỷ |
| PUT | `/api/assignments/{id}/cancel` | Admin | Admin huỷ trực tiếp (bắt buộc `reason`) |

### Inventory (`api/inventory-items`)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/api/inventory-items` | Mọi role đã đăng nhập | Danh sách vật tư |
| GET | `/api/inventory-items/{id}` | Mọi role đã đăng nhập | Chi tiết 1 vật tư |
| POST | `/api/inventory-items` | Admin, WarehouseManager | Tạo vật tư mới (tồn khởi tạo = 0) |
| PUT | `/api/inventory-items/{id}` | Admin, WarehouseManager | Sửa thông tin mô tả (không sửa tồn trực tiếp) |
| POST | `/api/inventory-items/{id}/stock-in` | Admin, WarehouseManager | Nhập kho, cộng tồn |
| POST | `/api/inventory-items/{id}/stock-out` | Admin, WarehouseManager | Xuất kho, trừ tồn (chặn vượt tồn hiện có) |
| GET | `/api/inventory-items/{id}/transactions` | Mọi role đã đăng nhập | Lịch sử nhập/xuất |

### Notification (`api/notifications`)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/api/notifications` | Mọi role đã đăng nhập | Danh sách thông báo của chính mình |
| GET | `/api/notifications/unread-count` | Mọi role đã đăng nhập | Số thông báo chưa đọc |
| PUT | `/api/notifications/{id}/read` | Mọi role đã đăng nhập | Đánh dấu 1 thông báo đã đọc |
| PUT | `/api/notifications/read-all` | Mọi role đã đăng nhập | Đánh dấu tất cả đã đọc |

### Dashboard (`api/dashboard`)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/api/dashboard/summary` | Admin | ✅ Số liệu tổng quan theo trạng thái/role |
| GET | `/api/dashboard/requests-over-time` | Admin | Số ReliefRequest theo thời gian |
| GET | `/api/dashboard/map` | Admin | Toạ độ ReliefRequest/Warehouse để vẽ bản đồ |

### Reports (`api/reports`)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/api/reports/relief-requests/excel` | Admin | Tải Excel danh sách ReliefRequest |
| GET | `/api/reports/assignments/excel` | Admin | Tải Excel danh sách Assignment |
| GET | `/api/reports/inventory/excel` | Admin | Tải Excel tồn kho + lịch sử giao dịch (2 sheet) |

> 3 API này trả **file `.xlsx` thô**, KHÔNG bọc `ApiResponse` — FE xử lý như tải file (blob).

### Admin — AuditLog (`api/admin/audit-logs`)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/api/admin/audit-logs` | Admin | ✅ Lịch sử hành động hệ thống, lọc `entityName`/`userId`/`fromDate`/`toDate` |

**Tổng**: 62 endpoint (method+path) trên 52 route path — khớp `docs/swagger.json`. Không có `api/test` (đã gỡ khỏi codebase).

---

## 5. Ví dụ 5 endpoint FE dùng nhiều nhất

### 5.1 Login

```
POST https://disasterrelief-api.runasp.net/api/auth/login
Content-Type: application/json

{ "email": "admin@relief.vn", "password": "Admin@123" }
```
→ Response THẬT (rút gọn token), xem mục 3.

### 5.2 Tạo yêu cầu cứu trợ (ví dụ minh hoạ — KHÔNG gọi thật lên Production để tránh tạo dữ liệu)

```
POST https://disasterrelief-api.runasp.net/api/relief-requests
Authorization: Bearer <accessToken của Requester>
Content-Type: application/json

{
  "title": "Cần lương thực khẩn cấp",
  "description": "Khu vực ngập lụt, 20 hộ dân thiếu lương thực",
  "address": "Xã X, Huyện Y",
  "latitude": 21.03,
  "longitude": 105.85
}
```
```json
{
  "statusCode": 201,
  "isSuccess": true,
  "errorMessages": [],
  "result": { "id": "<guid>", "message": "Tạo yêu cầu cứu trợ thành công." }
}
```

### 5.3 Danh sách Assignment

```
GET https://disasterrelief-api.runasp.net/api/assignments?pageSize=2
Authorization: Bearer <accessToken>
```
→ Response THẬT trên Production hiện tại (chưa có Assignment nào được tạo, minh hoạ đúng khung phân trang):
```json
{
  "statusCode": 200,
  "isSuccess": true,
  "errorMessages": [],
  "result": { "items": [], "pageNumber": 1, "pageSize": 2, "totalCount": 0, "totalPages": 0 }
}
```
Khi có dữ liệu, mỗi phần tử trong `items` gồm: `id, reliefRequestId, reliefRequestTitle, volunteerProfileId, volunteerFullName, assignedByUserId, assignedAt, acceptedAt, completedAt, cancelledAt, status, note, cancellationRequested, cancellationReason, cancellationRequestedAt` (đầy đủ trong `docs/swagger.json`).

### 5.4 Gửi đơn xin huỷ (ví dụ minh hoạ — KHÔNG gọi thật lên Production)

```
POST https://disasterrelief-api.runasp.net/api/assignments/{id}/request-cancellation
Authorization: Bearer <accessToken của Volunteer chủ sở hữu>
Content-Type: application/json

{ "reason": "Bị ốm đột xuất, không thể tiếp tục nhiệm vụ" }
```
```json
{
  "statusCode": 200,
  "isSuccess": true,
  "errorMessages": [],
  "result": { "id": "<guid>", "message": "Đã gửi đơn xin huỷ, chờ Admin duyệt." }
}
```

### 5.5 Danh sách Notification

```
GET https://disasterrelief-api.runasp.net/api/notifications?pageSize=2
Authorization: Bearer <accessToken>
```
→ Response THẬT trên Production hiện tại (chưa có thông báo nào — tài khoản Admin chưa nhận sự kiện gì):
```json
{
  "statusCode": 200,
  "isSuccess": true,
  "errorMessages": [],
  "result": { "items": [], "pageNumber": 1, "pageSize": 2, "totalCount": 0, "totalPages": 0 }
}
```
Mỗi phần tử `items` khi có dữ liệu: `id, title, content, type, isRead, readAt, createdAt`.

---

## 6. SignalR — Realtime Notification

- URL hub: `wss://disasterrelief-api.runasp.net/hubs/notifications` (SignalR tự nâng cấp từ `https://` sang WebSocket, dùng URL `https://` khi khởi tạo connection, không cần tự đổi `wss://` thủ công).
- JWT truyền qua query string `accessTokenFactory` (không dùng header `Authorization` — giới hạn của WebSocket).
- Event lắng nghe: `ReceiveNotification` (đích danh user hiện tại), `NewReliefRequest` (broadcast Admin khi có yêu cầu mới), `NewCancellationRequest` (broadcast Admin khi có đơn xin huỷ mới).

```javascript
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
  .withUrl("https://disasterrelief-api.runasp.net/hubs/notifications", {
    accessTokenFactory: () => accessToken, // biến chứa JWT hiện tại
  })
  .withAutomaticReconnect()
  .build();

connection.on("ReceiveNotification", (payload) => console.log(payload));
connection.on("NewCancellationRequest", (payload) => console.log(payload));
connection.on("NewReliefRequest", (payload) => console.log(payload));

await connection.start();
```

Đã kiểm chứng kết nối thành công qua `wss://` trên Production 2026-07-12/13 (WebSocket transport).

---

## 7. Kiểm chứng tài liệu trên Production (2026-07-13)

5 endpoint đọc, gọi thật qua `https://disasterrelief-api.runasp.net`, xác nhận path/method/response khớp bảng ở mục 4 (đánh dấu ✅):

| Endpoint | Kết quả |
|---|---|
| `GET /api/skills` | ✅ `200`, trả đúng 9 Skill đã seed |
| `GET /api/warehouses` | ✅ `200`, trả đúng 3 Warehouse đã seed, đúng khung phân trang |
| `GET /api/admin/roles` | ✅ `200`, trả đúng 5 Role |
| `GET /api/dashboard/summary` | ✅ `200`, số liệu khớp trạng thái dữ liệu Production hiện có |
| `GET /api/admin/audit-logs` | ✅ `200`, đúng khung phân trang |

Không có request nào tạo/sửa/xoá dữ liệu trong quá trình kiểm chứng (chỉ `GET` và 1 lần `login`).

---

## 8. Bảng lỗi thường gặp

| Tình huống | Biểu hiện | Cách xử lý |
|---|---|---|
| **CORS bị chặn** | Request không tới được server, lỗi hiện trong console trình duyệt (không phải response từ API) | Domain FE chưa nằm trong `Cors:AllowedOrigins` của Production — báo BE bổ sung. Development thì `AllowAnyOrigin`, không gặp lỗi này. |
| **401 do thiếu Bearer** | `401`, có thể **không có body** | Chưa gắn header `Authorization: Bearer <token>`, hoặc token rỗng/sai định dạng |
| **401 do token hết hạn** | `401`, có thể không có body | `accessToken` quá 60 phút — gọi `refresh-token` lấy token mới rồi thử lại |
| **403 sai role** | `403`, có thể **không có body** nếu bị chặn ở tầng Policy (vd Volunteer gọi endpoint `[AdminOnly]`); có body `ApiResponse` nếu bị chặn trong Handler (permission-based check) | Kiểm tra lại role tài khoản đang dùng có khớp cột "Role" ở mục 4 không |
| **409 Conflict khi thao tác kho** | `409`, body `ApiResponse` có `errorMessages` nhắc "vừa được người khác cập nhật" | 2 người cùng `stock-in`/`stock-out`/sửa 1 `InventoryItem` cùng lúc (concurrency `RowVersion`) — tải lại dữ liệu mới nhất rồi thử lại |
| **Request đầu tiên chậm/timeout** | Request đầu sau 1 thời gian không ai gọi bị treo vài giây rồi mới phản hồi | Hosting free tier có "cold start" — instance ngủ khi không có traffic, request đầu đánh thức lại instance. Không phải lỗi API, FE nên set timeout đủ dài (vd 30s) cho lần gọi đầu hoặc hiện loading state, các request sau sẽ nhanh bình thường |
| **Body rỗng nhưng status vẫn 401/403** | `JSON.parse()` ném lỗi phía FE | Luôn kiểm tra `response.status` + `Content-Length`/`response.text()` trước khi parse JSON (xem mục 3) |
