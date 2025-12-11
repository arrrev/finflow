-- Seed Initial Data (Accounts & Categories)
-- Note: You must update the user_id (1) if your user has a different ID.
-- Typically, the first user you register will have ID 1.

-- Create default Account
INSERT INTO accounts (user_id, name, color, default_currency, ordering)
VALUES (1, 'Cash', '#fbbf24', 'AMD', 1)
ON CONFLICT DO NOTHING;

INSERT INTO accounts (user_id, name, color, default_currency, ordering)
VALUES (1, 'Bank Card', '#60a5fa', 'AMD', 2)
ON CONFLICT DO NOTHING;

-- Create default Categories
INSERT INTO categories (user_id, name, color, ordering)
VALUES 
    (1, 'Housing', '#f87171', 1),
    (1, 'Food', '#34d399', 2),
    (1, 'Transportation', '#60a5fa', 3),
    (1, 'Utilities', '#a78bfa', 4),
    (1, 'Insurance', '#f472b6', 5),
    (1, 'Healthcare', '#facc15', 6),
    (1, 'Saving & Investing', '#22c55e', 7),
    (1, 'Personal Spending', '#fb923c', 8),
    (1, 'Entertainment', '#e879f9', 9),
    (1, 'Miscellaneous', '#94a3b8', 10)
ON CONFLICT DO NOTHING;
