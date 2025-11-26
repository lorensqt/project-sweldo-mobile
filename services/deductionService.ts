import { getDBConnection } from './database';

export interface Deduction {
  id: number;
  name: string;
  amount_type: 'fixed' | 'percent';
  amount: number;
  schedule_linked: string; // '15th', '30th', 'both'
  savings_bucket_id?: number | null;
}

export const getDeductions = async (): Promise<Deduction[]> => {
  const db = await getDBConnection();
  try {
    return await db.getAllAsync<Deduction>('SELECT * FROM deductions ORDER BY id DESC;', []);
  } catch (error) {
    console.error('Error fetching deductions:', error);
    return [];
  }
};

export const addDeduction = async (
  name: string,
  amountType: 'fixed' | 'percent',
  amount: number,
  scheduleLinked: string,
  savingsBucketId: number | null = null
): Promise<boolean> => {
  const db = await getDBConnection();
  try {
    await db.runAsync(
      'INSERT INTO deductions (name, amount_type, amount, schedule_linked, savings_bucket_id) VALUES (?, ?, ?, ?, ?);',
      name, amountType, amount, scheduleLinked, savingsBucketId
    );
    return true;
  } catch (error) {
    console.error('Error adding deduction:', error);
    return false;
  }
};

export const updateDeduction = async (
  id: number,
  name: string,
  amountType: 'fixed' | 'percent',
  amount: number,
  scheduleLinked: string,
  savingsBucketId: number | null = null
): Promise<boolean> => {
  const db = await getDBConnection();
  try {
    await db.runAsync(
      'UPDATE deductions SET name = ?, amount_type = ?, amount = ?, schedule_linked = ?, savings_bucket_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
      name, amountType, amount, scheduleLinked, savingsBucketId, id
    );
    return true;
  } catch (error) {
    console.error('Error updating deduction:', error);
    return false;
  }
};

export const deleteDeduction = async (id: number): Promise<boolean> => {
  const db = await getDBConnection();
  try {
    await db.runAsync('DELETE FROM deductions WHERE id = ?;', id);
    return true;
  } catch (error) {
    console.error('Error deleting deduction:', error);
    return false;
  }
};
