# Kết quả kiểm thử backend nghiệp vụ

Ngày chạy: 29/10/2026. Lượt cuối chạy EXE self-contained tại `http://127.0.0.1:5097/api` (lượt phát triển dùng 5095), môi trường Development với SQLite **riêng cho kiểm thử**. Không ghi dữ liệu vào backend OJT cũ hoặc dịch vụ bên ngoài.

- Build `DisasterReliefSystem.API.csproj`: thành công, 0 lỗi, 0 cảnh báo.
- `node tests/workflow-smoke.mjs http://127.0.0.1:5095/api`: thành công, **119 kiểm tra HTTP**, 9 nhóm nghiệp vụ; có thêm các assertion về nội dung và tính nhất quán dữ liệu.
- Script sử dụng Node.js tích hợp sẵn `fetch`, `assert`, `zlib`; không cần thư viện kiểm thử bổ sung.

| Nhóm kiểm thử | Điều đã xác minh |
|---|---|
| Phân quyền và ảnh | Chặn truy cập chưa đăng nhập; người khác không đọc/hủy yêu cầu; từ chối tọa độ sai, ảnh sai MIME/chữ ký và ảnh lớn hơn 1 MiB; lưu và đọc lại ảnh PNG |
| Duyệt yêu cầu và kho | Chỉ nhân sự quản lý được duyệt; bắt buộc số nhân sự mục tiêu; chỉ trừ tồn kho một lần; hủy trước vận chuyển hoàn đúng số lượng một lần; lưu lịch sử cấp phát; không đổi tên/nhóm/đơn vị vật tư đang được giữ cho yêu cầu, nhưng vẫn sửa được ngưỡng tồn kho |
| Nhiệm vụ | Nhận nhiệm vụ theo số chỗ; không nhận trùng; chủ sở hữu/nhân sự quản lý mới cập nhật được; không bỏ qua bước; kết thúc nhiệm vụ cập nhật yêu cầu |
| Tình nguyện viên | Tạo hồ sơ; chặn hồ sơ trùng; danh mục kỹ năng; thêm kỹ năng không trùng; admin duyệt đổi vai trò; xóa kỹ năng |
| Tranh chấp và hủy nhiệm vụ | Hai người đồng thời nhận chỗ cuối: một thành công, một nhận 409; gửi/duyệt/từ chối đề nghị hủy; phân công người thay thế; không hoàn kho tự động sau khi đã có lịch sử vận chuyển |
| Đơn vị tính hỗn hợp | Nhóm vật tư có kg và hộp không bị cộng/trừ như cùng đơn vị; trả cảnh báo cần xuất kho thủ công; cảnh báo tồn tại sau khi đọc lại yêu cầu |
| Quyên góp | Phải ánh xạ đủ từng dòng; đơn vị phải khớp; lỗi ở dòng thứ hai rollback thay đổi dòng thứ nhất; tạo vật tư mới; nhập đúng số lượng; không duyệt lại được |
| Đề nghị vai trò | Không tự xin Admin; không gửi nhiều đề nghị chờ duyệt; chỉ admin duyệt; không duyệt lại; vai trò mới có hiệu lực phía server |
| Thông báo, báo cáo, công khai | Thông báo theo chủ sở hữu; đọc tất cả cập nhật badge; cấm người dùng thường xuất báo cáo quản trị; XLSX đủ workbook/worksheet/relationships và nội dung là inline text, không có công thức từ dữ liệu nhập; thống kê/map/contact hoạt động; dữ liệu công khai không chứa điện thoại hoặc ảnh |

## Chạy lại an toàn

Tạo tên DB mới cho mỗi lần chạy đầy đủ vì script chủ động thêm hồ sơ, vật tư, quyên góp và lịch sử nghiệp vụ. Script chỉ chấp nhận địa chỉ loopback.

Trong terminal thứ nhất, tại thư mục `backend/DisasterReliefSystem.API`:

```powershell
dotnet build DisasterReliefSystem.API.csproj
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ASPNETCORE_URLS = 'http://127.0.0.1:5095'
$env:ConnectionStrings__DefaultConnection = 'Data Source=.local/workflow-' + [Guid]::NewGuid().ToString('N') + '.db'
dotnet bin/Debug/net10.0/DisasterReliefSystem.API.dll
```

Trong terminal thứ hai, tại thư mục `backend`:

```powershell
node tests/workflow-smoke.mjs http://127.0.0.1:5095/api
```

Tài khoản demo chỉ được seed trong Development khi `SeedDemo=true`. Các bài kiểm thử dùng mật khẩu demo `Relief@123456`, không dùng tài khoản thật. Dừng API bằng Ctrl+C khi kiểm thử xong.

## Phạm vi kết luận

Đây là kiểm thử API và dữ liệu, không thay thế kiểm thử toàn bộ giao diện Android trên thiết bị thật. SQLite deployment dùng một API instance; các thao tác kho và phân công được tuần tự hóa trong process và có transaction/concurrency checks. Đổi sang nhiều API instance cần thiết kế khóa/cơ sở dữ liệu tương ứng.

`inventoryIssues` là **lịch sử cấp phát tại lần duyệt**. Nó không tự biến thành số lượng giao nhận thực tế; các xuất/nhập thủ công sau đó được ghi trong lịch sử kho. Yêu cầu đã hủy trước vận chuyển có thể đã hoàn vật tư dù lịch sử cấp phát ban đầu còn được giữ để đối soát.

