import { getDBConnection } from './database';

export interface OtherIncome {
  id: number;
  name: string;
  amount_type: 'fixed' | 'percent'; // e.g., 'fixed', 'percent'
  amount: number;
  schedule_linked: string; // e.g., '15th', '30th', 'both', 'none'
}

export const getOtherIncomes = async (): Promise<OtherIncome[]> => {
  const db = await getDBConnection();
  try {
    return await db.getAllAsync<OtherIncome>('SELECT * FROM other_incomes ORDER BY id DESC;', []);
  } catch (error) {
    console.error('Error fetching other incomes:', error);
    return [];
  }
};

export const addOtherIncome = async (
  name: string,
  amountType: 'fixed' | 'percent',
  amount: number,
  scheduleLinked: string
): Promise<boolean> => {
  const db = await getDBConnection();
  try {
    await db.runAsync(
      'INSERT INTO other_incomes (name, amount_type, amount, schedule_linked) VALUES (?, ?, ?, ?);',
      name, amountType, amount, scheduleLinked
    );
    return true;
  } catch (error) {
    console.error('Error adding other income:', error);
    return false;
  }
};

export const updateOtherIncome = async (
  id: number,
  name: string,
  amountType: 'fixed' | 'percent',
  amount: number,
  scheduleLinked: string
): Promise<boolean> => {
  const db = await getDBConnection();
  try {
    await db.runAsync(
      'UPDATE other_incomes SET name = ?, amount_type = ?, amount = ?, schedule_linked = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
      name, amountType, amount, scheduleLinked, id
    );
    return true;
  } catch (error) {
    console.error('Error updating other income:', error);
    return false;
  }
};

export const deleteOtherIncome = async (id: number): Promise<boolean> => {
  const db = await getDBConnection();
  try {
    await db.runAsync('DELETE FROM other_incomes WHERE id = ?;', id);
    return true;
  } catch (error) {
    console.error('Error deleting other income:', error);
    return false;
  }
};
