-- USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'user', -- 'user', 'admin', 'support'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_url VARCHAR(256),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- COMPANIES
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- COMPANY_USERS (many-to-many)
CREATE TABLE company_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role_in_company VARCHAR(32) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
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
CREATE TABLE settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT
);

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