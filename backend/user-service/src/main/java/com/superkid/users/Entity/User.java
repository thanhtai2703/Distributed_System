package com.superkid.users.Entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String username;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    private String fullName;
    
    private String role; // "Developer", "Designer", "Manager", etc.
    
    private String department; // "Engineering", "Marketing", "Sales", etc.
    
    private boolean active = true;
}
