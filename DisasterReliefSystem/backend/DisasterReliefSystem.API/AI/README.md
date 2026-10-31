# AI phân loại nhu cầu cứu trợ

Mô hình `relief-nb-vi-demo-1.0` là **Multinomial Naive Bayes**, được huấn luyện lúc backend khởi động bằng `training-data.json`: 72 câu tiếng Việt tự biên soạn, 12 câu cho mỗi nhóm Food, Water, Medicine, Blanket, Shelter, Other. Không cần API key, không gửi mô tả ra dịch vụ bên ngoài.

Pipeline: chuyển chữ thường → chuẩn hóa dấu tiếng Việt → bỏ từ dừng → unigram/bigram → đếm từ theo lớp → xác suất tiên nghiệm và likelihood với Laplace smoothing → log posterior → softmax với temperature 2. Mô hình học các tham số từ dữ liệu, không dùng bảng từ khóa để gán lớp. Không gặp từ vựng đã học thì trả Other, confidence 0 và không gợi ý hàng.

API yêu cầu đăng nhập:

- `GET /api/ai/status`: phiên bản, số câu huấn luyện, các nhóm, mô tả.
- `POST /api/ai/analyze` với `{ "text": "Cần gạo và thực phẩm" }`: nhóm dự đoán, phân bố xác suất, giải thích, hàng thực tế đang có trong kho, `requiresHumanReview: true`.

Đối chiếu hàng tồn theo nhóm là truy vấn dữ liệu thông thường, không phải một mô hình AI thứ hai. AI không tự phê duyệt, trừ kho, xếp mức ưu tiên, kê thuốc hay phân công nhiệm vụ. Người phụ trách xác nhận mọi quyết định.

`backend/tests/core-smoke.mjs` kiểm tra 12 câu mới không nằm nguyên văn trong dữ liệu huấn luyện, hai câu mỗi nhóm; lần kiểm thử đầu đạt 12/12. Đây chỉ là smoke test tự biên soạn với dữ liệu nhỏ, **không đại diện cho độ chính xác triển khai thực tế**. Điểm confidence là xác suất tương đối của mô hình, chưa được hiệu chuẩn. Các mô tả nhiều nhu cầu, phủ định, tiếng địa phương và tiếng Anh có thể bị phân loại sai. Muốn triển khai cần thu thập dữ liệu được phép sử dụng, chia train/validation/test độc lập, đánh giá theo lớp và kiểm tra trên tình huống thực tế.

Tài nguyên huấn luyện là dữ liệu tổng hợp cho đồ án, không chứa thông tin cá nhân của người được cứu trợ. Có thể sửa các ví dụ và khởi động lại backend để huấn luyện lại; giữ bộ đánh giá tách biệt.
