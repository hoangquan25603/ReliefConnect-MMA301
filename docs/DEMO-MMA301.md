# Kịch bản demo ReliefConnect — MMA301, khoảng 9 phút 30 giây

Đây là **kịch bản trình bày đề xuất**, không phải biên bản xác nhận đã thao tác thành công trên điện thoại thật. Bản Android cần được chạy thử trên thiết bị sẽ dùng bảo vệ trước buổi demo. ReliefConnect là đồ án môn học dùng tình huống cứu trợ để minh họa nghiệp vụ; chưa được kiểm định để vận hành cứu trợ thực tế.

## Chuẩn bị trước buổi trình bày

1. Chạy backend .NET ở môi trường Development với dữ liệu demo. Giữ laptop bật trong suốt buổi demo. Điện thoại và laptop dùng cùng mạng; địa chỉ API phải truy cập được từ thiết bị.
2. Mở app React Native/Expo. Trong **Kết nối máy chủ**, nhập địa chỉ laptop, ví dụ `http://192.168.1.5:5092`, rồi bấm **Kiểm tra & lưu kết nối**. Android Emulator dùng `http://10.0.2.2:5092`; `localhost` trên điện thoại là chính điện thoại, không phải laptop.
3. Chuẩn bị một ảnh JPEG/PNG nhỏ hơn hoặc bằng 1 MiB. Chỉ dùng ảnh và thông tin giả lập được phép chia sẻ. Kiểm tra trước quyền camera, chọn ảnh và vị trí. Nếu không cấp quyền GPS, có thể nhập tọa độ `16.0544`, `108.2022` và nói rõ đây là tọa độ mẫu.
4. Mở sẵn web quản trị Vue trên laptop để xuất báo cáo ở phần cuối. App native là sản phẩm MMA301; web là công cụ quản trị kế thừa.
5. Kiểm tra tồn kho trước khi nói số tuyệt đối. Seed mới có Gạo 500 kg, Nước uống 600 chai, Bộ sơ cứu 15 bộ/ngưỡng 20, Chăn 80 cái, Lều 30 cái trong kho Đà Nẵng; kho Huế dùng để nhận chuyển kho. Nếu DB đã được dùng, đối chiếu **chênh lệch trước/sau** thay vì giả định các số seed vẫn còn nguyên.
6. Chuẩn bị thông tin 5 tài khoản để chuyển vai trò nhanh qua **Tiện ích → Đăng xuất**. Không cần làm lại đăng ký tài khoản trong kịch bản chính.

| Vai trò | Email demo | Dùng để trình bày |
|---|---|---|
| Quản lý kho / Coordinator | `warehouse@relief.local` | Nhập, xuất, chuyển kho, cảnh báo và lịch sử |
| Người yêu cầu / Requester | `requester@relief.local` | Bản nháp, GPS, ảnh, gửi yêu cầu |
| Quản trị / Admin | `admin@relief.local` | Duyệt yêu cầu, số TNV, quyên góp, quản trị |
| Tình nguyện viên / Volunteer | `volunteer@relief.local` | Nhận nhiệm vụ, cập nhật tiến độ |
| Tổ chức / Organization | `organization@relief.local` | Gửi quyên góp vật tư |

Mật khẩu demo chung: `Relief@123456`. Những tài khoản này dành cho DB demo Development, không dùng cho dữ liệu thật hoặc môi trường public.

## 0:00–0:40 — Mở đầu và kiến trúc

Mở app ở màn hình đăng nhập/kết nối và giới thiệu:

> “Nhóm phát triển tiếp nghiệp vụ từ source OJT, nhưng sản phẩm môn MMA301 là app React Native/Expo với giao diện native. App gọi API .NET, dữ liệu lưu trong SQLite trên server. Hệ thống có năm vai trò và AI hỗ trợ phân loại mô tả nhu cầu.”

Nói rõ bản nháp nằm trên máy; giao dịch kho, yêu cầu và phân công chỉ thành công khi API xác nhận. Bản APK không tự chứa một máy chủ cứu trợ độc lập.

## 0:40–2:10 — Coordinator: kho hàng có giao dịch thật

Đăng nhập `warehouse@relief.local`, mở **Kho hàng**:

