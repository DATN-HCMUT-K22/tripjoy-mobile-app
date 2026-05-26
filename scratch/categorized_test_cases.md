# Test Case Design Categorized by Module

## Module: Social & Community (MD01)

| ID | Use Case | Mô tả | Đầu vào | Đầu ra mong đợi | Trạng thái |
|---|---|---|---|---|---|
| TC-MD01-01 | UC-MD01-01 | Xem danh sách bài đăng công khai | Không | Hiển thị danh sách bài đăng công khai | Implemented |
| TC-MD01-02 | UC-MD01-01 | Xem chi tiết một bài đăng | Chọn bài đăng | Hiển thị đầy đủ nội dung bài đăng | Implemented |
| TC-MD01-03 | UC-MD01-02 | Xem danh sách lượt thích | Bài đăng hợp lệ | Hiển thị danh sách user đã like | Implemented soon |
| TC-MD01-04 | UC-MD01-03 | Xem tất cả bình luận | Bài đăng | Hiển thị toàn bộ bình luận | Implemented |
| TC-MD01-06 | UC-MD01-05 | Xem trang cá nhân public | UserID | Hiển thị bài đăng, thông tin, nút nhắn tin | Implemented |
| TC-MD01-07 | UC-MD01-06 | Tạo bài đăng hợp lệ | Nội dung, ảnh/video | Bài đăng xuất hiện trong feed | Implemented |
| TC-MD01-08 | UC-MD01-06 | Tạo bài đăng không có nội dung | Không nhập gì | Lỗi: “Nội dung không được để trống” | Implemented |
| TC-MD01-09 | UC-MD01-07 | Like bài đăng | - | Like tăng 1 | Implemented |
| TC-MD01-10 | UC-MD01-07 | Bỏ Like | - | Like giảm 1 | Implemented |
| TC-MD01-11 | UC-MD01-08 | Bình luận bài đăng | Nội dung comment | Comment xuất hiện | Implemented |
| TC-MD01-12 | UC-MD01-08 | Sửa bình luận | Nội dung mới | Comment được cập nhật | Implemented soon |
| TC-MD01-13 | UC-MD01-09 | Reply bình luận người khác | Nội dung | Reply xuất hiện dưới comment cha | Implemented |
| TC-MD01-14 | UC-MD01-10 | Xóa bình luận cá nhân | - | Comment bị xoá | Implemented |
| TC-MD01-15 | UC-MD01-11 | Chia sẻ bài vào nhóm | GroupID | Bài được chia sẻ | Implemented |
| TC-MD01-16 | UC-MD01-12 | Áp dụng lịch trình | Lịch trình + Group | Lịch trình được áp dụng | Not implemented |
| TC-MD01-17 | UC-MD01-13 | Lưu bài đăng | - | Bài vào danh sách yêu thích | Implemented |
| TC-MD01-18 | UC-MD01-13 | Bỏ lưu bài đăng | - | Bài bị xóa khỏi danh sách | Implemented |
| TC-MD01-19 | UC-MD01-14 | Xem profile bản thân | - | Hiển thị thông tin | Implemented |
| TC-MD01-20 | UC-MD01-14.1 | Xem lịch trình đã đi | - | Hiển thị danh sách | Implemented |
| TC-MD01-21 | UC-MD01-14.2 | Xem lịch trình yêu thích | - | Hiển thị danh sách | Implemented soon |
| TC-MD01-22 | UC-MD01-15 | Xem bài đã lưu | - | Hiển thị danh sách bài đã lưu | Implemented |
| TC-MD01-23 | UC-MD01-16 | Xem bài đăng của tôi | - | Hiển thị danh sách bài đăng | Implemented |
| TC-MD01-24 | UC-MD01-17 | Sửa nội dung bài đăng | - | Nội dung được cập nhật | Implemented |
| TC-MD01-25 | UC-MD01-18 | Xóa bài đăng | - | Post bị xoá khỏi feed | Implemented |
| TC-MD01-26 | UC-MD01-21 | Xem danh sách báo cáo | - | Hiển thị danh sách báo cáo | Implemented |
| TC-MD01-27 | UC-MD01-22 | Xem báo cáo bình luận | - | Hiển thị chi tiết | Implemented |
| TC-MD01-28 | UC-MD01-23 | Xử lý vi phạm | - | Báo cáo được xử lý | Implemented |
| TC-MD01-29 | UC-MD01-24 | Xem thống kê hệ thống | - | Hiển thị biểu đồ và số liệu | Implemented |

## Module: Group & Chat (MD02)

