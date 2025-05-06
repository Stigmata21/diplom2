-- FINANCIAL REPORTS
CREATE TABLE IF NOT EXISTS financial_reports (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(128) NOT NULL,
    period VARCHAR(64) NOT NULL,
    type VARCHAR(32) NOT NULL,
    data JSONB NOT NULL,
    file_url VARCHAR(255),
    status VARCHAR(16) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Добавляем индексы для ускорения запросов
CREATE INDEX IF NOT EXISTS idx_financial_reports_company_id ON financial_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_author_id ON financial_reports(author_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_created_at ON financial_reports(created_at);

-- Демо данные для тестирования (опционально)
INSERT INTO financial_reports (company_id, author_id, title, period, type, data, status)
VALUES 
(1, 1, 'Квартальный отчет Q1 2024', 'Q1 2024', 'Квартальный', 
 '{"income": 550000, "expenses": 320000, "profit": 230000}', 'active'),
(1, 1, 'Годовой отчет 2023', '2023', 'Годовой', 
 '{"income": 2100000, "expenses": 1800000, "profit": 300000}', 'active'),
(1, 1, 'Бюджет на 2024', '2024', 'Бюджет', 
 '{"budget": 2500000, "spent": 550000, "remaining": 1950000}', 'active'),
(2, 2, 'Квартальный отчет Q1 2024', 'Q1 2024', 'Квартальный', 
 '{"income": 720000, "expenses": 450000, "profit": 270000}', 'active'),
(3, 3, 'Прогноз на 2024-2026', '2024-2026', 'Прогноз', 
 '{"shortTerm": {"income": 900000, "expenses": 800000, "profit": 100000}, 
   "midTerm": {"income": 1200000, "expenses": 950000, "profit": 250000}, 
   "longTerm": {"income": 1600000, "expenses": 1100000, "profit": 500000}}', 
 'active'); 