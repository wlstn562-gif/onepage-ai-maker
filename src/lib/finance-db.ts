import fs from 'fs';
import path from 'path';
import { BankTransaction, Settlement, BudgetItem, CategoryRule } from './finance-store';

const dataDir = path.join(process.cwd(), 'data');
const financePath = path.join(dataDir, 'finance.json');

export interface FinanceData {
    transactions: BankTransaction[];
    settlements: Settlement[];
    budgets: BudgetItem[];
    rules: CategoryRule[];
    updatedAt: string;
}

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure file exists
if (!fs.existsSync(financePath)) {
    const initialData: FinanceData = {
        transactions: [],
        settlements: [],
        budgets: [],
        rules: [],
        updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(financePath, JSON.stringify(initialData, null, 2), 'utf-8');
}

export function getFinanceData(): FinanceData {
    try {
        const data = fs.readFileSync(financePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading finance data:', error);
        return {
            transactions: [],
            settlements: [],
            budgets: [],
            rules: [],
            updatedAt: new Date().toISOString()
        };
    }
}

export function saveFinanceData(data: FinanceData): void {
    try {
        const payload = {
            ...data,
            updatedAt: new Date().toISOString()
        };
        fs.writeFileSync(financePath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving finance data:', error);
    }
}
