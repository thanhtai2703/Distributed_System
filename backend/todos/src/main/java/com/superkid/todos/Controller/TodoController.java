package com.superkid.todos.Controller;

import com.superkid.todos.Entity.Todo;
import com.superkid.todos.Service.TodoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Cho phép frontend truy cập
public class TodoController {
    private final TodoService todoService;

    @PostMapping("/todo")
    public Todo postTodo(@RequestBody Todo todo) {
        return todoService.postTodo(todo);
    }

    @GetMapping("/list-todo")
    public List<Todo> listTodo() {
        return todoService.getAllTodo();
    }

    @GetMapping("/todo/{id}")
    public Todo getTodo(@PathVariable Long id) {
        return todoService.getTodoById(id);
    }

    @DeleteMapping("/todo/{id}")
    public void deleteTodo(@PathVariable Long id) {
        todoService.deleteTodoById(id);
    }

    @PatchMapping("/todo/{id}")
    public void updateTodo(@PathVariable Long id, @RequestBody Todo todo) {
        todoService.updateTodoById(id, todo);
    }
}