| ID | Use Case | Mô tả | Đầu vào | Đầu ra mong đợi | Trạng thái |
|---|---|---|---|---|---|
| TC-MD02-01 | UC-MD02-01 | Xem danh sách nhóm | - | Hiển thị danh sách nhóm | Implemented |
| TC-MD02-02 | UC-MD02-02 | Tạo nhóm | Tên nhóm + thành viên mời | Nhóm được tạo | Implemented |
| TC-MD02-03 | UC-MD02-04 | Truy cập group | - | Hiển thị tin nhắn + thành viên | Implemented |
| TC-MD02-04 | UC-MD02-05 | Nhắn bot | @Bot message | Bot trả lời trong nhóm | Implemented |
| TC-MD02-05 | UC-MD02-06 | Xem lịch sử tin nhắn | - | Hiển thị lịch sử chat | Implemented |
| TC-MD02-06 | UC-MD02-07 | Gửi tin nhắn | Tin nhắn | Tin xuất hiện trong group | Implemented |
| TC-MD02-07 | UC-MD02-08 | Reply tin nhắn | Nội dung phản hồi | Reply hiển thị đúng luồng | Implemented |
| TC-MD02-08 | UC-MD02-09 | Like tin nhắn | - | Tin được like | Implemented |
| TC-MD02-09 | UC-MD02-09 | Unlike tin nhắn | - | Like bị gỡ | Implemented |
| TC-MD02-10 | UC-MD02-10 | Thu hồi tin | - | Tin nhắn bị thu hồi, hiển thị placeholder | Implemented soon |
| TC-MD02-11 | UC-MD02-11 | Xem mô tả nhóm | - | Hiển thị tên nhóm, creator, thành viên | Implemented |
| TC-MD02-12 | UC-MD02-12 | Rời nhóm | - | Người dùng bị xoá khỏi nhóm | Implemented |
| TC-MD02-13 | UC-MD02-13 | Xóa thành viên | UserID | Thành viên bị xóa | Implemented |
| TC-MD02-14 | UC-MD02-14 | Thay đổi vai trò | UserID | Vai trò được cập nhật | Implemented |

## Module: AI Planning & Suggestions (MD03)

| ID | Use Case | Mô tả | Đầu vào | Đầu ra mong đợi | Trạng thái |
|---|---|---|---|---|---|
| TC-MD03-01 | UC-MD03-09 | Xem danh sách địa điểm AI gợi ý | Không | Hiển thị danh sách địa điểm được AI gợi ý | Implemented |
| TC-MD03-02 | UC-MD03-09 | Xem chi tiết 1 địa điểm gợi ý | Chọn địa điểm | Hiển thị mô tả, ảnh, lịch mở cửa, bản đồ… | Implemented soon |
| TC-MD03-03 | UC-MD03-09 | Áp dụng 1 địa điểm AI gợi ý vào lịch trình nháp | Địa điểm | Địa điểm được thêm vào lịch trình nháp | Not Evaluated |
| TC-MD03-04 | UC-MD03-09 | Từ chối gợi ý AI | - | Địa điểm được ẩn hoặc đánh dấu “Không phù hợp” | Not Evaluated |
| TC-MD03-05 | UC-MD03-10 | Xóa lịch trình nháp hợp lệ | DraftID | Draft bị xóa hoàn toàn | Implemented |
| TC-MD03-06 | UC-MD03-10 | Xóa draft khi không có quyền | DraftID của người khác | Lỗi: “Bạn không có quyền xóa lịch trình này” | Not Evaluated |
| TC-MD03-07 | UC-MD03-11 | Yêu cầu AI tạo lịch trình mới | Số ngày, ngân sách, sở thích | AI tạo lịch trình mới | Implemented |
| TC-MD03-08 | UC-MD03-11 | AI tạo lịch trình thất bại (input lỗi) | Input không hợp lệ | Lỗi: “Không thể tạo lịch trình — dữ liệu không hợp lệ” | Not Evaluated |
| TC-MD03-09 | UC-MD03-12 | Xem gợi ý khách sạn | - | Hiển thị danh sách khách sạn | Coming soon |
| TC-MD03-10 | UC-MD03-12 | Xem gợi ý di chuyển | - | Hiển thị taxi, xe buýt, thuê xe | Coming soon |
| TC-MD03-11 | UC-MD03-12 | Xem gợi ý ăn uống | - | Hiển thị nhà hàng, món ăn | Coming soon |
| TC-MD03-12 | UC-MD03-13 | Xem sổ tay du lịch | - | Hiển thị văn hóa, tips, lưu ý an toàn | Implemented |
| TC-MD03-13 | UC-MD03-13 | Xem lưu ý quan trọng | - | Hiển thị cảnh báo quan trọng | Not Evaluated |
| TC-MD03-14 | UC-MD03-14 | Chốt lịch trình thành công | - | Lịch trình chuyển thành trạng thái “Final” | Implemented |
| TC-MD03-15 | UC-MD03-14 | Chốt lịch trình khi thiếu thông tin | Missing data | Lỗi: “Lịch trình chưa đầy đủ” | Not Evaluated |
| TC-MD03-16 | UC-MD03-15 | Thêm vào ưa thích | - | Lịch trình được thêm vào danh sách ưa thích | Implemented soon |
| TC-MD03-17 | UC-MD03-16 | Xem sổ tay cho lịch trình đã chốt | - | Hiển thị đầy đủ thông tin chuẩn bị trước chuyến đi | Implemented |

