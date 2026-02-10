// ERP Sales Data Store - localStorage based CRUD
// Future: Replace localStorage calls with API calls for DB integration

export interface SalesItem {
    reservationName: string;
    time: string;
    itemCode: string;
    itemName: string;
    pax: number;
    paymentType: string;
    paymentCount: number;
    unitPrice: number;
    supplyValue: number;
    vat: number;
    visitRoute: string;
    address: string;
    foreignNationality: string;
    note: string;
}

export interface SalesRecord {
    id: string;
    date: string;        // YYYY-MM-DD
    staffId: string;
    staffName: string;
    branch: string;      // 천안점, 청주점, 대전둔산점
    customer: string;    // 매장고객
    taxType: string;     // 부가세포함 적용
    items: SalesItem[];
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
}

export interface BankTransaction {
    id: string;
    date: string;
    time: string;
    type: 'income' | 'expense';
    amount: number;
    balance: number;
    vendor: string;
    category: string;
    memo: string;
    raw: string;
}

const STORAGE_KEYS = {
    SALES: 'erp_sales_records',
    BANK: 'erp_bank_transactions',
};

// ============= SALES CRUD =============

export function getAllSales(): SalesRecord[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SALES);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function saveSalesRecord(record: SalesRecord): void {
    const all = getAllSales();
    const idx = all.findIndex(r => r.id === record.id);
    if (idx >= 0) {
        all[idx] = { ...record, updatedAt: new Date().toISOString() };
    } else {
        all.push({ ...record, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(all));
}

export function deleteSalesRecord(id: string): void {
    const all = getAllSales().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(all));
}

export function getSalesByDate(date: string): SalesRecord[] {
    return getAllSales().filter(r => r.date === date);
}

export function getSalesByBranch(branch: string): SalesRecord[] {
    return getAllSales().filter(r => r.branch === branch);
}

export function getSalesByMonth(yearMonth: string): SalesRecord[] {
    // yearMonth format: "2026-02"
    return getAllSales().filter(r => r.date.startsWith(yearMonth));
}

// ============= MONTHLY CALENDAR HELPERS =============

export interface DailySummary {
    date: string;
    branches: Record<string, number>;
    total: number;
}

export function getMonthlyCalendarData(year: number, month: number): DailySummary[] {
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
    const records = getSalesByMonth(yearMonth);

    const dailyMap: Record<string, DailySummary> = {};

    records.forEach(record => {
        if (!dailyMap[record.date]) {
            dailyMap[record.date] = { date: record.date, branches: {}, total: 0 };
        }
        const day = dailyMap[record.date];
        if (!day.branches[record.branch]) {
            day.branches[record.branch] = 0;
        }
        day.branches[record.branch] += record.totalAmount;
        day.total += record.totalAmount;
    });

    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
}

export function getWeeklySummary(year: number, month: number) {
    const data = getMonthlyCalendarData(year, month);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const weeks: { weekNum: number; days: DailySummary[]; total: number; branches: Record<string, number> }[] = [];

    let currentWeek: DailySummary[] = [];
    let weekNum = 1;

    // Fill leading empty days
    for (let i = 0; i < firstDay.getDay(); i++) {
        currentWeek.push({ date: '', branches: {}, total: 0 });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayData = data.find(dd => dd.date === dateStr) || { date: dateStr, branches: {}, total: 0 };
        currentWeek.push(dayData);

        if (currentWeek.length === 7) {
            const weekBranches: Record<string, number> = {};
            let weekTotal = 0;
            currentWeek.forEach(day => {
                weekTotal += day.total;
                Object.entries(day.branches).forEach(([b, amt]) => {
                    weekBranches[b] = (weekBranches[b] || 0) + amt;
                });
            });
            weeks.push({ weekNum, days: currentWeek, total: weekTotal, branches: weekBranches });
            currentWeek = [];
            weekNum++;
        }
    }

    // Fill trailing week
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push({ date: '', branches: {}, total: 0 });
        }
        const weekBranches: Record<string, number> = {};
        let weekTotal = 0;
        currentWeek.forEach(day => {
            weekTotal += day.total;
            Object.entries(day.branches).forEach(([b, amt]) => {
                weekBranches[b] = (weekBranches[b] || 0) + amt;
            });
        });
        weeks.push({ weekNum, days: currentWeek, total: weekTotal, branches: weekBranches });
    }

    return weeks;
}

// ============= BANK TRANSACTIONS CRUD =============

export function getAllBankTransactions(): BankTransaction[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(STORAGE_KEYS.BANK);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function saveBankTransactions(transactions: BankTransaction[]): void {
    const existing = getAllBankTransactions();
    const merged = [...existing, ...transactions];
    localStorage.setItem(STORAGE_KEYS.BANK, JSON.stringify(merged));
}

export function clearBankTransactions(): void {
    localStorage.removeItem(STORAGE_KEYS.BANK);
}

// ============= UTILITY =============

export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ko-KR').format(amount);
}

export const BRANCHES = ['천안점', '청주점', '대전둔산점'];
export const PAYMENT_TYPES = ['플레이스', '카드', '현금영수증(이체)', '현금'];
export const ITEM_NAMES = ['여권', '실속반명함', '실속증명'];
export const VISIT_ROUTES = ['재방문', '카페', '블로그', '지도(플레이스)', '간판', '기타'];
