import type { Task, TaskPriority, TaskStatus } from '../types/task';

const SAMPLE_TOPICS = [
  'Thiết kế lại giao diện trang Dashboard',
  'Tối ưu hiệu năng hiển thị danh sách lớn',
  'Tích hợp đăng nhập OAuth2 và làm mới token',
  'Cấu hình bộ component cơ bản với Tailwind',
  'Viết unit test cho các hàm lọc và validate',
  'Setup pipeline CI chạy tự động trên GitHub',
  'Xử lý rò rỉ bộ nhớ ở sự kiện lắng nghe dữ liệu',
  'Cải thiện tốc độ tải trang lần đầu (LCP)',
  'Làm chức năng kéo thả thẻ công việc sang cột khác',
  'Đồng bộ dữ liệu khi mở nhiều tab trình duyệt',
  'Validate form tạo mới và chỉnh sửa với Zod',
  'Bổ sung điều hướng bàn phím cho cửa sổ popup',
  'Refactor lại tầng gọi service tách khỏi UI',
  'Viết tài liệu hướng dẫn cài đặt vào README',
  'Đồng bộ bộ lọc tìm kiếm lên thanh địa chỉ URL',
  'Cập nhật cấu hình Vite và kiểm tra bundle',
  'Bắt lỗi khi dữ liệu nhập từ file JSON bị sai định dạng',
  'Thêm hộp thoại xác nhận trước khi xóa task',
  'Hiển thị cảnh báo cho các công việc sắp hết hạn',
  'Làm thanh tiến độ checklist công việc con',
];

const SAMPLE_DESCRIPTIONS = [
  'Trao đổi lại với team để chốt cấu trúc dữ liệu.\nKiểm tra kỹ trường hợp lỗi thì phải khôi phục lại trạng thái ban đầu trên giao diện.',
  'Test thử với số lượng bản ghi lớn xem lúc cuộn có bị khựng không.\nƯu tiên chỉ render các dòng nằm trong vùng nhìn thấy.',
  'Code bật strict mode trong TypeScript, hạn chế dùng kiểu dữ liệu lỏng lẻo.\nKiểm tra các trường hợp nhập thiếu hoặc quá số ký tự cho phép.',
  'Khi mở modal cần hỗ trợ bấm phím Esc để đóng nhanh.\nLúc đóng xong thì trả con trỏ focus về lại thẻ vừa bấm.',
  'Đảm bảo khi bấm F5 trình duyệt vẫn giữ nguyên các điều kiện đang lọc và chế độ xem hiện tại.',
];

const SAMPLE_TAGS = [
  'frontend',
  'performance',
  'ui-ux',
  'bugfix',
  'refactor',
  'testing',
  'feature',
  'urgent-fix',
  'docs',
  'chore',
];

const SUBTASK_TEMPLATES = [
  'Đọc kỹ yêu cầu và liệt kê các trường hợp cần xử lý',
  'Viết logic xử lý chính và tách hàm dùng chung',
  'Kiểm tra validation khi nhập dữ liệu sai',
  'Test lại trên trình duyệt ở cả 2 chế độ xem',
  'Kiểm tra lại code trước khi đẩy lên nhánh chính',
];

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

function createUuid(index: number): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateSeedTasks(count: number = 50): Task[] {
  const now = Date.now();
  const hourMs = 3600 * 1000;
  const dayMs = 24 * hourMs;

  const orderByStatus: Record<TaskStatus, number> = {
    todo: 0,
    in_progress: 0,
    done: 0,
  };

  const tasks: Task[] = [];

  for (let i = 0; i < count; i++) {
    const status = STATUSES[i % STATUSES.length]!;
    const priority = PRIORITIES[(i * 3 + 1) % PRIORITIES.length]!;
    const baseTopic = SAMPLE_TOPICS[i % SAMPLE_TOPICS.length]!;
    const title = `${baseTopic} #${i + 1}`;
    const description =
      SAMPLE_DESCRIPTIONS[i % SAMPLE_DESCRIPTIONS.length] +
      `\nMã công việc: TASK-${String(i + 1).padStart(3, '0')}`;

    let deadlineOffsetMs: number;
    const mod = i % 6;
    if (mod === 0) {
      deadlineOffsetMs = -(2 + (i % 90)) * hourMs;
    } else if (mod === 1) {
      deadlineOffsetMs = (2 + (i % 20)) * hourMs;
    } else if (mod === 2) {
      deadlineOffsetMs = (6 + (i % 30)) * hourMs;
    } else {
      deadlineOffsetMs = (2 + (i % 13)) * dayMs + (i % 8) * hourMs;
    }

    const createdAtMs = now - (5 + (i % 20)) * dayMs;
    const updatedAtMs = createdAtMs + ((i % 4) + 1) * hourMs * 6;
    const deadlineMs = now + deadlineOffsetMs;

    const tagCount = (i % 3) + 1;
    const tags: string[] = [];
    for (let t = 0; t < tagCount; t++) {
      const candidate = SAMPLE_TAGS[(i + t * 3) % SAMPLE_TAGS.length]!;
      if (!tags.includes(candidate)) {
        tags.push(candidate);
      }
    }

    const subtaskCount = (i % 4) + 1;
    const subtasks = Array.from({ length: subtaskCount }, (_, sIdx) => ({
      id: `${createUuid(i * 10 + sIdx)}`,
      title: SUBTASK_TEMPLATES[sIdx % SUBTASK_TEMPLATES.length]!,
      done:
        status === 'done'
          ? true
          : status === 'in_progress'
            ? sIdx < Math.ceil(subtaskCount / 2)
            : false,
    }));

    const order = orderByStatus[status]++;

    tasks.push({
      id: createUuid(i),
      title,
      description,
      deadline: new Date(deadlineMs).toISOString(),
      status,
      priority,
      tags,
      subtasks,
      order,
      createdAt: new Date(createdAtMs).toISOString(),
      updatedAt: new Date(updatedAtMs).toISOString(),
      completedAt:
        status === 'done' ? new Date(updatedAtMs + 1800_000).toISOString() : null,
    });
  }

  return tasks;
}
