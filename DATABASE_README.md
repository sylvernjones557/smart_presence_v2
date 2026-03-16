# Smart Presence V4 Premium Database Architecture

This document provides a visualization and overview of the SQLite relational database architecture used by the Smart Presence backend.

## Entity Relationship Diagram (ERD)

The following diagram illustrates the data flow and relationships between all core entities in the system.

```mermaid
erDiagram
    ORGANIZATION ||--o{ GROUP : "has"
    ORGANIZATION ||--o{ STAFF : "employs"
    ORGANIZATION ||--o{ STUDENT : "enrolls"
    
    GROUP ||--o{ STUDENT : "contains"
    GROUP ||--o{ TIMETABLE : "has schedule"
    GROUP ||--o{ ATTENDANCE_SESSION : "holds"
    
    STAFF |o--o| GROUP : "is class teacher for"
    STAFF ||--o{ TIMETABLE : "assigned to teach"
    STAFF ||--o{ ATTENDANCE_SESSION : "conducts"
    
    ATTENDANCE_SESSION ||--o{ ATTENDANCE_RECORD : "contains"
    STUDENT ||--o{ ATTENDANCE_RECORD : "has"

    ORGANIZATION {
        StringUUID id PK
        String name
        DateTime created_at
    }

    GROUP {
        StringUUID id PK
        StringUUID organization_id FK
        String name
        String code "Nullable"
        Boolean is_active
        DateTime created_at
        DateTime updated_at
    }

    STAFF {
        StringUUID id PK
        StringUUID organization_id FK
        String name
        String email "Unique, Nullable"
        String staff_code "Unique, Nullable"
        String role "ADMIN or STAFF"
        String type "CLASS_TEACHER or SUBJECT_TEACHER"
        String primary_subject
        String secondary_subject
        String tertiary_subject
        StringUUID assigned_class_id FK "Nullable"
        String avatar_url "Nullable"
        String full_name "Nullable"
        Boolean is_active
        String hashed_password "Nullable"
        Boolean is_superuser
        DateTime created_at
        DateTime updated_at
    }

    STUDENT {
        StringUUID id PK
        StringUUID organization_id FK
        StringUUID group_id FK
        String name
        String roll_no "Nullable"
        String email "Nullable"
        String external_id "Nullable"
        Boolean face_data_registered
        String avatar_url "Nullable"
        Boolean is_active
        DateTime created_at
        DateTime updated_at
    }

    TIMETABLE {
        StringUUID id PK
        StringUUID group_id FK
        Integer day_of_week "1(Mon) - 7(Sun)"
        Integer period
        String subject
        StringUUID staff_id FK "Nullable"
        Time start_time "Nullable"
        Time end_time "Nullable"
        DateTime created_at
    }

    ATTENDANCE_SESSION {
        StringUUID id PK
        StringUUID group_id FK
        StringUUID created_by FK "Staff ID"
        String status "SCANNING, VERIFYING, COMPLETED"
        DateTime started_at
        DateTime ended_at "Nullable"
    }

    ATTENDANCE_RECORD {
        StringUUID id PK
        StringUUID session_id FK
        StringUUID student_id FK
        String status "PRESENT, ABSENT"
        String method "FACE, MANUAL"
        DateTime marked_at
    }
```

## Core Entities Overview

- **Organization**: The top-level tenant representing the school or institution.
- **Group (Class)**: A specific class, section, or group of students.
- **Staff**: Teachers and Administrators. Staff can be assigned as the "Class Teacher" for a group, or assigned to specific subjects across various groups.
- **Student**: The individuals enrolled in a `Group` whose attendance is being tracked. Contains flags for face recognition enrollment.
- **Timetable**: Represents the weekly schedule (periods). Maps a specific subject, staff member, and time block to a specific group on a specific day of the week.
- **Attendance Session**: A discrete event representing the act of taking attendance for a specific `Group`, initiated by a specific `Staff` member.
- **Attendance Record**: Represents one student's attendance result (Present/Absent and the method used) within a specific `Attendance Session`.
