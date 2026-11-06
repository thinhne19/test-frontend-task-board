# Frontend Task Board

- Live Demo: https://test-frontend-task-board.vercel.app/
- GitHub Repo: https://github.com/thinhne19/test-frontend-task-board

Ứng dụng quản lý công việc (Task Board) xây dựng với React 18, TypeScript (strict mode) và Vite. Hỗ trợ 2 chế độ xem là Danh sách (có virtualization) và bảng Kanban kéo thả, dữ liệu lưu qua tầng service bất đồng bộ trên LocalStorage và đồng bộ giữa các tab.

## 1. Cài đặt và chạy dự án

Yêu cầu máy đã cài Node.js (khuyến nghị bản 18 hoặc 20 LTS).

```bash
# Cài đặt thư viện
npm install

# Chạy server dev (http://localhost:5173)
npm run dev

# Kiểm tra lỗi lint
npm run lint

# Chạy unit test (Vitest)
npm test

# Build bản production
npm run build
```

## 2. Kiến trúc và luồng dữ liệu

Mã nguồn được chia theo feature tại `src/features/tasks/` để tách biệt phần giao diện, state và tầng xử lý dữ liệu:

- `types/`: Định nghĩa kiểu dữ liệu `Task`, `Subtask` và trạng thái bộ lọc.
- `schemas/`: Chứa schema Zod dùng chung cho cả form tạo mới, popup chỉnh sửa và chức năng kiểm tra file JSON khi import.
- `services/`: `taskService.ts` đóng vai trò giả lập API bất đồng bộ (trả về Promise có độ trễ ngắn). Mọi thao tác đọc/ghi vào `localStorage` đều đi qua tầng này, sau này nếu nối vào backend thật chỉ cần đổi nội dung các hàm trong `taskService` mà không phải sửa lại các component bên trên.
- `store/`: `useTaskStore.ts` (Zustand) quản lý danh sách task và bộ lọc. Khi người dùng thêm/sửa/xóa hoặc kéo thả, store sẽ cập nhật giao diện ngay lập tức (Optimistic UI) rồi mới gọi xuống `taskService`. Nếu service báo lỗi thì store tự khôi phục lại mảng task cũ (rollback) và hiển thị thông báo lỗi.
- `hooks/`: Tách các xử lý phụ như `useDebounce` (300ms cho ô tìm kiếm), `useNowTick` (cập nhật lại thời gian mỗi phút để kiểm tra task quá hạn), `useFocusTrap` (giữ focus trong popup và hỗ trợ phím Esc) và `useUrlSync` (đồng bộ bộ lọc lên URL).

Sơ đồ luồng dữ liệu chính:

```text
[Component UI] <--- (đồng bộ 2 chiều) ---> [URL Query Params & Route /tasks/:id]
      |
      | (1) Gọi action (thêm, sửa, xóa, kéo thả)
      v
[Zustand Store] ---> (2) Cập nhật UI ngay (Optimistic Update)
      |
      | (3) Gọi hàm async
      v
[taskService] -----> (4a) Thành công: Lưu vào LocalStorage & bắn BroadcastChannel sang tab khác
      |
      +------------> (4b) Nếu lỗi: Ném exception để Store rollback về dữ liệu cũ
```

## 3. Lý do chọn thư viện

- **State Management (Zustand)**: Dự án có nhiều thao tác cập nhật tức thời (kéo thả, tick subtask, lọc kết hợp) và cần lưu lại snapshot dữ liệu cũ để rollback khi lỗi. Dùng Zustand gọn hơn Redux Toolkit khá nhiều, không phải bọc nhiều Context Provider và dễ viết các hàm async ngay trong store.
- **Form & Validation (React Hook Form + Zod)**: Form của bài có nhiều ràng buộc (tiêu đề không được trùng với task chưa xong, deadline không ở quá khứ, giới hạn 5 tag, danh sách subtask động). Kết hợp Zod (`superRefine`) với React Hook Form giúp gom toàn bộ điều kiện kiểm tra về một chỗ ở `taskSchema.ts` và tái sử dụng lại cho cả lúc tạo mới lẫn lúc sửa trong Modal.
- **Kéo thả (@dnd-kit/core & @dnd-kit/sortable)**: Tương thích tốt với React 18 StrictMode (không bị lỗi deprecated như `react-beautiful-dnd`), hỗ trợ kéo thả đổi vị trí trong cùng cột cũng như kéo sang cột khác để đổi trạng thái.
- **Virtualization (@tanstack/react-virtual)**: Khi danh sách lên tới 1.000 task, mỗi thẻ lại có chiều cao khác nhau tùy theo mô tả và số tag. `@tanstack/react-virtual` hỗ trợ đo chiều cao thực tế (`measureElement`) và chỉ render khoảng hơn 10 thẻ đang nằm trong khung nhìn nên cuộn rất mượt.

