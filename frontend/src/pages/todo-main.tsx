import TodoItem, { type TodoType } from '@/components/TodoItem.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { cn } from 'clsx-for-tailwind';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { Star } from 'lucide-react';
import * as React from 'react';
import { produce } from 'immer';
import axios from 'axios';

const getApiUrl = () => {
  // Ưu tiên 1: Đọc từ ConfigMap của Kubernetes (Runtime)
  // @ts-ignore
  if (window.ENV && window.ENV.TODO_API_URL) {
    console.log('🚀 Đang dùng Config từ K8s:', window.ENV.TODO_API_URL);
    return window.ENV.TODO_API_URL;
  }
  // Ưu tiên 2: Đọc từ file .env (Build time - dùng cho Local Dev)
  if (import.meta.env.VITE_API_URL) {
    console.log(
      '⚠️ Đang dùng biến môi trường .env:',
      import.meta.env.VITE_API_URL
    );
    return import.meta.env.VITE_API_URL;
  }

  // Ưu tiên 3: Giá trị cứng (Fallback cuối cùng)
  return 'http://localhost:8080/todos';
};

// API base URL: prefer env (set at build-time), fallback to relative path
const API_BASE = getApiUrl();
const API_URL = API_BASE ? `${API_BASE}/api` : '/todos/api';

