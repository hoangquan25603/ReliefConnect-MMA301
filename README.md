# ReliefConnect — MMA301

App cứu trợ bằng **React Native / Expo**, phát triển từ nghiệp vụ source OJT cũ theo bộ tài liệu MMA301 của nhóm. Web Vue cũ được giữ làm giao diện quản trị. AI là mô hình học máy Naive Bayes tiếng Việt chạy trong API; không cần API key.

## Chạy demo nhanh

1. Giải nén `artifacts/ReliefConnect-server-win-x64.zip` vào thư mục có quyền ghi, rồi mở `START-DEMO.cmd` bên trong. Hoặc tại workspace này mở `START-DEMO.cmd`. Server tự tạo SQLite và dữ liệu demo lần đầu; không cần cài .NET SDK với bộ server đóng gói.
2. Cài `artifacts/ReliefConnect-MMA301-arm64.apk` trên điện thoại **Android 7.0 trở lên, ARM64**. Cho phép cài từ nguồn bạn dùng để mở APK nếu Android hỏi.
3. Cho laptop và điện thoại vào cùng Wi-Fi. Trong app nhập `http://IP-LAPTOP:5092`, bấm **Kiểm tra & lưu kết nối**. IP hiện trong cửa sổ server; cũng có thể xem IPv4 của Wi-Fi bằng `ipconfig`.
4. Mở `http://localhost:5092` trên laptop để dùng web quản trị. Kiểm tra API tại `http://localhost:5092/api/health`.
5. Giữ cửa sổ server chạy trong buổi demo. Ctrl+C để dừng; dữ liệu được giữ cho lần sau.

Nếu điện thoại không kết nối: kiểm tra đúng IPv4, cùng Wi-Fi, server còn chạy, không bật guest Wi-Fi/client isolation; cho phép server qua Windows Firewall trên **mạng riêng** khi Windows hỏi. `localhost` trên điện thoại là chính điện thoại. Android Emulator dùng `http://10.0.2.2:5092`. Có thể đổi sang URL HTTPS khi nhóm có hosting.

**Khuyến nghị hiện tại:** laptop + Wi-Fi phù hợp demo môn học, không phát sinh phí hosting và không cần đưa dữ liệu lên Internet. Bản APK đã có màn hình đổi server nên vẫn dùng được khi triển khai sau này.

## Tài khoản demo

Mật khẩu chung: `Relief@123456`. Chỉ được tạo khi database trống và server chạy cấu hình Development/SeedDemo.

| Vai trò | Email | Việc chính |
|---|---|---|
| Quản trị viên | admin@relief.local | Duyệt yêu cầu, phân công, quản lý tài khoản |
| Quản lý kho | warehouse@relief.local | Kho, vật tư, tiếp nhận quyên góp, theo dõi phân công |
| Người yêu cầu | requester@relief.local | Tạo và theo dõi yêu cầu cứu trợ |
| Tình nguyện viên | volunteer@relief.local | Nhận và cập nhật nhiệm vụ |
| Tổ chức | organization@relief.local | Gửi và theo dõi quyên góp |

Đăng ký mới tạo vai trò Người yêu cầu; quyền kho/tổ chức cần quản trị viên duyệt. Đổi vai trò hoặc khóa tài khoản thu hồi phiên đăng nhập cũ.

## Source và tài liệu

| Thư mục | Nội dung |
|---|---|
| `MOBILE/` | App Expo 54, React Native 0.81, TypeScript, navigation theo vai trò |
| `FRONTEND/` | Web Vue 3 quản trị, API thật, cấu hình server |
| `DisasterReliefSystem/backend/DisasterReliefSystem.API/` | ASP.NET .NET 10, EF Core SQLite, auth và nghiệp vụ, AI |
| `marketing/` | Logo SVG/PNG, banner 1200×630, nội dung giới thiệu và ảnh màn hình |
| `docs/` | Ma trận chức năng, kịch bản demo và kết quả kiểm thử |
| `scripts/` | Build APK, chạy web kiểm thử và đóng gói source |

Xem `MMA301-SCOPE.md`, `docs/FUNCTION-MATRIX.md`, `docs/DEMO-MMA301.md`, `docs/TEST-REPORT.md`. Các bản SQL Server migration cũ được giữ để tham khảo, không áp dụng vào SQLite demo mới. Không sửa hay kết nối đến database production cũ.

