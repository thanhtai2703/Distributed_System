package com.superkid.stats.Model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StatsResponse {
    private int totalTodos;
    private int completedTodos;
    private int pendingTodos;
    private double completionRate;
    private int totalUsers;
}