function TodoMain() {
  const [value, setValue] = React.useState('');
  const [selectFilter, setSelectFilter] = React.useState('All');
  const [listFilter, setListFilter] = React.useState<TodoType[]>([]);
  const [placeHolder, setPlaceHolder] = React.useState('Add task');
  const [tasks, setTasks] = React.useState<TodoType[]>([]);

  React.useEffect(() => {
    fetchTodos();
  }, []);

  // --- 1. SỬA HÀM LẤY DỮ LIỆU (MAPPING) ---
  const fetchTodos = async () => {
    try {
      const response = await axios.get(`${API_URL}/list-todo`);

      // Backend trả về: { id, content, done, dueDate }
      // Frontend cần: { id, content, checkedTodo, date }
      // => Phải Map (chuyển đổi) lại
      const mappedData = response.data.map((task: any) => ({
        id: task.id,
        content: task.content,
        checkedTodo: task.done, // Map 'done' -> 'checkedTodo'
        date: task.dueDate, // Map 'dueDate' -> 'date'
        editMode: false,
      }));

      setTasks(mappedData);
    } catch (error) {
      console.error('Lỗi tải danh sách:', error);
    }
  };

  // --- 2. SỬA HÀM THÊM MỚI (SUBMIT) ---
  const handleSubmit = async () => {
    if (value === '') {
      setPlaceHolder('Please enter a task');
      return;
    }

    // Tạo object chuẩn theo Todo.java
    const todoPayload = {
      // KHÔNG GỬI ID (Để Backend tự sinh)
      content: value,
      done: false, // Java cần 'done', không phải 'checkedTodo'
      dueDate: new Date().toISOString().split('T')[0], // Java cần 'yyyy-MM-dd'
    };

    try {
      const response = await axios.post(`${API_URL}/todo`, todoPayload);

      // Backend trả về object đã lưu (có ID thật)
      // Ta cần map lại để hiển thị lên UI
      const newTodoFromBackend = {
        id: response.data.id,
        content: response.data.content,
        checkedTodo: response.data.done,
        date: response.data.dueDate,
        editMode: false,
      };

      const newTasks = produce(tasks, (draft: TodoType[]) => {
        draft.push(newTodoFromBackend);
      });
      setTasks(newTasks);

      setValue('');
      setPlaceHolder('Add task');
    } catch (error) {
      console.error('Lỗi thêm mới:', error);
      alert('Không thể kết nối tới Backend hoặc Lỗi dữ liệu!');
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  async function handleRemove(id: string) {
    try {
      await axios.delete(`${API_URL}/todo/${id}`);

      const newTasks = produce(tasks, (draft: TodoType[]) => {
        const index = draft.findIndex((task) => task.id === id); // Lưu ý: id backend là số, nhưng JS so sánh lỏng lẻo nên vẫn ổn
        if (index !== -1) draft.splice(index, 1);
      });
      setTasks(newTasks);
    } catch (error) {
      console.error('Lỗi xóa:', error);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // --- 3. SỬA HÀM UPDATE NỘI DUNG ---
  async function handleEdit(id: string, content: string) {
    const currentTask = tasks.find((t) => t.id === id);
    if (!currentTask) return;

    // Chuẩn bị payload gửi đi (Map ngược lại UI -> Java)
    const payload = {
      id: id,
      content: content,
      done: currentTask.checkedTodo, // 'checkedTodo' -> 'done'
      dueDate: currentTask.date, // 'date' -> 'dueDate'
    };

    try {
      await axios.patch(`${API_URL}/todo/${id}`, payload);

      const newTasks = produce(tasks, (draft: TodoType[]) => {
        const task = draft.find((task) => task.id === id);
        if (task) task.content = content;
      });
      setTasks(newTasks);
    } catch (error) {
      console.error('Lỗi sửa nội dung:', error);
    }
  }

  const changeMode = (id: string) => {
    const newTasks = produce(tasks, (draft: TodoType[]) => {
      draft.forEach((task) => {
        task.editMode = task.id === id;
      });
    });
    setTasks(newTasks);
  };

  // --- 4. SỬA HÀM UPDATE TRẠNG THÁI (DONE) ---
  async function handleChecked(id: string) {
    const currentTask = tasks.find((t) => t.id === id);
    if (!currentTask) return;

    const newStatus = !currentTask.checkedTodo;

    // Chuẩn bị payload (Map UI -> Java)
    const payload = {
      id: id,
      content: currentTask.content,
      done: newStatus, // Gửi trạng thái mới vào trường 'done'
      dueDate: currentTask.date,
    };

    try {
      await axios.patch(`${API_URL}/todo/${id}`, payload);

      const newTasks = produce(tasks, (draft: TodoType[]) => {
        const task = draft.find((task) => task.id === id);
        if (task) task.checkedTodo = newStatus;
      });
      setTasks(newTasks);
    } catch (error) {
      console.error('Lỗi check hoàn thành:', error);
    }
  }

  // ... (Phần Filter và Render UI giữ nguyên) ...
  const handleFilter = (value: string) => {
    setSelectFilter(value);
    const filtered =
      value === 'Processing'
        ? tasks.filter((task) => !task.checkedTodo)
        : value === 'Completed'
        ? tasks.filter((task) => task.checkedTodo)
        : tasks;
    setListFilter(filtered);
  };

  React.useEffect(() => {
    const filtered =
      selectFilter === 'Processing'
        ? tasks.filter((task) => !task.checkedTodo)
        : selectFilter === 'Completed'
        ? tasks.filter((task) => task.checkedTodo)
        : tasks;
    setListFilter(filtered);
  }, [tasks, selectFilter]);

  return (
    <div className="min-h-svh w-full bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="inline-flex items-center gap-2">
              <Star className="w-8 h-8 text-yellow-500" />
              ToDos
            </span>
          </h1>
          <span className="hidden md:inline text-sm text-slate-500 dark:text-slate-400">
            K8s Final V2
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/80 dark:bg-slate-800/70 shadow-sm backdrop-blur">
          <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 md:gap-4 items-center">
              <Input
                className={cn(
                  'border-2 focus-visible:ring-2 focus-visible:ring-offset-0',
                  placeHolder !== 'Add task'
                    ? 'placeholder:text-red-300 italic'
                    : 'placeholder:text-slate-400'
                )}
                value={value}
                type="text"
                placeholder={placeHolder}
                onKeyDown={handleKeyDown}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInput(e)
                }
              />
              <Select value={selectFilter} onValueChange={handleFilter}>
                <SelectTrigger className={'border-2'}>
                  <SelectValue
                    defaultValue={'All'}
                    placeholder={'All'}
                  ></SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Status</SelectLabel>
                    <SelectItem value={'All'}>All</SelectItem>
                    <SelectItem value={'Completed'}>Completed</SelectItem>
                    <SelectItem value={'Processing'}>Processing</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                className={
                  'hover:cursor-pointer border-2 transition-colors duration-200 bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600'
                }
                onClick={handleSubmit}
              >
                Add task
              </Button>
            </div>
          </div>

          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {tasks.filter((t) => !t.checkedTodo).length}
                </span>{' '}
                processing •{' '}
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {tasks.filter((t) => t.checkedTodo).length}
                </span>{' '}
                completed
              </div>
            </div>

            <div className={'grid grid-cols-1 gap-3'}>
              {listFilter.map((current) => {
                const todo: TodoType = {
                  id: current.id,
                  content: current.content,
                  icon: <Star className="w-5 h-5 text-yellow-500" />,
                  date: current.date,
                  editMode: current.editMode,
                  checkedTodo: current.checkedTodo,
                };
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-3 hover:shadow-md transition-shadow">
                    <TodoItem
                      todo={todo}
                      key={current.id}
                      deleteTodo={handleRemove}
                      editTodo={handleEdit}
                      isEditTodo={todo.editMode}
                      changeMode={changeMode}
                      handleComplete={handleChecked}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TodoMain;
