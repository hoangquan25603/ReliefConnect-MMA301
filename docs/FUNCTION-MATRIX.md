# Ma trận chức năng ReliefConnect — MMA301

Đối chiếu source tại ngày 29/10/2026. “Có” dưới đây nghĩa là đã có phần triển khai tương ứng; **không đồng nghĩa đã kiểm thử mọi luồng trên thiết bị Android thật**. Native là app React Native/Expo trong `MOBILE/`; Web là giao diện Vue kế thừa trong `FRONTEND/`; cả hai dùng cùng API .NET/SQLite.

Đây là đồ án học tập, chưa được kiểm định cho vận hành cứu trợ thực tế. Source OJT là nền nghiệp vụ; phạm vi môn đã thống nhất nằm ở [MMA301-SCOPE.md](../MMA301-SCOPE.md).

## Chức năng, giao diện và giới hạn

| Chức năng | API/backend | App native React Native | Web Vue | Giới hạn/cách hiểu |
|---|---|---|---|---|
| Kết nối server | `GET /api/health` | Nhập URL, kiểm tra API, lưu cấu hình; đổi server đăng xuất phiên cũ | Trang `/connection` và API base cấu hình được | Cần backend chạy; APK không chứa backend. HTTP dành cho demo LAN; hosting thật cần HTTPS |
| Đăng ký/đăng nhập | Register tạo Requester; kiểm tra mật khẩu; bearer session có hạn | Form đăng ký/đăng nhập | Có | Token là phiên opaque được backend kiểm tra, không phải JWT |
| Phiên, refresh, đăng xuất | Token refresh xoay vòng, thu hồi phiên, role lấy từ DB | SecureStore trên Android; tự refresh khi 401; đồng bộ hồ sơ khi app active | Lưu token, refresh, guard route theo role | SecureStore không áp dụng cho bản web preview; giao diện ẩn nút không thay thế phân quyền API |
| Mật khẩu | Đổi mật khẩu; mã reset 6 số và reset session một lần | Đổi mật khẩu, luồng khôi phục email–mã–mật khẩu | Có | SMTP phải được cấu hình để gửi email thật; Development có pickup mailbox. Không có dịch vụ mail production dựng sẵn |
| Quản lý người dùng | Admin tạo, xem, sửa, khóa/mở, đổi role, reset mật khẩu | Danh sách, khóa/mở, đổi role | Giao diện quản trị chi tiết hơn, gồm tạo/sửa/reset | Native chưa có màn hình tạo user admin, sửa tên/điện thoại và reset mật khẩu quản trị |
| Yêu cầu cứu trợ | Tạo/list/detail, phạm vi chủ sở hữu hoặc nhân sự được phép, trạng thái hợp lệ | Requester tạo/theo dõi; Admin duyệt và nhập số TNV; hủy yêu cầu hợp lệ | Requester và quản trị có trang nghiệp vụ | Native không mở tab yêu cầu cho Coordinator; API vẫn cấp quyền điều phối phù hợp |
| Ảnh hiện trường | Lưu `photoDataUrl`; JPEG/PNG, base64/chữ ký và ≤1 MiB | Chọn ảnh hoặc chụp ảnh, xem trước/gỡ ảnh, đọc lại ảnh đã lưu | Form web hiện chưa có luồng chụp/chọn ảnh tương đương native | Ảnh là đính kèm, không được AI phân tích; lưu trong DB là lựa chọn demo, chưa có object storage/CDN |
| GPS và bản đồ | Lưu/kiểm tra tọa độ; dashboard cung cấp điểm request/kho | Expo Location xin quyền, nhập tay dự phòng; mở Maps/chỉ đường bên ngoài | Có bản đồ Leaflet và các điểm trên dashboard | Native **chưa nhúng Maps SDK**; GPS không phải reverse-geocoding tự điền địa chỉ. Chưa xác minh quyền/GPS/camera trên điện thoại Android thật |
| Bản nháp/mất mạng | Ghi nghiệp vụ chỉ thành công sau phản hồi API | Lưu bản nháp yêu cầu bằng AsyncStorage theo user+server; xóa sau gửi thành công | API web không giả báo thành công bằng dữ liệu offline | Chưa có hàng đợi đồng bộ nền hoặc offline-first cho mọi nghiệp vụ; phải chủ động gửi bản nháp |
| Cấp phát lúc duyệt | Transaction trừ kho, ghi giao dịch và allocation; không duyệt trừ lặp; lưu `inventoryIssues` | Hiển thị số đã cấp/yêu cầu và cảnh báo sau tải lại | Hiển thị kết quả cấp phát trong chi tiết quản trị | `inventoryIssues` là snapshot tại lần duyệt. Nhập/xuất thủ công sau đó nằm ở sổ kho, không tự sửa snapshot thành số giao nhận |
| Thiếu hàng/đơn vị hỗn hợp | Cấp một phần khi thiếu; nhiều đơn vị trong một nhóm yêu cầu chọn vật tư thủ công | Hiển thị cảnh báo và lý do | Hiển thị cảnh báo và lý do | Không cộng kg và hộp như một đơn vị; chưa có hệ quy đổi quy cách hoặc định lượng cứu trợ đã thẩm định |
| Hủy và hoàn kho | Trước vận chuyển hoàn lượng đã giữ một lần; lịch sử đã vận chuyển chặn tự hoàn | Nút hủy, thông báo khi API từ chối | Có | Cần đối soát thực tế cho hàng đã vận chuyển; không giả định hủy phân công đồng nghĩa hàng đã về kho |
| Kho hàng | Tạo/sửa/kích hoạt/ngưng; không ngưng khi còn hàng | Tạo/sửa/ngưng, chọn kho, xem tồn | Có | Không xóa cứng lịch sử. Chưa quản lý sơ đồ vị trí kệ, lô, hạn dùng, barcode hoặc kiểm kê điều chỉnh |
| Danh mục vật tư | Tên, nhóm, đơn vị, ngưỡng; tạo tồn 0; bảo vệ vật tư có reservation/lịch sử | Tạo/sửa vật tư theo kho | Có | Không sửa trực tiếp tồn kho; đổi đơn vị bị hạn chế khi đã có lịch sử để tránh sai sổ |
| Nhập/xuất/chuyển kho | Validate số nguyên dương; không âm; atomic transfer hai đầu; chống xuất vượt tồn đồng thời | Nhập/xuất/chuyển, mã tham chiếu và ghi chú | Có | SQLite và semaphore cho demo một API instance; chưa chứng minh vận hành nhiều instance |
| Cảnh báo/lịch sử kho | Summary, lọc thấp ngưỡng, phân trang ledger | Badge Sắp hết, bộ lọc, lịch sử giao dịch | Có | Là cảnh báo khi xem/tải lại màn hình; không có push cảnh báo tồn kho nền |
| Hồ sơ tình nguyện viên | Tạo/sửa hồ sơ; xét duyệt; hồ sơ từ chối có thể cập nhật gửi lại | Requester/Volunteer có hồ sơ, vị trí, kinh nghiệm, kỹ năng; Admin có danh sách duyệt | Có | Không có chứng thực năng lực hoặc giấy phép chuyên môn ngoài dữ liệu người dùng khai |
| Kỹ năng | Danh mục public; admin CRUD; TNV thêm/gỡ | TNV thêm/gỡ kỹ năng có sẵn | TNV thao tác và Admin quản lý danh mục | Native chưa có màn hình admin tạo/sửa danh mục kỹ năng |
| Tự nhận nhiệm vụ | Chỉ TNV được duyệt, còn chỗ và không có nhiệm vụ active; kiểm tra tranh chấp | Bảng Đang cần người và nút đăng ký | Có | Tự nhận là Accepted ngay; nhiệm vụ quản lý phân công bắt đầu Assigned |
| Phân công/tiến độ | Admin/Coordinator phân công; owner/staff cập nhật theo thứ tự; đồng bộ trạng thái request | Quản lý phân công, nhận/di chuyển/hoàn thành | Có, màn hình quản trị chi tiết hơn | Người phụ trách xác nhận các mốc; không có theo dõi GPS nền hoặc bằng chứng giao nhận điện tử |
| Hủy nhiệm vụ | Đề nghị lý do; nhân sự quản lý duyệt/từ chối; force cancel có lý do | TNV đề nghị; Admin/Coordinator duyệt/từ chối | Có, gồm force cancel | Native chưa có nút force cancel độc lập; không hoàn kho tự động sau dispatch |
| Nhóm trưởng/gợi ý TNV | Set/remove một nhóm trưởng; gợi ý theo khoảng cách/kinh nghiệm | Chưa có nút chỉ định/gỡ nhóm trưởng hoặc bảng gợi ý | Có | Gợi ý TNV là thuật toán khoảng cách, không phải AI; số kỹ năng khớp hiện chưa tính |
| Quyên góp | Organization tạo; admin/coordinator duyệt đủ mapping hoặc từ chối; nhập kho nguyên tử | Tạo nhiều dòng; staff tiếp nhận tất cả vào cùng kho; từ chối có lý do | Có ánh xạ từng dòng vào vật tư sẵn hoặc vật tư mới | Duyệt native dùng nhánh tạo/tìm dòng trong kho; chưa có selector map từng dòng vào stock ID có sẵn như web |
| Nguyện vọng role | Xin Coordinator/Organization; admin duyệt/từ chối; chặn tự xin Admin | Gửi nguyện vọng, Admin duyệt danh sách chờ | Có cả lịch sử nguyện vọng cá nhân | Native chưa có lịch sử nguyện vọng cá nhân đầy đủ; đổi role có thể cần vào lại app/đăng nhập lại để UI đồng bộ |
| Thông báo | List theo user, số chưa đọc, đọc một/tất cả; phát sinh từ nghiệp vụ | Danh sách trong Tiện ích, đọc và tải lại | Có | **Chưa có push notification** (FCM/Expo Push), chưa có background delivery hoặc lịch nhắc local |
| Dashboard/thống kê | Summary, chuỗi ngày, map, audit logs | Tổng quan theo role và dữ liệu đã tải | Dashboard quản trị, biểu đồ, map, audit | Native chưa có toàn bộ biểu đồ/audit dashboard; chỉ số Tổng quan ghi rõ phạm vi dữ liệu đã tải |
| Xuất báo cáo | XLSX requests/assignments/inventory, lọc, chặn người không có quyền; text không thành Excel formula | Chưa có UI tải/chia sẻ file XLSX | Trang báo cáo có tải file | Có API không đồng nghĩa đã có chức năng export native |
| Trang công khai/liên hệ | Highlights đã lược dữ liệu cá nhân; contact lưu DB và thông báo admin | Chưa có các trang công khai riêng | Home/About/Guide/Contact | Contact chưa phải email gửi ra ngoài; vị trí công khai đã làm tròn, không phải điểm điều phối chính xác |
| AI văn bản | `/ai/status`, `/ai/analyze`; Multinomial Naive Bayes, 72 ví dụ tự biên soạn, 6 nhóm; đối chiếu tồn kho | Màn hình AI, ví dụ, điểm từng nhóm, vật tư gợi ý | Có trang `/ai` | **Không phải Gemini/ChatGPT/LLM**; không đọc ảnh, không tự quyết định mức độ khẩn cấp, nhân sự hoặc xuất kho |
| APK/phát hành | Backend được chạy riêng | Source Android/Expo và quy trình build APK | Không phải APK | Build/install/test thực tế phải đối chiếu biên bản cuối; chưa xác minh điện thoại Android thật, chưa phát hành Play Store |

