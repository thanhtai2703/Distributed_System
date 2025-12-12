package com.superkid.stats.Service;

import com.superkid.stats.Model.StatsResponse;
import com.superkid.stats.Model.Todo;
import com.superkid.stats.Model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final RestTemplate restTemplate;

    @Value("${microservices.todo-service.url}")
    private String todoServiceUrl;

    @Value("${microservices.user-service.url}")
    private String userServiceUrl;

    public StatsResponse getOverallStats() {
        // Call Todo Service to get all todos
        String todoApiUrl = todoServiceUrl + "/api/list-todo";
        List<Todo> todos = List.of();
        try {
            Todo[] todosArray = restTemplate.getForObject(todoApiUrl, Todo[].class);
            todos = todosArray != null ? Arrays.asList(todosArray) : List.of();
        } catch (Exception e) {
            // Todo service might not be available, continue with user stats
            System.out.println("Could not fetch todos: " + e.getMessage());
        }

        // Call User Service to get all users
        String userApiUrl = userServiceUrl + "/api/users";
        User[] usersArray;
        int totalUsers = 0;
        try {
            usersArray = restTemplate.getForObject(userApiUrl, User[].class);
            totalUsers = usersArray != null ? usersArray.length : 0;
        } catch (Exception e) {
            // User service might not be available, continue with todos stats
            System.out.println("Could not fetch users: " + e.getMessage());
        }

        // Calculate statistics
        int totalTodos = todos.size();
        int completedTodos = (int) todos.stream().filter(Todo::isDone).count();
        int pendingTodos = totalTodos - completedTodos;
        double completionRate = totalTodos > 0 ? (completedTodos * 100.0 / totalTodos) : 0.0;

        return new StatsResponse(
                totalTodos,
                completedTodos,
                pendingTodos,
                Math.round(completionRate * 100.0) / 100.0,
                totalUsers
        );
    }
}
