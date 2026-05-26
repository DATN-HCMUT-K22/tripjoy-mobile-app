---
description: Tự động tạo và cập nhật 1 file báo cáo research duy nhất mỗi session, thêm vào mỗi khi có research mới
---

# Auto Research Report — 1 File Per Session

// turbo-all

## Nguyên tắc cốt lõi

Mỗi conversation session (hoặc mỗi task lớn) chỉ có **MỘT file report duy nhất**:
- **Tên file linh hoạt & có ý nghĩa:** Đặt tên file phản ánh nội dung chính của session, ví dụ `.agents/reports/setup-skill-scout-report.md` hoặc `.agents/reports/implement-auth-feature-report.md`. **Không đặt tên chung chung.**
- Lần đầu research → **TẠO MỚI** file report ứng với task hiện tại
- Các lần research tiếp theo trong cùng task → **CẬP NHẬT / THÊM VÀO** file đó (không tạo thêm file mới)

Mục tiêu: File này là "nhật ký" tổng hợp toàn bộ những gì đã trao đổi & research trong session, giúp theo dõi tiến trình liên tục.

---

## Quy trình

### Bước 1: Xác định Tên File và Kiểm tra Tồn tại
Xác định một tên file có ý nghĩa dựa trên mục tiêu hiện tại (ví dụ: `setup-skill-scout-report.md`).
Trước khi tạo hoặc cập nhật, kiểm tra xem file report này đã tồn tại chưa:
- **Chưa có** → Tạo mới với cấu trúc đầy đủ (xem bên dưới)
- **Đã có** → Dùng `multi_replace_file_content` để thêm section mới vào cuối file

### Bước 2: Thực hiện Research
Hoàn thành toàn bộ quá trình research (search_web, read_url_content, phân tích code, lên kế hoạch...).

### Bước 3: Cập nhật File Report

#### Nếu TẠO MỚI (lần đầu):
Dùng `write_to_file` với `Overwrite: false`:

```markdown
# Session Research Report
**Conversation ID:** <conversation-id>  
**Ngày bắt đầu:** YYYY-MM-DD  
**Mục tiêu session:** [Mô tả ngắn mục tiêu chính của session này]

---

## [Research #1] — HH:MM — <Chủ đề>

### Câu hỏi / Yêu cầu
[Người dùng hỏi / yêu cầu gì]

### Các nguồn đã khảo sát
- [URL / file / resource đã đọc]

### Phát hiện chính
- [Những điểm quan trọng tìm được]

### Quyết định / Hành động
[Kết luận và bước tiếp theo]

---
```

#### Nếu CẬP NHẬT (lần tiếp theo):
Dùng `multi_replace_file_content` để **append** section mới vào cuối:

```markdown
## [Research #N] — HH:MM — <Chủ đề>

### Câu hỏi / Yêu cầu
[...]

### Các nguồn đã khảo sát
- [...]

### Phát hiện chính
- [...]

### Quyết định / Hành động
[...]

---
```

### Bước 4: Thông báo ngắn gọn
Sau khi cập nhật xong, thông báo ngắn:
> 📝 Session report đã được cập nhật (Research #N: <chủ đề>)

---

## Lưu ý quan trọng
- **Không bao giờ** tạo file report mới trong cùng 1 conversation
- Số thứ tự `#N` tăng dần theo mỗi lần research
- Thời gian dùng định dạng `HH:MM` theo giờ địa phương của người dùng
- Nếu một topic research rất lớn, có thể chia thành nhiều subsection trong cùng 1 block
- Luôn ghi lại **Quyết định / Hành động** để dễ trace back sau này
