-- USERS
INSERT INTO users (username, email, password_hash, role, is_active, avatar_url)
VALUES
  ('admin', 'admin@companysync.local', '$2b$10$QwQwQwQwQwQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQw', 'admin', true, 'https://via.placeholder.com/40'),
  ('user1', 'user1@mail.com', '$2b$10$QwQwQwQwQwQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQw', 'user', true, 'https://via.placeholder.com/40'),
  ('manager', 'manager@mail.com', '$2b$10$QwQwQwQwQwQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQw', 'user', true, 'https://via.placeholder.com/40'),
  ('testuser', 'testuser@mail.com', '$2b$10$QwQwQwQwQwQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQw', 'user', true, 'https://via.placeholder.com/40'),
  ('demo', 'demo@mail.com', '$2b$10$QwQwQwQwQwQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQw', 'user', true, 'https://via.placeholder.com/40');

-- COMPANIES
INSERT INTO companies (name) VALUES ('Acme Corp'), ('Globex'), ('Umbrella'), ('Wayne Enterprises'), ('Stark Industries');

-- COMPANY_USERS
INSERT INTO company_users (user_id, company_id, role_in_company)
VALUES (1, 1, 'owner'), (2, 1, 'member'), (2, 2, 'owner'), (3, 3, 'owner'), (4, 4, 'member'), (5, 5, 'owner');

-- LOGS
INSERT INTO logs (user_id, action, details)
VALUES (1, 'Создал компанию', '{"company": "Acme Corp"}'),
       (2, 'Вошёл в систему', NULL),
       (3, 'Добавил сотрудника', '{"user": "testuser"}'),
       (4, 'Удалил компанию', '{"company": "Globex"}'),
       (5, 'Обновил профиль', NULL);

-- PLANS
INSERT INTO plans (name, price, description, max_companies, max_users, features) VALUES
  ('Free', 0, 'Базовый бесплатный тариф', 1, 3, '{"companies": 1, "employees": 3, "reports": "Нет", "notes": "Нет", "analytics": "Нет"}'),
  ('Pro', 990, 'Для малого и среднего бизнеса', 10, 50, '{"companies": 10, "employees": 50, "reports": "Да", "notes": "Да", "analytics": "Базовая"}'),
  ('Enterprise', 4990, 'Для крупных компаний', 100, 1000, '{"companies": 100, "employees": 1000, "reports": "Да", "notes": "Да", "analytics": "Расширенная"}');

-- SUBSCRIPTIONS
INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, status)
VALUES (2, 2, '2024-06-01', '2024-12-01', 'active'),
       (3, 3, '2024-05-01', '2024-11-01', 'active'),
       (4, 1, '2024-04-01', '2024-10-01', 'inactive'),
       (5, 2, '2024-03-01', '2024-09-01', 'active');

-- SETTINGS
INSERT INTO settings (key, value) VALUES
  ('site_title', 'CompanySync'),
  ('support_email', 'support@companysync.local'),
  ('email_notifications', 'true');

-- FILES
INSERT INTO files (company_id, user_id, filename, url, mimetype, size, version)
VALUES
  (1, 1, 'Устав компании.pdf', '/uploads/ustav1.pdf', 'application/pdf', 123456, 1),
  (1, 2, 'Список сотрудников.xlsx', '/uploads/staff1.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 23456, 1),
  (2, 3, 'Договор аренды.docx', '/uploads/dogovor2.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 34567, 1),
  (3, 3, 'Финансовый отчет 2024.pdf', '/uploads/fin2024.pdf', 'application/pdf', 45678, 1); 