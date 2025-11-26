import { getDBConnection } from './database';

export interface SalarySettings {
  id?: number;
  basic_salary: number;
  schedule: string;
}

export const getSalarySettings = async (): Promise<SalarySettings | null> => {
  const db = await getDBConnection();
  try {
    const result = await db.getAllAsync<SalarySettings>('SELECT * FROM salary_settings LIMIT 1;', []);
    if (result && result.length > 0) {
      return result[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching salary settings:', error);
    return null;
  }
};

export const saveSalarySettings = async (basicSalary: number, schedule: string): Promise<boolean> => {
  const db = await getDBConnection();
  try {
    // Check if settings exist
    const existing = await getSalarySettings();

    if (existing && existing.id !== undefined) {
      // Update
      await db.runAsync(
        'UPDATE salary_settings SET basic_salary = ?, schedule = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
        basicSalary, schedule, existing.id
      );
    } else {
      // Insert
      await db.runAsync(
        'INSERT INTO salary_settings (basic_salary, schedule) VALUES (?, ?);',
        basicSalary, schedule
      );
    }
    return true;
  } catch (error) {
    console.error('Error saving salary settings:', error);
    return false;
  }
};
