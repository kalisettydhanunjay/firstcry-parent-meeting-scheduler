-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS firstcry_intellitots_meetings;
USE firstcry_intellitots_meetings;

-- Drop tables if they exist (in order of dependencies)
DROP TABLE IF EXISTS meetings;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS users;

-- TABLE: users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('parent', 'teacher', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE: teachers
CREATE TABLE teachers (
    id INT PRIMARY KEY,
    teacher_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- TABLE: meetings
CREATE TABLE meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    teacher_id INT NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    class_name VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_time VARCHAR(50) NOT NULL, -- Stored as "09:00 AM - 09:30 AM" or time string
    reason TEXT NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Rescheduled', 'Rejected', 'Completed') DEFAULT 'Pending',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);
