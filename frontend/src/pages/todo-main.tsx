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

// Địa chỉ API (Giữ nguyên nếu đã đúng IP)
const API_URL = 'http://192.168.1.85:30006/todos/api';

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
    <div className="flex flex-col items-center justify-center min-h-svh w-full">
      <h1 className={'text-6xl my-5 font-[cursive] font-bold text-shadow-md'}>
        ToDos (K8s Final V2)
      </h1>
      <div className={'flex gap-2 rounded-md flex-stretch w-2/3 '}>
        <Button
          className={'hover:cursor-pointer border-2'}
          onClick={handleSubmit}
        >
          Add task
        </Button>
        <Input
          className={cn(
            'border-4',
            placeHolder !== 'Add task'
              ? 'placeholder:text-red-300 italic'
              : 'placeholder:text-gray-400'
          )}
          value={value}
          type="text"
          placeholder={placeHolder}
          onKeyDown={handleKeyDown}
          onChange={(e) => handleInput(e)}
        />
        <Select value={selectFilter} onValueChange={handleFilter}>
          <SelectTrigger className={'border-4'}>
            <SelectValue defaultValue={'All'} placeholder={'All'}></SelectValue>
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
      </div>

      <div
        className={
          'grid grid-cols-1 gap-2 mt-2 bg-gray-300 p-4 rounded-md w-2/3'
        }
      >
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
            <TodoItem
              todo={todo}
              key={current.id}
              deleteTodo={handleRemove}
              editTodo={handleEdit}
              isEditTodo={todo.editMode}
              changeMode={changeMode}
              handleComplete={handleChecked}
            />
          );
        })}
      </div>
    </div>
  );
}

export default TodoMain;
