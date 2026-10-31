# Báo cáo kiểm thử và bàn giao — ReliefConnect MMA301

Ngày thực hiện: 29/10/2026. Chỉ sử dụng server local và dữ liệu demo. Source OJT/DB production cũ không được gọi để chạy kiểm thử.

## Kết quả đã ghi nhận

| Lớp kiểm chứng | Kết quả | Bằng chứng |
|---|---|---|
| Backend core | 169 assertion đạt, 7 nhóm | `DisasterReliefSystem/backend/tests/CORE-TEST-RESULTS.md`, `core-test-results.json` |
| Backend nghiệp vụ | 119 kiểm tra HTTP đạt, 9 nhóm trên EXE Windows cuối ở cổng 5097 | `DisasterReliefSystem/backend/tests/workflow-smoke.mjs`, `WORKFLOW-TEST-RESULTS.md` |
| App — xử lý API | 8/8 bài test đạt | `MOBILE/tests/api.test.mjs` |
| Web — regression API | 5/5 bài test đạt | `FRONTEND/tests/api-contracts.test.mjs` |
| App React Native Web — thao tác thực | 12/12 kịch bản đạt; 0 lỗi JavaScript không xử lý | `docs/evidence/mobile-ui.json`, `MOBILE/tests/ui-smoke.cjs` |
| App — lỗi và hồ sơ | 6/6 kịch bản đạt; 0 lỗi JavaScript không xử lý | `docs/evidence/mobile-errors.json`, `MOBILE/tests/ui-errors.cjs` |
| Web Vue — thao tác thực | 13/13 kịch bản đạt; 0 lỗi JavaScript không xử lý | `docs/evidence/web-ui.json`, `FRONTEND/tests/web-smoke.cjs` |
| Kiểm tra TypeScript | Mobile và Vue đều đạt | `npm run typecheck` trong từng project |
| Build | Vue production và Expo Web thành công; APK Android release thành công | Metadata và log trong `docs/evidence/` |
| Server Windows x64 | EXE tự chứa runtime chạy được; health/login/AI, nghiệp vụ và web quản trị đạt | Publish .NET 10; HTTP 200 cho URL sâu và asset JavaScript |

Các số assertion/kịch bản là những đơn vị khác nhau, không cộng thành tỷ lệ “100% chức năng”. UI app được kiểm thử bằng **React Native Web trên Chromium**, viewport 412×915. GPS trong lượt test là tọa độ giả lập; chọn ảnh dùng file PNG demo. Đây không phải kết quả chạy trên điện thoại Android.

## Những luồng đã kiểm tra

- Auth: đủ 5 vai trò, đăng ký không tự xin quyền cao, mật khẩu sai, refresh xoay vòng, đăng xuất/thu hồi phiên, khóa và đổi quyền, đổi mật khẩu, reset bằng mã một lần.
- Kho: CRUD kho/vật tư, số âm/sai/overflow, nhập/xuất/chuyển, lịch sử, cảnh báo, ngưng kho, tổng tồn hai đầu, hai lượt xuất/chuyển đồng thời; chặn đổi danh tính vật tư đang giữ cho yêu cầu.
- Cứu trợ: validate, chủ sở hữu, ảnh và dung lượng, lưu nháp, phục hồi nháp, server lỗi không báo gửi thành công, duyệt một lần, thiếu vật tư, nhiều đơn vị tính, hoàn kho trước vận chuyển và chặn hoàn sau dispatch.
- TNV: tạo/duyệt hồ sơ, kỹ năng, phân công hoặc tự nhận, chỗ cuối khi hai người cùng nhận, tiến độ tuần tự, đề nghị hủy/duyệt/từ chối, tọa độ/mô tả trong nhiệm vụ mở.
- Quyên góp: tạo nhiều dòng, ánh xạ vật tư/đơn vị, rollback nếu một dòng lỗi, không nhập kho trùng sau duyệt lại.
- Nguyện vọng, thông báo, báo cáo: không leo quyền, xét duyệt, thông báo riêng theo user, lỗi mạng hiển thị, XLSX có cấu trúc ZIP/XML hợp lệ và không biến dữ liệu nhập thành công thức.
- AI: mô hình học từ 72 câu tự biên soạn, 6 nhóm; 12/12 câu smoke test riêng đạt, văn bản không có bằng chứng được xử lý. Kết quả hiển thị phân bố điểm, vật tư đang có và yêu cầu người phụ trách xác nhận.
- Cấu hình: kiểm tra đúng API, URL lỗi, đổi server xóa phiên cũ; web mở trực tiếp URL sâu không trắng trang.

## Lỗi đã sửa qua kiểm thử

Web cũ từng tạo yêu cầu giả khi server lỗi và nuốt lỗi thông báo; đã bỏ. Vite dùng đường dẫn asset tương đối làm trắng trang khi refresh URL sâu; đã sửa. App giữ màn hình kết nối sau khi lưu server; đã đặt lại navigation theo trạng thái phiên. Nhu cầu không chọn từng gửi số lượng 0 gây API từ chối; đã chuyển thành null. Cấp phát thiếu hàng từng chỉ hiện trong phản hồi tạm; đã lưu và hiển thị lại. Bảo vệ hoàn kho sau dispatch, bảo vệ danh tính vật tư đã giữ và tranh chấp chỗ cuối đã được bổ sung regression.

## Giới hạn chưa xác minh

Chưa có điện thoại ADB kết nối; môi trường emulator chưa có hypervisor driver. Vì vậy chưa xác minh cài/chạy APK, camera/GPS thật, SecureStore thực, quyền bị từ chối, nút back Android, bàn phím, xoay ảnh, chuyển nền/khôi phục trên Android. Không gọi những mục này là đã đạt. APK đã được build và kiểm tra metadata/chữ ký, điều đó không thay cho kiểm thử runtime.

Push nền, Maps SDK nhúng, AI ảnh/Gemini, barcode/lô/hạn dùng, nhiều API instance và phát hành Play Store chưa thuộc phần đã triển khai. Ma trận chi tiết ở `FUNCTION-MATRIX.md`. Mô hình AI nhỏ dùng cho đồ án, không đủ dữ liệu để công bố độ chính xác ngoài thực tế.

## Checklist trước buổi bảo vệ

- [ ] Cài APK trên chính máy sẽ demo; mở app khi không có Metro/dev server.
- [ ] Kết nối API từ điện thoại cùng Wi-Fi; đăng nhập đủ vai trò.
- [ ] Cấp/từ chối GPS/camera, chọn/chụp ảnh, hủy picker; xem ảnh lưu lại.
- [ ] Nhập–xuất–chuyển kho; duyệt yêu cầu; nhận–di chuyển–hoàn thành nhiệm vụ.
- [ ] Tắt Wi-Fi khi đang nhập, lưu nháp, mở lại và gửi khi kết nối phục hồi.
- [ ] Đóng/mở app, chuyển nền, đăng xuất; kiểm tra dữ liệu không lẫn tài khoản.
- [ ] Kiểm tra cuộn form và nút back với bàn phím trên màn hình nhỏ.

Đọc `README.md` để chạy/build, `DEMO-MMA301.md` để trình bày. Các script integration thay đổi dữ liệu; chỉ chạy với DB demo riêng.