## Dữ liệu và AI

SQLite lưu trên máy chạy API; trên điện thoại hiện dùng AsyncStorage cho cấu hình/bản nháp và SecureStore cho session. Điều đó đáp ứng mô hình app gọi remote API nhưng **không phải bằng chứng đã dùng SQLite trực tiếp trên Android**.

AI huấn luyện tại lúc backend khởi động từ `DisasterReliefSystem/backend/DisasterReliefSystem.API/AI/training-data.json`: 72 câu tiếng Việt tự biên soạn, 12 câu mỗi nhóm Food, Water, Medicine, Blanket, Shelter, Other. Không cần API key và không gửi mô tả tới dịch vụ AI bên ngoài. Mô hình trả một nhóm nhu cầu chính; các câu nhiều nhu cầu, phủ định, tiếng địa phương hoặc từ ngoài tập huấn luyện có thể sai.

Smoke test hiện có 12 câu kiểm tra tự biên soạn không trùng nguyên văn tập huấn luyện, kết quả ghi nhận 12/12. Đây **không phải benchmark độc lập hoặc tỷ lệ chính xác triển khai thực tế**. Confidence chưa được hiệu chuẩn. AI luôn yêu cầu người phụ trách rà soát.

## Mức kiểm chứng hiện có

| Bằng chứng | Phạm vi chứng minh | Không chứng minh |
|---|---|---|
| `backend/tests/workflow-smoke.mjs` và `WORKFLOW-TEST-RESULTS.md` | 118 kiểm tra HTTP trong 9 nhóm; ownership, ảnh, trạng thái, stock, cạnh tranh chỗ, quyên góp rollback, role, thông báo và cấu trúc XLSX | Tương tác native, quyền Android, chất lượng trải nghiệm trên mọi máy |
| `backend/tests/core-smoke.mjs` và kết quả chạy do core tạo | Auth, refresh/revoke, quản trị, kho/transfer/concurrency, recovery và AI; kết quả gần nhất lưu `.local/core-test-result.json` | Email gửi thành công qua một SMTP production chưa cấu hình; tải lớn hoặc nhiều API instance |
| Typecheck/build và test helper frontend/mobile | Lỗi kiểu, build và một số hàm được kiểm tra theo từng báo cáo | “Mọi chức năng UI đều đúng” hoặc end-to-end trên thiết bị thật |
| Demo web hoặc React Native Web preview | Hành vi trên môi trường browser cụ thể đã ghi nhận | Không thay thế kiểm thử APK, camera, GPS, SecureStore và vòng đời app trên điện thoại Android |