## Module: Trip Management & Expenses (MD04)

| ID | Use Case | Mô tả | Đầu vào | Đầu ra mong đợi | Trạng thái |
|---|---|---|---|---|---|
| TC-MD04-01 | UC-MD04-01 | Xem lịch trình đang diễn ra | - | Hiển thị timeline & địa điểm | Implemented |
| TC-MD04-02 | UC-MD04-01 | Xem lịch trình sắp diễn ra | - | Hiển thị lịch trình chờ bắt đầu | Not Evaluated |
| TC-MD04-03 | UC-MD04-02 | Thêm địa điểm | Thông tin địa điểm | Địa điểm mới được thêm | Implemented |
| TC-MD04-04 | UC-MD04-02 | Xóa địa điểm | LocationID | Địa điểm bị xóa | Implemented |
| TC-MD04-05 | UC-MD04-02 | Thay thế địa điểm | OldID + NewID | Lịch trình được cập nhật | Cần test lại |
| TC-MD04-06 | UC-MD04-02 | Thêm bằng gợi ý AI | SuggestionID | Địa điểm được thêm vào lịch trình | Implemented soon |
| TC-MD04-07 | UC-MD04-02 | Không có quyền chỉnh sửa | User không phải phó nhóm | Lỗi: “Bạn không có quyền chỉnh sửa” | Not Evaluated |
| TC-MD04-08 | UC-MD04-03 | Xem mô tả địa điểm | - | Hiển thị mô tả, ảnh | Implemented |
| TC-MD04-09 | UC-MD04-03 | Xem nhà hàng gần đó | - | Hiển thị danh sách | Not Evaluated |
| TC-MD04-10 | UC-MD04-03 | Xem thời tiết | - | Hiển thị thời tiết hiện tại | Implemented |
| TC-MD04-11 | UC-MD04-04 | Xem gợi ý AI | - | Hiển thị khách sạn, ăn uống, di chuyển | Coming soon |
| TC-MD04-12 | UC-MD04-05 | Xem danh sách chi phí | - | Hiển thị chi phí theo hạng mục | Implemented |
| TC-MD04-13 | UC-MD04-05 | Xem tổng chi phí | - | Hiển thị tổng tiền | implemented |
| TC-MD04-14 | UC-MD04-06 | Thêm chi phí | Loại + số tiền | Chi phí được thêm | Implemented |
| TC-MD04-15 | UC-MD04-06 | Sửa chi phí | ExpenseID + new value | Chi phí cập nhật | Implemented soon |
| TC-MD04-16 | UC-MD04-06 | Xóa chi phí | ExpenseID | Chi phí bị xóa | Implemented |
| TC-MD04-17 | UC-MD04-06 | Lỗi khi thêm chi phí không hợp lệ | Giá tiền âm | Lỗi: “Giá trị không hợp lệ” | Implemented soon |

## Module: Authentication & Account (MD05)

