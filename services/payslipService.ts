import { getDBConnection } from './database';
import { getSalarySettings } from './salaryService';
import { getDeductions, Deduction } from './deductionService';
import { getOtherIncomes, OtherIncome } from './otherIncomeService';

export interface Payslip {
  id: number;
  net_pay: number;
  gross_pay: number;
  total_deductions: number;
  pay_period_start: string;
  pay_period_end: string;
  deductions_snapshot: string; // JSON
  other_incomes_snapshot: string | null; // JSON
  status: string;
  date_processed: string;
}

export type CalculatedDeduction = Deduction & { calculated_amount: number };
export type CalculatedIncome = OtherIncome & { calculated_amount: number };

export interface PayslipCalculation {
  gross_pay: number;
  net_pay: number;
  total_deductions: number;
  deductions: CalculatedDeduction[];
  other_incomes: CalculatedIncome[];
  period_start: string;
  period_end: string;
}

export const getPayslips = async (): Promise<Payslip[]> => {
  const db = await getDBConnection();
  try {
    return await db.getAllAsync<Payslip>('SELECT * FROM payslips ORDER BY date_processed DESC;', []);
  } catch (error) {
    console.error('Error fetching payslips:', error);
    return [];
  }
};

export const getPayslipById = async (id: number): Promise<Payslip | null> => {
  const db = await getDBConnection();
  try {
    const result = await db.getAllAsync<Payslip>('SELECT * FROM payslips WHERE id = ?;', [id]);
    if (result && result.length > 0) {
      return result[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching payslip by id:', error);
    return null;
  }
};

export const calculatePayslip = async (payDate: Date, scheduleType: '15th' | '30th'): Promise<PayslipCalculation | null> => {
  try {
    const salarySettings = await getSalarySettings();
    if (!salarySettings) {
      console.warn('No salary settings found');
      return null;
    }

    const basicSalary = salarySettings.basic_salary;
    const schedule = salarySettings.schedule; 
    
    let basePay = basicSalary;
    if (schedule === '15/30') {
        basePay = basicSalary / 2;
    } else if (schedule === 'monthly-30') {
        if (scheduleType === '15th') basePay = 0; 
        else basePay = basicSalary;
    }

    const allDeductions = await getDeductions();
    const allIncomes = await getOtherIncomes();

    // Filter relevant items
    const activeDeductions = allDeductions.filter(d => 
        d.schedule_linked === 'both' || d.schedule_linked === scheduleType
    );
    
    const activeIncomes = allIncomes.filter(i => 
        i.schedule_linked === 'both' || i.schedule_linked === scheduleType
    );

    // Calculate Incomes
    let totalOtherIncome = 0;
    const calculatedIncomes: CalculatedIncome[] = activeIncomes.map(inc => {
        let amt = 0;
        if (inc.amount_type === 'fixed') {
            amt = inc.amount;
        } else {
            amt = (inc.amount / 100) * basePay; 
        }
        totalOtherIncome += amt;
        return { ...inc, calculated_amount: amt };
    });

    const grossPay = basePay + totalOtherIncome;

    // Calculate Deductions
    let totalDeductions = 0;
    const calculatedDeductions: CalculatedDeduction[] = activeDeductions.map(ded => {
        let amt = 0;
        if (ded.amount_type === 'fixed') {
            amt = ded.amount;
        } else {
            amt = (ded.amount / 100) * basePay;
        }
        totalDeductions += amt;
        return { ...ded, calculated_amount: amt };
    });

    const netPay = grossPay - totalDeductions;

    // Define Period
    const year = payDate.getFullYear();
    const month = payDate.getMonth() + 1;
    const periodStart = scheduleType === '15th' 
        ? `${year}-${month.toString().padStart(2, '0')}-01` 
        : `${year}-${month.toString().padStart(2, '0')}-16`;
    
    const periodEnd = scheduleType === '15th'
        ? `${year}-${month.toString().padStart(2, '0')}-15`
        : `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`; 

    return {
        gross_pay: grossPay,
        net_pay: netPay,
        total_deductions: totalDeductions,
        deductions: calculatedDeductions,
        other_incomes: calculatedIncomes,
        period_start: periodStart,
        period_end: periodEnd
    };

  } catch (error) {
    console.error('Error calculating payslip:', error);
    return null;
  }
};

export const savePayslip = async (calculation: PayslipCalculation): Promise<boolean> => {
  const db = await getDBConnection();
  try {
    // 1. Save Payslip
    await db.runAsync(
      `INSERT INTO payslips (
        net_pay, gross_pay, total_deductions, 
        pay_period_start, pay_period_end, 
        deductions_snapshot, other_incomes_snapshot, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 'processed');`,
       calculation.net_pay,
       calculation.gross_pay,
       calculation.total_deductions,
       calculation.period_start,
       calculation.period_end,
       JSON.stringify(calculation.deductions),
       JSON.stringify(calculation.other_incomes)
    );

    // 2. Process Linked Savings
    for (const deduction of calculation.deductions) {
        if (deduction.savings_bucket_id && deduction.calculated_amount > 0) {
            // Add to bucket balance
            await db.runAsync(
                'UPDATE savings_buckets SET current_balance = current_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
                deduction.calculated_amount, deduction.savings_bucket_id
            );

            // Record transaction
            await db.runAsync(
                `INSERT INTO savings_transactions (
                    savings_bucket_id, type, amount, description, transaction_date
                ) VALUES (?, 'deposit', ?, ?, ?);`,
                deduction.savings_bucket_id,
                deduction.calculated_amount,
                `Payslip Deduction: ${deduction.name}`,
                new Date().toISOString().split('T')[0] // YYYY-MM-DD
            );
        }
    }

    return true;
  } catch (error) {
    console.error('Error saving payslip:', error);
    return false;
  }
};

export const deletePayslip = async (id: number): Promise<boolean> => {
    const db = await getDBConnection();
    try {
      await db.runAsync('DELETE FROM payslips WHERE id = ?;', id);
      return true;
    } catch (error) {
      console.error('Error deleting payslip:', error);
      return false;
    }
};