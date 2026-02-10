// ===== 안티그래비티 자금관리 시스템 - Data Layer (IndexedDB) =====

export interface FinanceTransaction {
    id: string;
    trans_date: string;     // YYYY-MM-DD
    type: '매출' | '지출';
    amount: number;
    client: string;         // 거래처
    description: string;    // 적요(내용)
    category: string;       // 계정과목
    project_name: string;   // 관련 프로젝트
    createdAt: string;
}

const DB_NAME = 'finance_db';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';
const PROJECTS_STORE = 'projects';

const DEFAULT_PROJECTS = ['공통운영', '골프존', '록스소사이어티', '마인드바이러스'];

const CATEGORIES = [
    '매출', '식대/복리후생', '인건비', '장비비', '소모품비',
    '여비교통비', '통신비', '광고선전비', '접대비', '수수료',
    '임대료', '기타운영비',
];

export { CATEGORIES };

// ===== Util =====
export function generateFinanceId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function formatCurrency(n: number): string {
    return n.toLocaleString('ko-KR');
}

// Hash for dedup: date+type+amount+client+description
export function txHash(t: Pick<FinanceTransaction, 'trans_date' | 'type' | 'amount' | 'client' | 'description'>): string {
    return `${t.trans_date}|${t.type}|${t.amount}|${t.client}|${t.description}`.toLowerCase().trim();
}

// ===== IndexedDB Helper =====
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('trans_date', 'trans_date', { unique: false });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('project_name', 'project_name', { unique: false });
            }
            if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
                db.createObjectStore(PROJECTS_STORE, { keyPath: 'name' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ===== Migrate from localStorage if exists =====
async function migrateFromLocalStorage(): Promise<void> {
    if (typeof window === 'undefined') return;
    const existing = localStorage.getItem('finance_transactions');
    if (!existing) return;
    try {
        const txs: FinanceTransaction[] = JSON.parse(existing);
        if (txs.length > 0) {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            txs.forEach(t => store.put(t));
            await new Promise<void>((resolve, reject) => {
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
            localStorage.removeItem('finance_transactions');
            console.log(`[Finance] Migrated ${txs.length} records from localStorage to IndexedDB`);
        }
    } catch (e) {
        console.error('[Finance] Migration failed:', e);
    }
}

// Run migration on load
if (typeof window !== 'undefined') {
    migrateFromLocalStorage();
}

// ===== Projects CRUD =====
export function getProjects(): string[] {
    if (typeof window === 'undefined') return DEFAULT_PROJECTS;
    try {
        const data = localStorage.getItem('finance_projects');
        const saved = data ? JSON.parse(data) : [];
        const set = new Set([...DEFAULT_PROJECTS, ...saved]);
        return Array.from(set);
    } catch {
        return DEFAULT_PROJECTS;
    }
}

export function addProject(name: string): void {
    const projects = getProjects();
    if (!projects.includes(name)) {
        projects.push(name);
        localStorage.setItem('finance_projects', JSON.stringify(projects));
    }
}

// ===== Transactions CRUD (Async IndexedDB) =====

export async function getAllTransactionsAsync(): Promise<FinanceTransaction[]> {
    if (typeof window === 'undefined') return [];
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// Synchronous fallback using in-memory cache
let _cache: FinanceTransaction[] | null = null;
let _cacheLoading = false;

export function getAllTransactions(): FinanceTransaction[] {
    if (typeof window === 'undefined') return [];
    if (_cache !== null) return _cache;
    // Trigger async load
    if (!_cacheLoading) {
        _cacheLoading = true;
        getAllTransactionsAsync().then(data => {
            _cache = data;
            _cacheLoading = false;
        });
    }
    // Fallback: try localStorage
    try {
        const data = localStorage.getItem('finance_transactions');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function invalidateCache(): void {
    _cache = null;
    _cacheLoading = false;
}

export async function saveTransactionAsync(tx: FinanceTransaction): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(tx);
        transaction.oncomplete = () => { invalidateCache(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
    });
}

export async function saveTransactionsAsync(txs: FinanceTransaction[], skipDuplicates = true): Promise<{ inserted: number; skipped: number }> {
    const existing = await getAllTransactionsAsync();
    const existingHashes = new Set(existing.map(t => txHash(t)));

    let toInsert = txs;
    let skipped = 0;
    if (skipDuplicates) {
        toInsert = txs.filter(t => {
            const h = txHash(t);
            if (existingHashes.has(h)) {
                skipped++;
                return false;
            }
            existingHashes.add(h); // prevent intra-batch duplicates
            return true;
        });
    }

    if (toInsert.length === 0) {
        return { inserted: 0, skipped };
    }

    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        toInsert.forEach(t => store.put(t));
        transaction.oncomplete = () => { invalidateCache(); resolve({ inserted: toInsert.length, skipped }); };
        transaction.onerror = () => reject(transaction.error);
    });
}

export async function deleteTransactionAsync(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(id);
        transaction.oncomplete = () => { invalidateCache(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
    });
}

// Remove duplicate transactions, keeping first occurrence
export async function deduplicateTransactionsAsync(): Promise<{ before: number; after: number; removed: number }> {
    const all = await getAllTransactionsAsync();
    const seen = new Set<string>();
    const unique: FinanceTransaction[] = [];
    const duplicateIds: string[] = [];

    // Sort by createdAt to keep oldest
    all.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

    for (const t of all) {
        const h = txHash(t);
        if (seen.has(h)) {
            duplicateIds.push(t.id);
        } else {
            seen.add(h);
            unique.push(t);
        }
    }

    if (duplicateIds.length === 0) {
        return { before: all.length, after: all.length, removed: 0 };
    }

    // Clear and re-insert only unique
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.clear();
        unique.forEach(t => store.put(t));
        transaction.oncomplete = () => {
            invalidateCache();
            resolve({ before: all.length, after: unique.length, removed: duplicateIds.length });
        };
        transaction.onerror = () => reject(transaction.error);
    });
}

export async function clearAllTransactionsAsync(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.clear();
        transaction.oncomplete = () => { invalidateCache(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
    });
}

// ===== Sync wrappers (backward compat) =====
export function saveTransaction(tx: FinanceTransaction): void {
    saveTransactionAsync(tx);
}

export function saveTransactions(txs: FinanceTransaction[]): void {
    saveTransactionsAsync(txs);
}

export function deleteTransaction(id: string): void {
    deleteTransactionAsync(id);
}

export function clearAllTransactions(): void {
    clearAllTransactionsAsync();
}

// ===== Statistics =====

export function getMonthlySummary(yearMonth: string) {
    const all = getAllTransactions();
    const filtered = all.filter(t => t.trans_date.startsWith(yearMonth));
    const income = filtered.filter(t => t.type === '매출').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === '지출').reduce((s, t) => s + t.amount, 0);
    return {
        yearMonth,
        totalIncome: income,
        totalExpense: expense,
        netProfit: income - expense,
        count: filtered.length,
    };
}

// Async version for accurate data
export async function getMonthlySummaryAsync(yearMonth: string) {
    const all = await getAllTransactionsAsync();
    const filtered = all.filter(t => t.trans_date.startsWith(yearMonth));
    const income = filtered.filter(t => t.type === '매출').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === '지출').reduce((s, t) => s + t.amount, 0);
    return {
        yearMonth,
        totalIncome: income,
        totalExpense: expense,
        netProfit: income - expense,
        count: filtered.length,
    };
}

