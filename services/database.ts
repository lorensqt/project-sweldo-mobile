import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDBConnection = async () => {
  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = await SQLite.openDatabaseAsync('sweldo_app.db');
  return dbInstance;
};

export const createTables = async (db: SQLite.SQLiteDatabase) => {
  try {
    // Enable Foreign Keys
    await db.execAsync('PRAGMA foreign_keys = ON;');
    console.log('PRAGMA foreign_keys executed');

    // Salary Settings Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS salary_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        basic_salary REAL NOT NULL,
        schedule TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('salary_settings table created');

    // Savings Buckets Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS savings_buckets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        target_amount REAL,
        current_balance REAL DEFAULT 0,
        image_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('savings_buckets table created');

    // Deductions Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS deductions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount_type TEXT NOT NULL, -- 'fixed' or 'percent'
        amount REAL NOT NULL,
        schedule_linked TEXT, -- '15th', '30th', 'both'
        savings_bucket_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (savings_bucket_id) REFERENCES savings_buckets(id) ON DELETE SET NULL
      );
    `);
    console.log('deductions table created');

    // Other Incomes Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS other_incomes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount_type TEXT DEFAULT 'fixed',
        amount REAL NOT NULL,
        schedule_linked TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('other_incomes table created');

    // Savings Transactions Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS savings_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        savings_bucket_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- 'deposit' or 'withdrawal'
        amount REAL NOT NULL,
        description TEXT,
        transaction_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (savings_bucket_id) REFERENCES savings_buckets(id) ON DELETE CASCADE
      );
    `);
    console.log('savings_transactions table created');

    // Payslips Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS payslips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        net_pay REAL NOT NULL,
        gross_pay REAL NOT NULL,
        total_deductions REAL NOT NULL,
        pay_period_start TEXT NOT NULL,
        pay_period_end TEXT NOT NULL,
        deductions_snapshot TEXT NOT NULL, -- JSON String
        other_incomes_snapshot TEXT, -- JSON String
        status TEXT DEFAULT 'processed',
        date_processed TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('payslips table created');

    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error in createTables:', error);
    throw error;
  }
};

export const initDatabase = async () => {
  try {
    const db = await getDBConnection();
    await createTables(db);
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
