import { BankTransaction, Settlement, BudgetItem, CategoryRule } from './finance-store';
import fs from 'fs';
import path from 'path';

// Upstash Redis Environment Variables
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const dataDir = path.join(process.cwd(), 'data');
const financePath = path.join(dataDir, 'finance.json');

export interface FinanceData {
    transactions: BankTransaction[];
    settlements: Settlement[];
    budgets: BudgetItem[];
    rules: CategoryRule[];
    updatedAt: string;
}

async function redisFetch(method: string, body?: any) {
    if (!REDIS_URL || !REDIS_TOKEN) return null;

    const cleanUrl = REDIS_URL.replace(/"/g, '').trim();
    const cleanToken = REDIS_TOKEN.replace(/"/g, '').trim();

    if (method === 'POST') {
        const setUrl = `${cleanUrl}/set/finance_data`;
        const res = await fetch(setUrl, {
            method: 'POST',
            headers: { Authorization: `Bearer ${cleanToken}` },
            body: typeof body === 'string' ? body : JSON.stringify(body)
        });
        return res.json();
    }

    const getUrl = `${cleanUrl}/get/finance_data`;
    const res = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${cleanToken}` }
    });
    const data = await res.json();

    if (data.result) {
        try {
            return JSON.parse(data.result);
        } catch (e) {
            console.error('[REDIS PARSE ERROR]', e, data.result);
            return null;
        }
    }
    return null;
}

export function isRedisConfigured(): boolean {
    return !!(REDIS_URL && REDIS_TOKEN && REDIS_URL.length > 10);
}

export async function getFinanceData(): Promise<FinanceData> {
    // 1. Try Redis first (Production Priority)
    try {
        const cloudData = await redisFetch('GET');
        if (cloudData) {
            console.log(`[REDIS] Successfully loaded data (${cloudData.transactions?.length || 0} txs)`);
            return cloudData;
        }
    } catch (error) {
        console.error('[REDIS GET ERROR]', error);
    }

    // 2. Fallback to Local File (Development/Emergency)
    try {
        if (fs.existsSync(financePath)) {
            const data = fs.readFileSync(financePath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('[LOCAL GET ERROR]', error);
    }

    return {
        transactions: [],
        settlements: [],
        budgets: [],
        rules: [],
        updatedAt: new Date().toISOString()
    };
}

export async function saveFinanceData(data: FinanceData): Promise<void> {
    const payload = {
        ...data,
        updatedAt: new Date().toISOString()
    };

    // 1. Save to Redis (Production Priority)
    try {
        if (isRedisConfigured()) {
            await redisFetch('POST', payload);
            console.log(`[REDIS SAVE] Success: ${payload.transactions.length} txs`);
        }
    } catch (error) {
        console.error('[REDIS SAVE ERROR]', error);
    }

    // 2. Always backup to local file if possible (for robustness)
    try {
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(financePath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (error) {
        console.error('[LOCAL SAVE ERROR]', error);
    }
}
