// ===== 자금관리 시스템 - Data Layer (IndexedDB + 신한은행 파서) =====

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface BankTransaction {
    id: string;
    date: string;          // YYYY-MM-DD
    summary: string;       // 적요
    description: string;   // 기재내용
    withdrawal: number;    // 출금 (찾으신금액)
    deposit: number;       // 입금 (맡기신금액)
    balance: number;       // 거래후잔액
    memo: string;
    category: string;      // 자동/수동 분류
    account_name?: string; // 계좌명 (086, 110 등)
    createdAt: string;
}

export interface Settlement {
    id: string;
    sale_date: string;
    expected_date: string;
    settled_date: string | null;
    type: '카드' | '네이버페이' | '현금' | '기타';
    gross_amount: number;
    fee: number;
    net_amount: number;
    card_company: string;
    status: '대기' | '완료' | '미입금';
    memo: string;
    createdAt: string;
    matched_tx_id?: string;  // 매칭된 은행거래 ID
}

export interface BudgetItem {
    id: string;
    year: number;
    month: number;      // 1-12
    category: string;
    planned: number;     // 예산
    createdAt: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DB_NAME = 'finance_db_v3';
const DB_VERSION = 3;
const TX_STORE = 'bank_transactions';
const SETTLE_STORE = 'settlements';
const BUDGET_STORE = 'budgets';
const RULES_STORE = 'category_rules';

export const CATEGORIES = [
    '사진매출', '영상매출', '기타매출',
    '임대료', '인건비', '소모품비', '비품비', '소프트웨어', '광고비', '통신비', '보험료',
    '수도광열비', '차량유지비', '접대비', '기타운영비',
    '장비구입', '세금/공과금', '카드수수료', '식대비',
    '자금이동', '가수금', '보증금', '세금환급', '이자수익', '정부지원금', '여비교통비', '세무회계비', '차입금', '인테리어', '지급수수료', '관리비',
];

// ─── Utils ──────────────────────────────────────────────────────────────────

export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function formatCurrency(n: number): string {
    return Math.abs(n).toLocaleString('ko-KR');
}

function txHash(t: Pick<BankTransaction, 'date' | 'withdrawal' | 'deposit' | 'description' | 'balance' | 'account_name'>): string {
    return `${t.date}|${t.withdrawal}|${t.deposit}|${t.description}|${t.balance}|${t.account_name || ''}`;
}

// ─── 신한은행 xlsx 파서 ─────────────────────────────────────────────────────

/**
 * 신한은행 계좌거래내역 xlsx 파싱
 * 컬럼 패턴: 거래일자 | 적요 | 기재내용 | 찾으신금액(출금) | 맡기신금액(입금) | 거래후잔액 | 메모
 */
export function parseShinhanXlsx(grid: any[][], accountName?: string): BankTransaction[] {
    const results: BankTransaction[] = [];

    // 1) Find header row by looking for columns containing 거래일 or 일자
    let headerRow = -1;
    let colMap: Record<string, number> = {};

    for (let r = 0; r < Math.min(grid.length, 15); r++) {
        const row = grid[r];
        if (!row) continue;
        const joined = row.map((c: any) => String(c || '').trim()).join('|');

        // Detect header row
        if (joined.includes('거래일') || joined.includes('일자')) {
            const tempMap: Record<string, number> = {};
            row.forEach((cell: any, ci: number) => {
                const s = String(cell || '').replace(/\s+/g, ''); // Remove all spaces
                if (s.includes('거래일') || s === '일자') tempMap['date'] = ci;
                else if (s.includes('적요') && !s.includes('내용')) tempMap['summary'] = ci;
                else if (s.includes('기재') || s.includes('내용') || s.includes('적요내용')) tempMap['description'] = ci;
                else if ((s.includes('찾으신') || s.includes('출금')) && !s.includes('코드')) tempMap['withdrawal'] = ci;
                else if ((s.includes('맡기신') || s.includes('입금')) && !s.includes('코드')) tempMap['deposit'] = ci;
                else if (s.includes('잔액') || s.includes('거래후')) tempMap['balance'] = ci;
                else if (s.includes('메모') || s.includes('비고')) tempMap['memo'] = ci;
            });

            // Require at least 3 columns to match to be sure it's the header
            if (Object.keys(tempMap).length >= 3) {
                headerRow = r;
                colMap = tempMap;
                break;
            }
        }
    }

    if (headerRow < 0) {
        // Fallback: try common positions
        // A=date, B=summary, C=description, D=withdrawal, E=deposit, F=balance, G=memo
        headerRow = 0;
        colMap = { date: 0, summary: 1, description: 2, withdrawal: 3, deposit: 4, balance: 5, memo: 6 };
    }

    // 2) Parse data rows
    const tempResults: any[] = [];

    for (let r = headerRow + 1; r < grid.length; r++) {
        const row = grid[r];
        if (!row || row.length < 3) continue;

        const rawDate = String(row[colMap['date']] || '').trim();
        if (!rawDate) continue;

        const date = normalizeDate(rawDate);
        if (!date) continue;

        const summary = String(row[colMap['summary'] ?? ''] || '').trim();
        const description = String(row[colMap['description'] ?? ''] || '').trim();
        const withdrawal = parseAmount(row[colMap['withdrawal'] ?? '']);
        const deposit = parseAmount(row[colMap['deposit'] ?? '']);
        const balance = parseAmount(row[colMap['balance'] ?? '']);
        const memo = String(row[colMap['memo'] ?? ''] || '').trim();

        // Skip rows with no amounts
        if (withdrawal === 0 && deposit === 0) continue;

        tempResults.push({
            date,
            summary,
            description: description || summary,
            withdrawal,
            deposit,
            balance,
            memo,
            category: autoCategory(description || summary),
            account_name: accountName,
        });
    }

    // Shinhan Excel is usually Descending (Newest Top).
    // We reverse to make it Ascending (Oldest Top).
    tempResults.reverse();

    // Assign Monotonic IDs
    const baseTime = Date.now();
    return tempResults.map((t, idx) => ({
        ...t,
        id: (baseTime + idx).toString(36) + Math.random().toString(36).slice(2, 5), // Monotonic ID
        createdAt: new Date(baseTime + idx).toISOString(),
    }));
}

function normalizeDate(raw: string): string | null {
    // Handle Excel serial date numbers
    const num = Number(raw);
    if (!isNaN(num) && num > 40000 && num < 60000) {
        // Excel serial date
        const epoch = new Date(1899, 11, 30);
        const d = new Date(epoch.getTime() + num * 86400000);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // YYYY.MM.DD or YYYY-MM-DD or YYYY/MM/DD
    const m = raw.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;

    // MM.DD (no year) — assume current year
    const m2 = raw.match(/^(\d{1,2})[.\-\/](\d{1,2})$/);
    if (m2) {
        const year = new Date().getFullYear();
        return `${year}-${m2[1].padStart(2, '0')}-${m2[2].padStart(2, '0')}`;
    }

    // YYYYMMDD
    const m3 = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m3) return `${m3[1]}-${m3[2]}-${m3[3]}`;

    return null;
}

function parseAmount(val: any): number {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return Math.abs(val);
    const cleaned = String(val).replace(/[,\s원₩]/g, '').trim();
    const n = Number(cleaned);
    return isNaN(n) ? 0 : Math.abs(n);
}

function autoCategory(desc: string): string {
    const d = desc.toLowerCase();
    if (d.includes('월세') || d.includes('임대')) return '임대료';
    if (d.includes('급여') || d.includes('인건비') || d.includes('4대보험') || d.includes('국민연금') || d.includes('건강보험') || d.includes('고용보험')) return '인건비';
    if (d.includes('전기') || d.includes('수도') || d.includes('가스') || d.includes('난방')) return '수도광열비';
    if (d.includes('통신') || d.includes('kt') || d.includes('skt') || d.includes('인터넷')) return '통신비';
    if (d.includes('보험')) return '보험료';
    if (d.includes('세금') || d.includes('국세') || d.includes('지방세') || d.includes('부가세')) return '세금/공과금';

    // New: 세무회계비 (Priority over general fees)
    if (d.includes('세무') || d.includes('결산') || d.includes('기장') || d.includes('회계')) return '세무회계비';

    if (d.includes('카드') || d.includes('수수료')) return '카드수수료';
    if (d.includes('기름') || d.includes('주유') || d.includes('주차')) return '차량유지비';
    if (d.includes('네이버') || d.includes('스마트스토어')) return '기타매출';
    if (d.includes('소모품') || d.includes('문구')) return '소모품비';

    // New: 비품비
    if (d.includes('비품') || d.includes('책상') || d.includes('의자') || d.includes('가구') || d.includes('이케아') || d.includes('오늘의집')) return '비품비';

    // New: 소프트웨어 (AI, Adobe, SaaS)
    if (d.includes('adobe') || d.includes('어도비') || d.includes('openai') || d.includes('chatgpt') || d.includes('midjourney') || d.includes('미드저니') || d.includes('notion') || d.includes('노션') || d.includes('google') || d.includes('구글') || d.includes('microsoft') || d.includes('마이크로소프트') || d.includes('zoom') || d.includes('줌')) return '소프트웨어';

    if (d.includes('광고') || d.includes('마케팅')) return '광고비';
    if (d.includes('식대') || d.includes('식사') || d.includes('커피') || d.includes('배달') || d.includes('쿠팡이츠') || d.includes('배민') || d.includes('스낵') || d.includes('간식') || d.includes('위펀') || d.includes('편의점')) return '식대비';
    if (d.includes('이체') || d.includes('대체')) return '자금이동';

    // Updated: 가수금 (Repayment '변제' also included)
    if (d.includes('가수금') || d.includes('변제')) return '가수금';

    if (d.includes('환급') && (d.includes('국세') || d.includes('부가세') || d.includes('지방세') || d.includes('세무'))) return '세금환급';
    if (d.includes('이자')) return '이자수익';
    if (d.includes('지원금') || d.includes('장려금')) return '정부지원금';

    // New: 여비교통비
    if (d.includes('sr') || d.includes('ktx') || d.includes('택시') || d.includes('버스') || d.includes('지하철') || d.includes('철도') || d.includes('코레일') || d.includes('하이패스') || d.includes('톨게이트')) return '여비교통비';

    // New: 차입금 (대출)
    if (d.includes('대출') || d.includes('차입') || d.includes('원금') || d.includes('빌린')) return '차입금';

    // New: 인테리어
    if (d.includes('인테리어') || d.includes('공사') || d.includes('목공') || d.includes('전기공사') || d.includes('타일') || d.includes('도배') || d.includes('장판') || d.includes('페인트') || d.includes('조명')) return '인테리어';

    // New: 지급수수료 (중개비 등)
    if (d.includes('중개비') || d.includes('복비') || d.includes('수수료') || d.includes('컨설팅')) return '지급수수료';

    // New: 관리비 (품목 및 건물 관리비)
    if (d.includes('정수기') || d.includes('매직') || d.includes('코웨이') || d.includes('쿠쿠') || d.includes('청호') ||
        d.includes('방역') || d.includes('세스코') || d.includes('캡스') || d.includes('adt') || d.includes('세콤') ||
        d.includes('s1') || d.includes('관리비') || d.includes('주차비')) return '관리비';

    return '기타운영비';
}

// ─── IndexedDB Helper ───────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains(TX_STORE)) {
                const txStore = db.createObjectStore(TX_STORE, { keyPath: 'id' });
                txStore.createIndex('by_date', 'date', { unique: false });
                txStore.createIndex('by_category', 'category', { unique: false });
            }

            if (!db.objectStoreNames.contains(SETTLE_STORE)) {
                const settleStore = db.createObjectStore(SETTLE_STORE, { keyPath: 'id' });
                settleStore.createIndex('by_date', 'sale_date', { unique: false });
            }

            if (!db.objectStoreNames.contains(BUDGET_STORE)) {
                const budgetStore = db.createObjectStore(BUDGET_STORE, { keyPath: 'id' });
                budgetStore.createIndex('by_ym', ['year', 'month'], { unique: false });
            }

            if (!db.objectStoreNames.contains(RULES_STORE)) {
                const rulesStore = db.createObjectStore(RULES_STORE, { keyPath: 'keyword' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// ─── Transactions CRUD ──────────────────────────────────────────────────────

export async function getAllTransactions(): Promise<BankTransaction[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(TX_STORE, 'readonly');
        const req = tx.objectStore(TX_STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

export async function getTransactionsByDate(date: string): Promise<BankTransaction[]> {
    const all = await getAllTransactions();
    return all.filter(t => t.date === date);
}

export async function getTransactionsByDateRange(from: string, to: string): Promise<BankTransaction[]> {
    const all = await getAllTransactions();
    return all.filter(t => t.date >= from && t.date <= to);
}

export async function getTransactionsByMonth(ym: string): Promise<BankTransaction[]> {
    const all = await getAllTransactions();
    return all.filter(t => t.date.startsWith(ym));
}

export async function getTransactionsByAccount(account: string): Promise<BankTransaction[]> {
    const all = await getAllTransactions();
    return all.filter(t => t.account_name === account);
}

export async function getPreviousBalance(account: string, date: string): Promise<number> {
    const all = await getAllTransactions();
    // 1. Filter by account and date < targetDate
    const previousTxs = all.filter(t => (t.account_name || 'unknown') === account && t.date < date);

    // 2. Sort descending by date, then by ID (assuming ID creation order correlates with time if same day)
    // Actually ID is random, but date is key. If multiple txs on same day, we need logic.
    // However, here we are looking for strictly < date (yesterday or before).
    // So sorting by date desc is enough.

    if (previousTxs.length === 0) return 0;

    previousTxs.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.id.localeCompare(a.id); // Fallback
    });

    return previousTxs[0].balance;
}

export async function saveTransactions(txs: BankTransaction[], skipDuplicates = true): Promise<{ inserted: number; skipped: number }> {
    const db = await openDB();
    let inserted = 0, skipped = 0;

    let existing: Set<string> = new Set();
    if (skipDuplicates) {
        const all = await getAllTransactions();
        existing = new Set(all.map(t => txHash(t)));
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(TX_STORE, 'readwrite');
        const store = tx.objectStore(TX_STORE);

        for (const t of txs) {
            const hash = txHash(t);
            if (skipDuplicates && existing.has(hash)) {
                skipped++;
                continue;
            }
            store.put(t);
            existing.add(hash);
            inserted++;
        }

        tx.oncomplete = () => resolve({ inserted, skipped });
        tx.onerror = () => reject(tx.error);
    });
}

export async function updateTransaction(tx: BankTransaction): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const t = db.transaction(TX_STORE, 'readwrite');
        t.objectStore(TX_STORE).put(tx);
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
    });
}

