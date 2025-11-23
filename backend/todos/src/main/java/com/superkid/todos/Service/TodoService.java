package com.superkid.todos.Service;

import com.superkid.todos.Entity.Todo;
import com.superkid.todos.Repository.TodoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TodoService {

    private final TodoRepository todoRepository;

    public Todo postTodo(Todo todo) {
        return todoRepository.save(todo);
    }

    public List<Todo> getAllTodo() {
        return todoRepository.findAll();
    }

    public Todo getTodoById(Long id) {
        return todoRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("not found id"));
    }

    public void deleteTodoById(Long id) {
        todoRepository.deleteById(id);
    }

    public void updateTodoById(Long id, Todo todo) {
        Optional<Todo> optionalTodo = todoRepository.findById(id);
        if (optionalTodo.isPresent()) {
            Todo exsistingTodo = optionalTodo.get();

            exsistingTodo.setContent(todo.getContent());
            exsistingTodo.setDueDate(todo.getDueDate());
            exsistingTodo.setDone(todo.isDone());

            todoRepository.save(exsistingTodo);
        }
    }

}
