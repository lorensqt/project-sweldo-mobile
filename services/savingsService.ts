import { getDBConnection } from './database';

export interface SavingsBucket {
  id: number;
  name: string;
  target_amount: number | null;
  current_balance: number;
  image_url?: string | null;
}

export const getSavingsBuckets = async (): Promise<SavingsBucket[]> => {
  const db = await getDBConnection();
  try {
    return await db.getAllAsync<SavingsBucket>('SELECT * FROM savings_buckets ORDER BY id DESC;', []); // Explicit empty params
  } catch (error) {
    console.error('Error fetching savings buckets:', error);
    return [];
  }
};

export const addSavingsBucket = async (
  name: string,
  targetAmount: number | null,
  imageUrl: string | null = null
): Promise<boolean> => {
  const db = await getDBConnection();
  try {
    await db.runAsync(
      'INSERT INTO savings_buckets (name, target_amount, current_balance, image_url) VALUES (?, ?, 0, ?);',
      name, targetAmount, imageUrl
    );
    return true;
  } catch (error) {
    console.error('Error adding savings bucket:', error);
    return false;
  }
};

export const updateSavingsBucket = async (
  id: number,
  name: string,
  targetAmount: number | null,
  imageUrl: string | null = null
): Promise<boolean> => {
  const db = await getDBConnection();
  try {
    await db.runAsync(
      'UPDATE savings_buckets SET name = ?, target_amount = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
      name, targetAmount, imageUrl, id
    );
    return true;
  } catch (error) {
    console.error('Error updating savings bucket:', error);
    return false;
  }
};

export const deleteSavingsBucket = async (id: number): Promise<boolean> => {
  const db = await getDBConnection();
  try {
    await db.runAsync('DELETE FROM savings_buckets WHERE id = ?;', id);
    return true;
  } catch (error) {
    console.error('Error deleting savings bucket:', error);
    return false;
  }
};
