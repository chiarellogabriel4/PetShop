const { Pool } = require('pg');

function createPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL ausente no arquivo .env.');
  const url = new URL(process.env.DATABASE_URL);
  // Explicit certificate verification; never downgrade to rejectUnauthorized:false.
  url.searchParams.set('sslmode', 'verify-full');
  return new Pool({ connectionString: url.toString(), max: 5, connectionTimeoutMillis: 15000, idleTimeoutMillis: 30000 });
}

async function migrate(pool) {
  // Additive, namespaced tables: never alter unrelated Neon tables.
  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS helppatas;
    CREATE TABLE IF NOT EXISTS helppatas.users (
      id uuid PRIMARY KEY, name text NOT NULL, surname text NOT NULL DEFAULT '',
      email text NOT NULL UNIQUE, password_hash text NOT NULL,
      role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin','staff')),
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS helppatas.sessions (
      token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES helppatas.users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON helppatas.sessions(expires_at);
    CREATE TABLE IF NOT EXISTS helppatas.bookings (
      id uuid PRIMARY KEY, customer_id uuid REFERENCES helppatas.users(id) ON DELETE SET NULL,
      customer_name text NOT NULL, customer_email text NOT NULL DEFAULT '',
      pet_name text NOT NULL, pet_type text NOT NULL, service text NOT NULL,
      date date NOT NULL, time time NOT NULL, price numeric(10,2) NOT NULL CHECK (price >= 0),
      status text NOT NULL CHECK (status IN ('Pendente','Confirmado','Em atendimento','Concluído','Cancelado')),
      notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS bookings_customer_idx ON helppatas.bookings(customer_id);
    CREATE INDEX IF NOT EXISTS bookings_date_idx ON helppatas.bookings(date);
    DO $$
    BEGIN
      ALTER TABLE helppatas.users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE helppatas.users ADD CONSTRAINT users_role_check CHECK (role IN ('customer','admin','staff'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
}
module.exports = { createPool, migrate };