export function getProjectSummary() {
    const all = getAllTransactions();
    const projects = new Map<string, { income: number; expense: number; count: number }>();

    all.forEach(t => {
        const p = t.project_name || '공통운영';
        if (!projects.has(p)) projects.set(p, { income: 0, expense: 0, count: 0 });
        const entry = projects.get(p)!;
        if (t.type === '매출') entry.income += t.amount;
        else entry.expense += t.amount;
        entry.count++;
    });

    return Array.from(projects.entries()).map(([name, data]) => ({
        project: name,
        income: data.income,
        expense: data.expense,
        profit: data.income - data.expense,
        margin: data.income > 0 ? Math.round((data.income - data.expense) / data.income * 100) : 0,
        count: data.count,
    })).sort((a, b) => b.income - a.income);
}

export async function getProjectSummaryAsync() {
    const all = await getAllTransactionsAsync();
    const projects = new Map<string, { income: number; expense: number; count: number }>();

    all.forEach(t => {
        const p = t.project_name || '공통운영';
        if (!projects.has(p)) projects.set(p, { income: 0, expense: 0, count: 0 });
        const entry = projects.get(p)!;
        if (t.type === '매출') entry.income += t.amount;
        else entry.expense += t.amount;
        entry.count++;
    });

    return Array.from(projects.entries()).map(([name, data]) => ({
        project: name,
        income: data.income,
        expense: data.expense,
        profit: data.income - data.expense,
        margin: data.income > 0 ? Math.round((data.income - data.expense) / data.income * 100) : 0,
        count: data.count,
    })).sort((a, b) => b.income - a.income);
}

export function getCategoryBreakdown(yearMonth?: string) {
    let all = getAllTransactions();
    if (yearMonth) all = all.filter(t => t.trans_date.startsWith(yearMonth));

    const cats = new Map<string, number>();
    all.filter(t => t.type === '지출').forEach(t => {
        cats.set(t.category, (cats.get(t.category) || 0) + t.amount);
    });

    return Array.from(cats.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
}

export async function getCategoryBreakdownAsync(yearMonth?: string) {
    let all = await getAllTransactionsAsync();
    if (yearMonth) all = all.filter(t => t.trans_date.startsWith(yearMonth));

    const cats = new Map<string, number>();
    all.filter(t => t.type === '지출').forEach(t => {
        cats.set(t.category, (cats.get(t.category) || 0) + t.amount);
    });

    return Array.from(cats.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
}

export function getMonthlyTrend(months: number = 12) {
    const all = getAllTransactions();
    const trend: { month: string; income: number; expense: number; net: number }[] = [];

    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthTxs = all.filter(t => t.trans_date.startsWith(ym));
        const income = monthTxs.filter(t => t.type === '매출').reduce((s, t) => s + t.amount, 0);
        const expense = monthTxs.filter(t => t.type === '지출').reduce((s, t) => s + t.amount, 0);
        trend.push({ month: ym, income, expense, net: income - expense });
    }
    return trend;
}

export async function getMonthlyTrendAsync(months: number = 12) {
    const all = await getAllTransactionsAsync();
    const trend: { month: string; income: number; expense: number; net: number }[] = [];

    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthTxs = all.filter(t => t.trans_date.startsWith(ym));
        const income = monthTxs.filter(t => t.type === '매출').reduce((s, t) => s + t.amount, 0);
        const expense = monthTxs.filter(t => t.type === '지출').reduce((s, t) => s + t.amount, 0);
        trend.push({ month: ym, income, expense, net: income - expense });
    }
    return trend;
}