Số lượng test có thể tăng trong các lượt sửa cuối; dùng báo cáo cuối tương ứng với source/APK được bàn giao. Không gộp số HTTP assertion thành số màn hình đã kiểm thử hay tuyên bố “100% chức năng”.

## Đối chiếu nội dung môn MMA301

Theo [MMA301-SCOPE.md](../MMA301-SCOPE.md), slide là căn cứ nội dung học, không tự tạo thêm rubric bắt buộc cho đồ án.

| Slide | Triển khai liên quan | Phần cần phân biệt |
|---|---|---|
| 1, 4, 5, 7 | React Native/Expo, component native và layout tái sử dụng | Vue là web quản trị riêng; APK không phải WebView bọc Vue |
| 8, 12–17 | Stack/bottom tabs, hooks, Context, form, FlatList, AsyncStorage, SecureStore | Có storage cục bộ cho draft/session; không có offline-sync toàn hệ thống |
| 19–21 | Xử lý lỗi/validate, test tự động, build và tài liệu APK | Bản build thành công chưa tương đương kiểm thử thiết bị thật hoặc phát hành store |
| 22–31 | REST API, dữ liệu SQLite phía server, thông báo trong app | Chưa có SQLite local trên Android hoặc push nền |
| 32 | AI học máy cho text, Expo Image Picker, Expo Location, mở Maps bên ngoài | Chưa Gemini, AI ảnh, Maps SDK nhúng; chưa có rubric yêu cầu bắt buộc những phương án này |

## Các phần cần kiểm tra khi có điện thoại thật

- Cài APK, mở lần đầu và kết nối đúng API qua mạng dùng khi bảo vệ.
- Cho phép/từ chối quyền GPS/camera; chọn ảnh JPEG/PNG, chụp ảnh, kiểm tra dung lượng; thao tác hủy picker.
- Tắt/mở app, khóa máy và quay lại; xác nhận session SecureStore, refresh, đổi role/khóa tài khoản và logout hoạt động như mong muốn.
- Mất Wi-Fi khi đang tạo yêu cầu: bản nháp còn đọc được và ứng dụng không báo đã gửi thành công.
- Bàn phím, cuộn form dài, màn hình nhỏ, nút back Android, ảnh xoay chiều và mở Maps/ứng dụng bên ngoài.
- Xác nhận người dùng khác không nhìn thấy bản nháp/thông báo của tài khoản trước trên cùng thiết bị.

Những mục này là việc cần xác minh, không phải kết quả đã đạt ở thời điểm soạn tài liệu.