1. Chọn kho Đà Nẵng, xem tồn của **Gạo**. Bấm **Nhập kho**, nhập `50`, mã tham chiếu `DEMO-IN-01`, ghi chú “Nhập minh họa”. Tồn tăng đúng 50.
2. Bấm **Chuyển kho**, chọn kho Huế, số lượng `20`, mã `DEMO-TRANSFER-01`. Tồn nguồn giảm 20; đổi sang kho Huế thấy tăng 20. Không cần tạo lại vật tư ở kho đích.
3. Mở **Lịch sử giao dịch** để chỉ ra nhập kho và chuyển kho có ngày, số lượng, mã tham chiếu. Hai đầu chuyển kho được ghi cùng giao dịch.
4. Về kho Đà Nẵng, chọn bộ lọc **Sắp hết**. Bộ sơ cứu 15/ngưỡng 20 xuất hiện nếu đang dùng seed mới. Chỉ ra ngưỡng cảnh báo có thể sửa, nhưng không được sửa trực tiếp số tồn.

Nếu còn 10 giây, thử xuất quá số tồn: giao diện/API phải từ chối, tồn kho không âm. Không lưu thêm giao dịch không cần thiết chỉ để trình bày.

## 2:10–3:50 — Requester: bản nháp, vị trí, ảnh và gửi yêu cầu

Đăng nhập `requester@relief.local`, vào **Yêu cầu → + Tạo yêu cầu hỗ trợ**. Nhập nhanh:

| Trường | Giá trị mẫu |
|---|---|
| Tiêu đề | `DEMO MMA301 — hỗ trợ khu dân cư sau mưa lớn` |
| Mô tả | `Nhóm giả lập gồm 5 người cần lương thực và bộ sơ cứu sau mưa lớn.` |
| Địa chỉ/khu vực | `Địa điểm demo, Đà Nẵng` / `Đà Nẵng` |
| Liên hệ | Số điện thoại giả lập của nhóm |
| Số người / mức khẩn cấp | `5` / `2` |
| Lương thực / Y tế | `10` / `20` |
| Các nhu cầu khác | `0` |

1. Bấm **Lấy vị trí hiện tại** sau khi cấp quyền, hoặc nhập tọa độ mẫu và giải thích cách nhập thủ công.
2. Bấm **Chọn ảnh** hoặc **Chụp ảnh**, kiểm tra ảnh xem trước. Ảnh là đính kèm yêu cầu; AI hiện tại không phân tích ảnh.
3. Bấm **Lưu bản nháp trên máy**. Quay lại, mở lại tạo yêu cầu để chứng minh dữ liệu được khôi phục. Bản nháp chưa được gửi và không tự đồng bộ nền.
4. Bấm **Gửi yêu cầu**. Quay về danh sách và kéo tải lại nếu cần; yêu cầu có trạng thái **Chờ duyệt**, ảnh và địa chỉ được đọc lại từ server.

Giải thích bản nháp được phân biệt theo tài khoản và server; mất mạng không được báo nhầm là đã gửi cứu trợ thành công.

## 3:50–4:50 — Admin: duyệt và nhìn thấy thiếu hụt vật tư

Đăng nhập `admin@relief.local`, mở **Yêu cầu**, tải lại danh sách:

1. Nhập **Số tình nguyện viên dự kiến khi duyệt = 1**. Tìm yêu cầu mang tiêu đề `DEMO MMA301`, bấm **Duyệt yêu cầu** và xác nhận.
2. Chỉ ra **Cấp phát tại thời điểm duyệt**. Với seed mới, lương thực đủ 10; y tế chỉ cấp 15/20 và cảnh báo cần bổ sung. Nếu tồn khác, đọc đúng kết quả thực tế.
3. Tải lại màn hình: lịch sử cấp phát/thiếu hụt vẫn tồn tại. Duyệt yêu cầu không đồng nghĩa mọi nhóm vật tư đều đã đủ.
4. Mở **Tiện ích → Phân công & tiến độ** để giới thiệu phương án admin/Coordinator phân công thủ công. Trong kịch bản này **không tạo phân công**, để TNV tự nhận ở bước tiếp theo.