## 4. Các đánh đổi (Trade-offs) và hướng cải thiện nếu có thêm thời gian

**Đánh đổi đã chấp nhận:**
- Chỉ bật virtualization ở chế độ xem Danh sách (List view). Ở chế độ Kanban, nếu vừa dùng `@tanstack/react-virtual` vừa kéo thả `@dnd-kit` xuyên qua các cột sẽ dễ gặp lỗi lệch tọa độ khi thẻ bị ẩn khỏi DOM lúc cuộn nhanh, nên mình ưu tiên giữ cuộn mặc định cho cột Kanban và bọc `React.memo` cho từng `TaskCard`.
- Phần đồng bộ đa tab dùng `BroadcastChannel` kết hợp sự kiện `storage` theo hướng tab nào lưu sau sẽ ghi đè dữ liệu mới nhất, phù hợp với phạm vi lưu trữ trên trình duyệt cá nhân.

**Nếu có thêm thời gian sẽ làm tiếp:**
- Tìm giải pháp kết hợp virtualization vào bên trong từng cột Kanban khi một cột có quá nhiều thẻ.
- Viết thêm E2E test với Playwright để test tự động thao tác kéo thả và mở nhiều tab.
- Hỗ trợ chọn nhiều task cùng lúc để đổi trạng thái hoặc xóa hàng loạt.

## 5. Danh sách tính năng

**Đã hoàn thành:**
- [x] Khởi tạo dữ liệu mẫu 50 task và nút nạp dữ liệu khi danh sách trống (có thêm nút tạo nhanh 1.000 task để tiện kiểm tra độ mượt).
- [x] Chế độ Danh sách có virtualization, hiển thị đầy đủ thông tin, tiến độ subtask, giờ tương đối và giờ chính xác khi di chuột vào.
- [x] Tìm kiếm theo tiêu đề và mô tả (debounce 300ms) kèm tô sáng (highlight) từ khóa khớp.
- [x] Lọc kết hợp nhiều trạng thái, nhiều mức độ ưu tiên, theo tag, theo khoảng thời hạn và 4 kiểu sắp xếp.
- [x] Thống kê nhanh đầu trang (tổng số, theo từng trạng thái, số quá hạn, tỉ lệ hoàn thành).
- [x] Chế độ Kanban 3 cột, kéo thả đổi cột (tự cập nhật `completedAt`) và đổi thứ tự trong cột.
- [x] Popup chi tiết (`/tasks/:id`): sửa trực tiếp mọi trường, thêm/sửa/xóa/tick subtask, cảnh báo khi đóng mà chưa lưu, xác nhận xóa kèm nút Hoàn tác (Undo) trong 5 giây.
- [x] Đóng popup bằng phím Esc, giữ focus trong popup và trả focus về lại thẻ sau khi đóng.
- [x] Nhãn cảnh báo "Quá hạn" và "Sắp hết hạn" (< 24h), tự động kiểm tra lại mỗi phút không cần tải lại trang.
- [x] Lưu trữ qua tầng service, có Optimistic Update + Rollback (có nút giả lập lỗi service trên thanh công cụ để test thử).
- [x] Giữ nguyên dữ liệu, bộ lọc, sắp xếp, từ khóa và popup đang mở khi bấm F5; đồng bộ tự động giữa các tab đang mở.
- [x] Xuất toàn bộ task ra file JSON và nhập lại có kiểm tra lỗi chi tiết từng bản ghi.

**Chưa hoàn thành:**
- Đã hoàn thành đầy đủ các yêu cầu trong đề bài.
