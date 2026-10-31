# ReliefConnect — phạm vi môn MMA301

Người dùng xác nhận ngày 29/10/2026: bám bộ tài liệu MMA301 đã gửi và bổ sung AI. Source OJT là nền nghiệp vụ, không phải tiêu chí kỹ thuật của môn.

## Căn cứ
- Chat trước: “Build MMA301 photo app”. Bộ slide 1–32 và tài liệu PDF đi kèm vẫn có trong thư mục Temp; bản trích nội dung ở `C:/Users/user-/Documents/Codex/2026-10-26/y-l-t-i-li-u/work/materials.json`.
- Slide 1, 4, 5, 7: React Native/Expo và component native.
- Slide 8, 12–17: navigation, hooks, Context, AsyncStorage, nhập liệu, danh sách.
- Slide 19–21: xử lý lỗi, kiểm thử, APK và phát hành.
- Slide 22–31: thông báo, SQLite và API/remote database.
- Slide 32: tích hợp AI, Maps, Image Picker. Đây là nội dung môn; không tự coi mọi ví dụ trong slide là tiêu chí bắt buộc của project.
- Bài photo và ASM2 bán hàng trước đây là bài riêng; không áp nguyên đề bài đó cho hệ thống cứu trợ.

## Kiến trúc
- `MOBILE/`: app React Native/Expo, UI native, navigation theo vai trò, Context/hooks, AsyncStorage cho cấu hình/bản nháp và SecureStore cho token.
- `FRONTEND/`: web Vue cũ, dùng tham khảo và quản trị.
- `DisasterReliefSystem/backend/`: API .NET và SQLite phục vụ demo trên laptop; app kết nối qua LAN hoặc HTTPS khi có hosting.
- AI phân loại mô tả nhu cầu: mô hình học máy có dữ liệu huấn luyện và kết quả kiểm thử; quyết định cứu trợ/xuất kho phải do người dùng xác nhận.

## Nghiệp vụ cần kiểm thử
Đăng ký/đăng nhập/phân quyền; yêu cầu cứu trợ và trạng thái; tình nguyện viên/phân công; quyên góp/duyệt; kho/vật tư/nhập/xuất/chuyển/lịch sử/cảnh báo; thông báo; AI; lỗi mạng và cấu hình server; build APK. Báo cáo kết quả phải phân biệt test tự động, test giao diện và phần chưa test trên thiết bị thật.

## Bàn giao
Source, APK cài đặt demo, hướng dẫn chạy/test, tài nguyên marketing. Chưa có rubric riêng hoặc yêu cầu Play Store; không tự coi chúng là bắt buộc.