| ID | Use Case | Mô tả | Đầu vào | Đầu ra mong đợi | Trạng thái |
|---|---|---|---|---|---|
| TC-MD05-01 | UC-MD05-01 | Đăng ký tài khoản hợp lệ | Email hợp lệ, mật khẩu đủ mạnh, xác nhận mật khẩu khớp | Tài khoản được tạo thành công, hệ thống chuyển sang trang đăng nhập hoặc tự động đăng nhập | Implemented |
| TC-MD05-02 | UC-MD05-01 | Đăng ký với email đã tồn tại | Email đã có trong DB | Báo lỗi: “Email đã được sử dụng” | Implemented |
| TC-MD05-03 | UC-MD05-01 | Đăng ký với mật khẩu không đạt yêu cầu | Mật khẩu < 6 ký tự hoặc không đủ ký tự đặc biệt | Báo lỗi: “Mật khẩu không hợp lệ” | Implemented |
| TC-MD05-04 | UC-MD05-01 | Xác nhận mật khẩu không khớp | Password ≠ Confirm Password | Báo lỗi: “Mật khẩu xác nhận không khớp” | Implemented |
| TC-MD05-05 | UC-MD05-01 | Đăng ký với email không hợp lệ | Email sai định dạng | Báo lỗi định dạng email | Implemented |
| TC-MD05-06 | UC-MD05-02 | Đăng nhập hợp lệ | Email + Mật khẩu đúng | Đăng nhập thành công, chuyển sang dashboard | Implemented |
| TC-MD05-07 | UC-MD05-02 | Sai mật khẩu | Email đúng, password sai | Hiển thị lỗi: “Sai mật khẩu” | Implemented |
| TC-MD05-08 | UC-MD05-02 | Email không tồn tại | Email không có trong DB | “Tài khoản không tồn tại” | Implemented |
| TC-MD05-09 | UC-MD05-02 | Bỏ trống thông tin | Empty form | Hiển thị lỗi yêu cầu nhập | Implemented |
| TC-MD05-10 | UC-MD05-03 | Đăng nhập Gmail hợp lệ | Tài khoản Gmail hợp lệ | Đăng nhập thành công, user được tạo nếu chưa tồn tại | Comming soon |
| TC-MD05-11 | UC-MD05-03 | Từ chối quyền truy cập Gmail | Người dùng nhấn “Cancel” | Quay lại form login, báo lỗi “Không thể xác thực Gmail” | Comming soon |
| TC-MD05-12 | UC-MD05-03 | Gmail không hợp lệ | Gmail không tồn tại hoặc bị khóa | Hiển thị lỗi từ Google API | Comming soon |
| TC-MD05-13 | UC-MD05-04 | Đăng xuất thành công | - | Phiên đăng nhập bị xoá, trở về màn hình login | Implemented |
| TC-MD05-14 | UC-MD05-04 | Đăng xuất khi session hết hạn | - | Hệ thống reload và chuyển về login | Implemented |
| TC-MD05-15 | UC-MD05-05 | Gửi yêu cầu reset mật khẩu hợp lệ | Email tồn tại | Hệ thống gửi email reset | Not Found |
| TC-MD05-16 | UC-MD05-05 | Email không tồn tại | Email sai | Hiển thị lỗi “Email không tồn tại” | Not Evaluated |
| TC-MD05-17 | UC-MD05-05 | Bỏ trống email | - | Lỗi yêu cầu nhập email | Not Evaluated |
| TC-MD05-18 | UC-MD05-05 | Link reset hết hạn | Click link quá hạn | Hiển thị thông báo “Link reset đã hết hạn” | Not Evaluated |
| TC-MD05-19 | UC-MD05-06 | Xem thông tin hợp lệ | - | Hiển thị đầy đủ thông tin cá nhân | Implemented |
| TC-MD05-20 | UC-MD05-06 | Truy cập khi chưa login | - | Chuyển sang trang login | Implemented |
| TC-MD05-21 | UC-MD05-07 | Thay đổi thông tin hợp lệ | Tên mới, tuổi, email phụ,... | Cập nhật thành công | Implemented |
| TC-MD05-22 | UC-MD05-07 | Nhập dữ liệu không hợp lệ | Tuổi âm, tên rỗng,… | Lỗi: “Dữ liệu không hợp lệ” | Not Evaluated |
| TC-MD05-23 | UC-MD05-07 | Email bị trùng với tài khoản khác | Email mới = email đã tồn tại ở user khác | Lỗi: “Email đã tồn tại” | Implemented |
| TC-MD05-24 | UC-MD05-08 | Đổi mật khẩu hợp lệ | Old pass đúng + new pass hợp lệ | Thay đổi mật khẩu thành công | Implemented |
| TC-MD05-25 | UC-MD05-08 | Sai mật khẩu cũ | Old pass sai | Lỗi: “Mật khẩu cũ không đúng” | Not Evaluated |
| TC-MD05-26 | UC-MD05-08 | Mật khẩu mới không hợp lệ | Password quá yếu | Lỗi validation | Not Evaluated |
| TC-MD05-27 | UC-MD05-08 | Mật khẩu mới trùng mật khẩu cũ | New pass = old pass | Lỗi: “Mật khẩu mới không được trùng mật khẩu cũ” | Not Evaluated |