Nói thêm: nếu cùng nhóm vật tư có nhiều đơn vị như kg và hộp, hệ thống không cộng chúng như một đơn vị; quản lý phải chọn vật tư và xuất kho thủ công. Hủy trước vận chuyển có thể hoàn kho; đã có lịch sử vận chuyển thì không tự hoàn lại hàng.

## 4:50–6:00 — Volunteer: nhận việc và hoàn thành

Đăng nhập `volunteer@relief.local`, mở **Nhiệm vụ**:

1. Đổi **Danh sách → Đang cần người**, tìm yêu cầu demo và bấm **Đăng ký tham gia**. Yêu cầu đủ một người sẽ không còn chỗ cho người thứ hai.
2. Chuyển về **Của tôi**. Nhiệm vụ tự nhận đã ở trạng thái **Đã nhận**; bấm **Bắt đầu di chuyển**, rồi **Xác nhận hoàn thành**.
3. Giới thiệu **Mở chỉ đường**: app mở bản đồ bên ngoài theo tọa độ. Đây chưa phải bản đồ native nhúng trong màn hình.
4. Mở **Tiện ích → Thông báo**, xem thông báo và đánh dấu đã đọc.

Nêu khác biệt: nhiệm vụ do quản lý phân công ban đầu là **Đã phân công**, TNV cần bấm **Nhận nhiệm vụ** trước khi di chuyển. Backend không cho bỏ qua bước. Đề nghị hủy có lý do và phải được nhân sự quản lý xét duyệt; không thao tác hủy trên nhiệm vụ vừa hoàn thành.

## 6:00–7:00 — Organization: quyên góp có nhiều dòng

Đăng nhập `organization@relief.local`, mở **Tiện ích → Quyên góp vật tư**:

1. Dòng 1: `Bộ sơ cứu`, đơn vị `bộ`, số lượng `5`.
2. Có thể thêm dòng 2 `Chăn ấm`, đơn vị `cái`, số lượng `3` để minh họa danh sách động; nếu thiếu thời gian chỉ dùng một dòng.
3. Ghi chú `Quyên góp minh họa MMA301`, bấm **Gửi quyên góp**. Chỉ ra trạng thái **Chờ duyệt**: gửi đề nghị chưa làm tăng tồn kho.

## 7:00–8:05 — Admin: tiếp nhận quyên góp và đối soát

Đăng nhập `admin@relief.local`, vào **Tiện ích → Quyên góp vật tư**:

1. Chọn kho Đà Nẵng làm **Kho tiếp nhận**. Kiểm tra từng dòng, bấm **Tiếp nhận vào kho** và xác nhận.
2. Mở **Kho hàng**, xem Bộ sơ cứu tăng thêm đúng 5; xem lịch sử có tham chiếu `DON-…`. Nếu còn dưới ngưỡng 20, cảnh báo sắp hết vẫn đúng.
3. Giải thích app mobile tiếp nhận toàn bộ các dòng vào cùng kho được chọn. Web quản trị có ánh xạ chi tiết từng dòng vào vật tư có sẵn hoặc tạo dòng kho mới. Backend kiểm tra đủ ánh xạ và đơn vị; lỗi một dòng không được nhập dở các dòng khác.
4. Nếu còn thời gian, giới thiệu các mục **Người dùng**, **Duyệt tình nguyện viên**, **Duyệt nguyện vọng**. Không đổi quyền tài khoản đang phục vụ demo.

## 8:05–9:00 — AI: mô hình thật, phạm vi cụ thể

Vẫn ở tài khoản Admin, mở tab **Trợ lý AI**:

1. Chỉ ra tên provider **Local Naive Bayes**, số mẫu **72** và phiên bản model.
2. Nhập `Xin 20 bình nước uống sạch` hoặc chọn ví dụ **Thiếu nước sạch**, bấm **Phân tích bằng AI**.
3. Giải thích kết quả nhóm nhu cầu, các điểm xác suất và danh sách vật tư thực sự còn trong kho. Sửa mô tả sẽ yêu cầu phân tích lại, không dùng lại kết quả cũ như kết quả mới.

