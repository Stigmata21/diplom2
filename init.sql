-- USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'user', -- 'user', 'admin', 'support'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- COMPANIES
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    description VARCHAR(256),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- COMPANY_USERS (many-to-many)
CREATE TABLE company_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role_in_company VARCHAR(32) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    salary integer DEFAULT 0,
    note text DEFAULT '',
    UNIQUE(user_id, company_id)
);

-- LOGS (admin/user actions)
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(128) NOT NULL,
    details JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- PLANS
CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    max_companies INTEGER NOT NULL,
    max_users INTEGER NOT NULL,
    features JSONB NOT NULL
);

-- SUBSCRIPTIONS (если нужны)
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES plans(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'active'
);

-- SETTINGS (глобальные параметры)
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT
);

-- Значения по умолчанию для поддержки
INSERT INTO settings (key, value) VALUES
  ('supportAvatarUrl', '/avatar-support.png') ON CONFLICT (key) DO NOTHING,
  ('activeSupportModeratorId', NULL) ON CONFLICT (key) DO NOTHING;

-- FILES
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    filename VARCHAR(256) NOT NULL,
    url VARCHAR(512) NOT NULL,
    mimetype VARCHAR(64) NOT NULL,
    size INTEGER NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- COMPANY_LOGS
CREATE TABLE IF NOT EXISTS company_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(64) NOT NULL,
    meta JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы участников компаний
CREATE TABLE IF NOT EXISTS company_members (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL
);

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    status VARCHAR(16) NOT NULL DEFAULT 'open', -- open, closed
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- NOTES
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(128) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- FINANCE RECORDS
CREATE TABLE IF NOT EXISTS finance_records (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(16) NOT NULL, -- income, expense
    category VARCHAR(32) NOT NULL,
    amount NUMERIC(16,2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'RUB',
    description TEXT,
    status VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- FINANCE FILES (attachments to records)
CREATE TABLE IF NOT EXISTS finance_files (
    id SERIAL PRIMARY KEY,
    record_id INTEGER NOT NULL REFERENCES finance_records(id) ON DELETE CASCADE,
    filename VARCHAR(256) NOT NULL,
    url VARCHAR(512) NOT NULL,
    mimetype VARCHAR(64) NOT NULL,
    size INTEGER NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- SUPPORT MESSAGES
CREATE TABLE IF NOT EXISTS support_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- SUPPORT CHAT (реальный чат поддержки)
CREATE TABLE IF NOT EXISTS support_chat (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    moderator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    from_moderator BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
); 