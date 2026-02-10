// ===== 안티그래비티 자금관리 시스템 - Data Layer =====

export interface FinanceTransaction {
    id: string;
    trans_date: string;     // YYYY-MM-DD
    type: '매출' | '지출';
    amount: number;
    client: string;         // 거래처
    description: string;    // 적요(내용)
    category: string;       // 계정과목: 매출, 식대/복리후생, 인건비, 장비비, 기타운영비 등
    project_name: string;   // 관련 프로젝트: 공통운영, 골프존, 록스소사이어티 등
    createdAt: string;
}

const STORAGE_KEYS = {
    TRANSACTIONS: 'finance_transactions',
    PROJECTS: 'finance_projects',
};

// ===== Default Projects =====
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

// ===== Projects CRUD =====
export function getProjects(): string[] {
    if (typeof window === 'undefined') return DEFAULT_PROJECTS;
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        const saved = data ? JSON.parse(data) : [];
        // Merge defaults with saved
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
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    }
}

// ===== Transactions CRUD =====
export function getAllTransactions(): FinanceTransaction[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function saveTransaction(tx: FinanceTransaction): void {
    const all = getAllTransactions();
    all.push(tx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(all));
}

export function saveTransactions(txs: FinanceTransaction[]): void {
    const all = getAllTransactions();
    all.push(...txs);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(all));
}

export function deleteTransaction(id: string): void {
    const all = getAllTransactions().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(all));
}

export function clearAllTransactions(): void {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
}

// ===== Statistics =====

// Monthly summary for a given YYYY-MM
export function getMonthlySummary(yearMonth: string) {
    const all = getAllTransactions().filter(t => t.trans_date.startsWith(yearMonth));
    const income = all.filter(t => t.type === '매출').reduce((s, t) => s + t.amount, 0);
    const expense = all.filter(t => t.type === '지출').reduce((s, t) => s + t.amount, 0);
    return {
        yearMonth,
        totalIncome: income,
        totalExpense: expense,
        netProfit: income - expense,
        count: all.length,
    };
}

// Project-based margin
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

// Category breakdown for a given month
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

// Monthly trend (last N months)
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
