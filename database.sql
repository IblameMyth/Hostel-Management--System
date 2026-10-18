-- Ycce Hostel Management System (MySQL)
-- Roles are intentionally limited to warden and student; no admin role/table.
CREATE DATABASE IF NOT EXISTS haven_hostel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE haven_hostel;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('warden','student') NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  must_change_password TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Starter Warden account requested for the mini-project.
-- Email: warden123@gmail.com | Password: warden123
-- This is a PHP password_hash() compatible hash, not a plaintext password.
INSERT INTO users (full_name, email, password_hash, role, must_change_password)
VALUES ('Hostel Warden', 'warden123@gmail.com', '$2y$12$7/VSx7ZjD62gSrR6Nl98DeHuhABovlIz5BJEZ.NX7KU5Qzy/6dsTW', 'warden', 1);

CREATE TABLE students (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  student_number VARCHAR(40) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  room_number VARCHAR(30) NULL,
  course VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE attendance (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('present','absent','leave') NOT NULL,
  marked_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_attendance_day (student_id, attendance_date),
  CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_warden FOREIGN KEY (marked_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE student_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  request_type ENUM('leave','maintenance','other') NOT NULL DEFAULT 'other',
  subject VARCHAR(180) NOT NULL,
  details TEXT NOT NULL,
  status ENUM('pending','approved','rejected','resolved') NOT NULL DEFAULT 'pending',
  warden_response TEXT NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  CONSTRAINT fk_requests_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_requests_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE announcements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_announcements_author FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- Student users are created by the warden in the future backend. Store password_hash(),
-- never a plaintext password. Enforce permissions in backend code, not in HTML/CSS.
-- Warden: create/edit students, mark attendance, review requests, publish announcements.
-- Student: read own attendance and published announcements, submit own requests.