## Phát triển và build lại

Cần Node.js (đã kiểm chứng Node 24), .NET 10 SDK cho backend, JDK 17 + Android SDK 36/NDK 27.1.12297006 cho APK. Dependencies đã có lockfile; chạy `npm ci` trong từng frontend/mobile khi lấy source mới.

```powershell
# Backend từ source
cd DisasterReliefSystem/backend/DisasterReliefSystem.API
$env:ASPNETCORE_ENVIRONMENT='Development'
dotnet run --no-launch-profile --urls http://0.0.0.0:5092

# App bằng Expo (cửa sổ terminal khác)
cd MOBILE
npm ci
npm start

# Web quản trị
cd FRONTEND
npm ci
npm run dev
```

Từ thư mục gốc: `powershell -ExecutionPolicy Bypass -File scripts/build-apk.ps1`. Build server Windows bằng `powershell -ExecutionPolicy Bypass -File scripts/build-server.ps1`. APK ARM64 đầu ra nằm ở `artifacts/ReliefConnect-MMA301-arm64.apk`. Đã lưu native Android project, không cần prebuild mỗi lần. Khi cần sinh lại Android: `npx expo prebuild --platform android --no-install`; plugin `plugins/withReliefAndroid.js` giữ icon/splash và cấu hình LAN. Không dùng `--clean` khi còn thay đổi native chưa lưu.

APK dùng cấu hình release và khóa ký demo của dự án; **chưa phải bản phát hành Play Store**. Khi phát hành thật phải tạo keystore riêng, dùng HTTPS, tắt cleartext trong plugin, tắt SeedDemo, cấu hình email và bảo vệ database. EAS profile `preview` cũng xuất APK, cần tài khoản Expo riêng nếu chọn build trên EAS.

## Lưu trữ và AI

Server lưu dữ liệu và khóa cục bộ trong `.local/` cạnh backend. Giữ thư mục này khi cập nhật; sao lưu khi server đã dừng. Không đưa database, token hoặc email khôi phục vào source ZIP. Phiên native lưu bằng SecureStore; AsyncStorage chỉ lưu địa chỉ server và bản nháp. Web test dùng sessionStorage cho phiên.

Khôi phục mật khẩu demo ghi email `.eml` vào `.local/mail/`; mở file để lấy mã thử nghiệm. **Không gửi ra hộp thư thật** khi dùng Pickup. Production cần cấu hình SMTP bằng biến môi trường (`Email__DeliveryMethod`, `Email__Host`, `Email__Username`, `Email__Password`…). Không đưa mật khẩu SMTP vào source.

AI học từ 72 mô tả do dự án biên soạn, có 6 nhóm nhu cầu và tập smoke test riêng. Điểm dự đoán không phải tỷ lệ chính xác ngoài thực tế; mô tả đa nhu cầu có thể chỉ được chọn một nhóm. AI gợi ý nhóm và đối chiếu tồn kho; không tự duyệt yêu cầu hay quyết định xuất kho. Chi tiết trong `AI/README.md` của backend.

## Kiểm thử

```powershell
cd MOBILE
npm run typecheck
npm test
cd ../FRONTEND
npm test
npm run build
```

Các script `backend/tests/core-smoke.mjs`, `workflow-smoke.mjs` cần server demo/database **riêng**; đọc hướng dẫn trong hai báo cáo test cạnh script trước khi chạy vì chúng tạo và thay đổi dữ liệu. Không chạy trên dữ liệu thật. UI test: xuất React Native Web (`npx expo export --platform web`), chạy `node scripts/serve-web.cjs MOBILE/dist 8081` từ gốc, cài Playwright/Chromium và chạy `node MOBILE/tests/ui-smoke.cjs`. Có thể đặt `CHROMIUM_PATH`, `APP_URL`, `API_URL`. Script UI cũng tạo dữ liệu demo.

Kiểm thử trình duyệt không thay thế kiểm thử Android thật. Checklist cài APK, camera/GPS thật, quyền bị từ chối và mở lại app nằm trong báo cáo bàn giao; các phần chưa thực hiện được ghi rõ.