export async function deleteTransaction(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const t = db.transaction(TX_STORE, 'readwrite');
        t.objectStore(TX_STORE).delete(id);
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
    });
}

// ─── Monthly Summary ────────────────────────────────────────────────────────

export async function getMonthlySummary(ym: string): Promise<{
    totalDeposit: number;
    totalWithdrawal: number;
    netAmount: number;
    txCount: number;
    byCategory: Record<string, { deposit: number; withdrawal: number }>;
}> {
    const txs = await getTransactionsByMonth(ym);
    const byCategory: Record<string, { deposit: number; withdrawal: number }> = {};

    let totalDeposit = 0, totalWithdrawal = 0;

    for (const t of txs) {
        totalDeposit += t.deposit;
        totalWithdrawal += t.withdrawal;

        if (!byCategory[t.category]) {
            byCategory[t.category] = { deposit: 0, withdrawal: 0 };
        }
        byCategory[t.category].deposit += t.deposit;
        byCategory[t.category].withdrawal += t.withdrawal;
    }

    return {
        totalDeposit,
        totalWithdrawal,
        netAmount: totalDeposit - totalWithdrawal,
        txCount: txs.length,
        byCategory,
    };
}

// ─── Settlements CRUD ───────────────────────────────────────────────────────

export async function getAllSettlements(): Promise<Settlement[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(SETTLE_STORE, 'readonly');
        const req = tx.objectStore(SETTLE_STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

export async function saveSettlement(s: Settlement): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(SETTLE_STORE, 'readwrite');
        tx.objectStore(SETTLE_STORE).put(s);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function deleteSettlement(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(SETTLE_STORE, 'readwrite');
        tx.objectStore(SETTLE_STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ─── Budget CRUD ────────────────────────────────────────────────────────────

export async function getAllBudgets(): Promise<BudgetItem[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(BUDGET_STORE, 'readonly');
        const req = tx.objectStore(BUDGET_STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

export async function getBudgetsByYear(year: number): Promise<BudgetItem[]> {
    const all = await getAllBudgets();
    return all.filter(b => b.year === year);
}

export async function saveBudget(b: BudgetItem): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(BUDGET_STORE, 'readwrite');
        tx.objectStore(BUDGET_STORE).put(b);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function saveBudgets(items: BudgetItem[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(BUDGET_STORE, 'readwrite');
        const store = tx.objectStore(BUDGET_STORE);
        for (const b of items) store.put(b);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ─── Clear All Data ─────────────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([TX_STORE, SETTLE_STORE, BUDGET_STORE], 'readwrite');
        tx.objectStore(TX_STORE).clear();
        tx.objectStore(SETTLE_STORE).clear();
        tx.objectStore(BUDGET_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function clearTransactions(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(TX_STORE, 'readwrite');
        tx.objectStore(TX_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ─── Export / Import Backup ─────────────────────────────────────────────────

export async function exportAllData(): Promise<string> {
    const [txs, settlements, budgets, rules] = await Promise.all([
        getAllTransactions(),
        getAllSettlements(),
        getAllBudgets(),
        getAllRules(),
    ]);
    return JSON.stringify({ transactions: txs, settlements, budgets, rules, exportedAt: new Date().toISOString() }, null, 2);
}

export async function importBackup(json: string): Promise<{ txCount: number; settleCount: number; budgetCount: number; ruleCount: number }> {
    const data = JSON.parse(json);
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction([TX_STORE, SETTLE_STORE, BUDGET_STORE, RULES_STORE], 'readwrite');

        const txStore = tx.objectStore(TX_STORE);
        const settleStore = tx.objectStore(SETTLE_STORE);
        const budgetStore = tx.objectStore(BUDGET_STORE);
        const rulesStore = tx.objectStore(RULES_STORE);

        let txCount = 0, settleCount = 0, budgetCount = 0, ruleCount = 0;

        if (data.transactions) {
            for (const t of data.transactions) { txStore.put(t); txCount++; }
        }
        if (data.settlements) {
            for (const s of data.settlements) { settleStore.put(s); settleCount++; }
        }
        if (data.budgets) {
            for (const b of data.budgets) { budgetStore.put(b); budgetCount++; }
        }
        if (data.rules) {
            for (const r of data.rules) { rulesStore.put(r); ruleCount++; }
        }

        tx.oncomplete = () => resolve({ txCount, settleCount, budgetCount, ruleCount });
        tx.onerror = () => reject(tx.error);
    });
}

// ─── Rules / AI Learning CRUD ───────────────────────────────────────────────

export interface CategoryRule {
    keyword: string;
    category: string;
    updatedAt: string;
}

export async function addCategoryRule(keyword: string, category: string): Promise<void> {
    const db = await openDB();
    const rule: CategoryRule = {
        keyword: keyword.trim(),
        category,
        updatedAt: new Date().toISOString()
    };
    return new Promise((resolve, reject) => {
        const tx = db.transaction(RULES_STORE, 'readwrite');
        tx.objectStore(RULES_STORE).put(rule);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function getAllRules(): Promise<CategoryRule[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(RULES_STORE, 'readonly');
        const req = tx.objectStore(RULES_STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

// Blacklist for rule learning (Summary)
const BLACKLIST_KEYWORDS = [
    'BZ뱅크', '타행이체', '펌뱅킹', '전자금융',
    '체크카드', '현금', '대체', '기타', '신한은행', 'CMS',
    '출금', '입금', '이자', '수수료'
];

export async function applyClassificationRules(txs: BankTransaction[]): Promise<BankTransaction[]> {
    const rules = await getAllRules();
    const ruleMap = new Map(rules.map(r => [r.keyword, r.category]));

    return txs.map(tx => {
        // Priority 1: Check Description
        const descKey = (tx.description || '').trim();
        if (descKey && ruleMap.has(descKey)) {
            return { ...tx, category: ruleMap.get(descKey)! };
        }

        // Priority 2: Check Summary (if not blacklisted)
        // Summary is often generic (e.g. "BZ Bank")
        const summaryKey = (tx.summary || '').trim();
        if (summaryKey && !BLACKLIST_KEYWORDS.includes(summaryKey) && ruleMap.has(summaryKey)) {
            return { ...tx, category: ruleMap.get(summaryKey)! };
        }

        return tx;
    });
}

// ─── Smart Restore (Keep Categories) ────────────────────────────────────────

export async function restoreCategoriesFromBackup(json: string): Promise<number> {
    const data = JSON.parse(json);
    if (!data.transactions || !Array.isArray(data.transactions)) return 0;

    const db = await openDB();
    const tx = db.transaction(TX_STORE, 'readwrite');
    const store = tx.objectStore(TX_STORE);

    // 1. Load all current transactions to a map for fast lookup
    // Key: date|amount|balance|description (sufficiently unique)
    const currentTxs = await new Promise<BankTransaction[]>((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
    });

    const txMap = new Map<string, BankTransaction>();
    currentTxs.forEach(t => {
        // Create a unique key for matching. ID might change, but these shouldn't.
        const key = `${t.date}|${t.withdrawal}|${t.deposit}|${t.balance}|${t.description.trim()}`;
        txMap.set(key, t);
    });

    let updatedCount = 0;

    // 2. Iterate backup transactions and update current if matched
    for (const oldTx of data.transactions) {
        // Skip if category is default '기타운영비' (we only want to restore manual work)
        // Check if category is different

        const key = `${oldTx.date}|${oldTx.withdrawal}|${oldTx.deposit}|${oldTx.balance}|${oldTx.description.trim()}`;
        const currentTx = txMap.get(key);

        if (currentTx) {
            // Only update if category differs and oldTx has a valid category
            if (currentTx.category !== oldTx.category && oldTx.category) {
                currentTx.category = oldTx.category;
                if (oldTx.memo) currentTx.memo = oldTx.memo; // Restore memo too
                store.put(currentTx);
                updatedCount++;
            }
        }
    }

    return new Promise((resolve) => {
        tx.oncomplete = () => resolve(updatedCount);
    });
}
