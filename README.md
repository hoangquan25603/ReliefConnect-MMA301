# ReliefConnect — MMA301

Hệ thống quản lý cứu trợ gồm web Vue 3, ứng dụng React Native / Expo và API ASP.NET Core .NET 10. Web và mobile dùng chung API, dữ liệu được lưu bằng SQLite.

## Cấu trúc thư mục

```text
ReliefConnect-MMA301/
├── FRONTEND/                    # Web Vue 3 + TypeScript + Vite
│   └── src/
│       ├── components/          # Thành phần giao diện dùng chung
│       ├── views/               # Các trang web
│       ├── features/            # Chức năng theo nghiệp vụ
│       ├── router/              # Điều hướng trang
│       ├── stores/              # Trạng thái ứng dụng (Pinia)
│       ├── lib/                 # API client và tiện ích
│       └── config/              # Cấu hình kết nối API
├── MOBILE/                      # Ứng dụng React Native / Expo
├── DisasterReliefSystem/
│   └── backend/
│       ├── DisasterReliefSystem.API/
│       │   ├── Controllers/     # Các endpoint HTTP
│       │   ├── Models/          # Mô hình dữ liệu
│       │   ├── Data/            # Database context và dữ liệu khởi tạo
│       │   ├── Repositories/    # Truy cập dữ liệu
│       │   ├── Infrastructure/  # Hạ tầng và xử lý dùng chung
│       │   └── AI/              # Phân loại nhu cầu cứu trợ
│       └── tests/               # Kiểm thử API và luồng nghiệp vụ
├── docs/                        # Tài liệu chức năng và kiểm thử
├── qa/                          # Kết quả kiểm thử giao diện
├── scripts/                     # Script build và chạy preview
├── MMA301-SCOPE.md              # Phạm vi dự án
├── START-DEMO.cmd               # Chạy server đã build trên Windows
└── START-DEMO.ps1
```

## Cách web hoạt động

```text
Trình duyệt → Web Vue → HTTP API (.NET) → SQLite
                            ↓
                    Mô hình AI phân loại nhu cầu
```

- Web hiển thị các màn hình theo vai trò người dùng. Sau khi đăng nhập, API client gửi token kèm các yêu cầu cần xác thực; backend kiểm tra phiên và quyền truy cập.
- Người yêu cầu tạo yêu cầu cứu trợ. Quản trị viên duyệt và phân công; tình nguyện viên cập nhật tiến độ nhiệm vụ.
- Quản lý kho theo dõi vật tư, nhập/xuất/chuyển kho và tiếp nhận quyên góp từ tổ chức. Backend kiểm tra tồn kho trước khi ghi nhận giao dịch.
- Trợ lý AI phân loại mô tả nhu cầu và gợi ý vật tư dựa trên tồn kho. AI chạy trong backend, không cần API key; người dùng vẫn quyết định duyệt và xuất kho.
- SQLite lưu dữ liệu trong thư mục `.local/` của server. Web cần API đang chạy để đăng nhập và sử dụng các nghiệp vụ.

## Chạy web từ source

Cần **Node.js 24.12 trở lên** và **.NET 10 SDK**. Chạy hai terminal từ thư mục gốc của repo.

**Terminal 1 — API:**

```powershell
cd DisasterReliefSystem/backend/DisasterReliefSystem.API
$env:ASPNETCORE_ENVIRONMENT = 'Development'
dotnet run --no-launch-profile --urls http://localhost:5092
```

API tạo database và tài khoản mẫu khi khởi tạo database trống trong môi trường Development. Kiểm tra server tại `http://localhost:5092/api/health`.

**Terminal 2 — web:**

```powershell
cd FRONTEND
npm ci
npm run dev
```

Mở địa chỉ Vite in trong terminal, mặc định `http://localhost:5173`. Web mặc định kết nối API tại `http://localhost:5092/api`. Có thể đặt `VITE_API_BASE_URL` trong `FRONTEND/.env.local` rồi khởi động lại Vite, hoặc đổi địa chỉ server trên giao diện web.

Đăng nhập thử bằng `admin@relief.local`, mật khẩu `Relief@123456` khi dùng database demo mới. Giữ cả hai terminal chạy trong lúc sử dụng.

`START-DEMO.cmd` chỉ dùng khi đã có server build sẵn: file `DisasterReliefSystem.API.exe` phải nằm cùng thư mục script hoặc trong `artifacts/server-win-x64/`. Repo source không kèm bộ build này. Muốn tự tạo bộ server trên Windows, chạy từ thư mục gốc:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-server.ps1
.\START-DEMO.cmd
```

Bộ server đã build phục vụ cả API và web tại `http://localhost:5092`.