> “Đây là mô hình Multinomial Naive Bayes huấn luyện từ 72 câu tiếng Việt tự biên soạn, không gọi Gemini hay dịch vụ LLM bên ngoài. Confidence là điểm của mô hình, không phải độ chính xác đã được chứng minh ngoài thực tế. AI không tự duyệt yêu cầu hoặc xuất kho.”

Mô hình chạy trên backend của nhóm, nên không cần API key hoặc internet tới nhà cung cấp AI; app vẫn phải kết nối được backend. Câu nhiều nhu cầu hoặc cách diễn đạt chưa có trong dữ liệu có thể bị phân loại sai.

## 9:00–9:30 — Bằng chứng và kết thúc

Trên web quản trị, mở **Báo cáo & Xuất dữ liệu**, xuất một file XLSX tồn kho hoặc yêu cầu. Nêu rõ phần này hiện nằm ở web, chưa có nút xuất file trong app native.

Mở báo cáo test trong source nếu được hỏi. Backend có test thực thi qua HTTP, kiểm tra phân quyền, trạng thái, tranh chấp chỗ, nhập/chuyển kho và rollback; xem số lượng chính xác trong báo cáo bàn giao. Không diễn đạt kết quả này thành “đã test toàn bộ trên điện thoại” hoặc “100% chức năng không lỗi”.

Chốt phần kỹ thuật bằng liên hệ môn học: component native, navigation, hooks/Context, AsyncStorage, API, phân quyền, xử lý lỗi, camera/vị trí và AI. Những giới hạn còn lại được ghi ở [FUNCTION-MATRIX.md](FUNCTION-MATRIX.md).

## Nếu gặp tình huống ngoài dự kiến

| Tình huống | Cách trình bày và xử lý |
|---|---|
| Không kết nối được API | Kiểm tra backend, Wi-Fi, IP và port; mở lại Kết nối máy chủ. Không nhận là đã gửi thành công. |
| GPS/camera chưa được cấp quyền | Nêu yêu cầu quyền; dùng tọa độ mẫu hoặc ảnh có sẵn nếu phù hợp. Ghi nhận phần native chưa chứng minh được thay vì giả lập kết quả GPS. |
| TNV không thấy việc mở | Kiểm tra yêu cầu đã duyệt, số chỗ, TNV đã được duyệt và có nhiệm vụ đang hoạt động hay không; tải lại danh sách. |
| Thiếu vật tư hoặc khác đơn vị | Trình bày cảnh báo như kết quả nghiệp vụ; chọn xuất kho thủ công đúng vật tư nếu cần, không sửa số tồn trực tiếp. |
| Quên mật khẩu | Luồng khôi phục phụ thuộc cấu hình mail backend. Demo Development có hộp thư pickup để kiểm tra; chưa cấu hình SMTP thật thì không nói email đã được gửi tới hộp thư người dùng. |

## Đối chiếu với slide MMA301

Theo [MMA301-SCOPE.md](../MMA301-SCOPE.md), chưa có rubric riêng của đề tài nên bảng dưới là đối chiếu nội dung đã áp dụng, không phải cam kết đã làm mọi ví dụ trong slide.

| Nhóm slide | Bằng chứng để chỉ trong demo/source |
|---|---|
| 1, 4, 5, 7 — React Native/Expo, component | `MOBILE/App.tsx`, `View`, `Text`, `FlatList`, component tái sử dụng; app không phải WebView bọc web Vue |
| 8, 12–17 — navigation, hooks, Context, storage, form/list | Stack/tab theo vai trò; `AppContext`; form tạo yêu cầu/quyên góp; bản nháp AsyncStorage; phiên Android dùng SecureStore |
| 19–21 — lỗi, kiểm thử, APK | Kiểm tra dữ liệu, lỗi API/mạng, script kiểm thử; build APK là bước đóng gói riêng, kiểm thử điện thoại thật phải được ghi nhận riêng |
| 22–31 — thông báo, SQLite, API/remote database | Thông báo trong app qua API; SQLite ở backend; chưa có push nền và chưa dùng SQLite local trên thiết bị |
| 32 — AI, Maps, Image Picker | Phân loại Naive Bayes; GPS + mở Maps bên ngoài; chọn/chụp ảnh hiện trường. AI hiện chỉ xử lý văn bản |
