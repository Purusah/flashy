CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE CHECK(user_id > 0),
    state TEXT NOT NULL DEFAULT 'default',
    state_data JSONB
);

CREATE UNIQUE INDEX ON users (user_id);

CREATE TABLE IF NOT EXISTS definitions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    word VARCHAR(64) NOT NULL,
    definition VARCHAR(1024) NOT NULL
);

CREATE UNIQUE INDEX ON definitions (user_id, word);
CREATE UNIQUE INDEX ON definitions (user_id, definition);
