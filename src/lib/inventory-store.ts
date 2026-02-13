export interface InventoryItem {
    id: string;
    itemCode: string;
    name: string;
    category: '소모품' | '비품' | '상품' | '기타';
    currentStock: number;
    minRequired: number;
    unit: string;
    lastRestockedAt: string;
    branch: string;
}

export interface InventoryLog {
    id: string;
    itemId: string;
    type: 'in' | 'out' | 'adjust';
    quantity: number;
    reason: string;
    timestamp: string;
    staffName: string;
}

const STORAGE_KEYS = {
    INVENTORY: 'erp_inventory_items',
    INVENTORY_LOGS: 'erp_inventory_logs',
};

// ============= CATALOG (품목 목록 템플릿) =============

export interface CatalogItem {
    name: string;
    category: InventoryItem['category'];
    unit: string;
    note?: string;
    group: '주요재고' | '기타재고';
}

export const INVENTORY_CATALOG: CatalogItem[] = [
    // 주요재고
    { name: '대형봉투(검정)', category: '소모품', unit: 'EA', group: '주요재고' },
    { name: '중형봉투(노랑,로고)', category: '소모품', unit: 'EA', group: '주요재고' },
    { name: '소형봉투(비닐,로고)', category: '소모품', unit: 'EA', group: '주요재고' },
    { name: '증명봉투', category: '소모품', unit: 'box', note: 'box단위', group: '주요재고' },
    { name: '증명비닐봉투', category: '소모품', unit: '묶음', note: '묶음단위', group: '주요재고' },
    { name: '4x6 인화지', category: '소모품', unit: '묶음', note: '1000개 묶음단위', group: '주요재고' },
    { name: '5x7 인화지', category: '소모품', unit: '묶음', note: '1000개 묶음단위', group: '주요재고' },
    { name: 'A4 인화지', category: '소모품', unit: '매', group: '주요재고' },
    { name: '11x14 인화지', category: '소모품', unit: '매', group: '주요재고' },
    { name: 'A3 인화지', category: '소모품', unit: '매', group: '주요재고' },
    { name: '4x6 액자', category: '상품', unit: 'EA', group: '주요재고' },
    { name: '5x7 액자', category: '상품', unit: 'EA', group: '주요재고' },
    { name: '6x8 액자', category: '상품', unit: 'EA', group: '주요재고' },
    { name: 'A4 액자', category: '상품', unit: 'EA', group: '주요재고' },
    { name: 'A3 액자', category: '상품', unit: 'EA', group: '주요재고' },
    { name: '8x10 액자(제사)', category: '상품', unit: 'EA', group: '주요재고' },
    { name: '11x14 액자(장수)', category: '상품', unit: 'EA', group: '주요재고' },

    // 기타재고
    { name: '각휴지', category: '기타', unit: 'EA', group: '기타재고' },
    { name: '두루말이', category: '기타', unit: 'EA', group: '기타재고' },
    { name: '물티슈', category: '기타', unit: '개', note: 'a,b,로비 각방 1개씩', group: '기타재고' },
    { name: '종이컵', category: '기타', unit: '개', group: '기타재고' },
    { name: '핸드타올', category: '기타', unit: 'EA', group: '기타재고' },
    { name: '머리끈', category: '기타', unit: '개', group: '기타재고' },
    { name: '머리핀', category: '기타', unit: '개', group: '기타재고' },
    { name: '면봉', category: '기타', unit: '개', group: '기타재고' },
    { name: '레몬밤차', category: '기타', unit: '개', group: '기타재고' },
    { name: '맥심커피', category: '기타', unit: '개', group: '기타재고' },
    { name: 'AA 건전지', category: '기타', unit: '개', group: '기타재고' },
    { name: 'AAA 건전지', category: '기타', unit: '개', group: '기타재고' },
    { name: '주방세제', category: '기타', unit: '개', group: '기타재고' },
    { name: '손세정기', category: '기타', unit: '개', group: '기타재고' },
    { name: '헤어젤', category: '기타', unit: '개', group: '기타재고' },
    { name: '헤어스프레이', category: '기타', unit: '개', group: '기타재고' },
    { name: '종량제봉투', category: '기타', unit: '장', group: '기타재고' },
    { name: '75리터 봉투', category: '기타', unit: '장', group: '기타재고' },
    { name: '50리터 봉투', category: '기타', unit: '장', group: '기타재고' },
    { name: '10리터 봉투', category: '기타', unit: '장', group: '기타재고' },
];

export function getAllInventory(): InventoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
        if (data) return JSON.parse(data);

        // Seed with empty array — user adds from catalog
        saveInventoryItems([]);
        return [];
    } catch {
        return [];
    }
}


function saveInventoryItems(items: InventoryItem[]): void {
    safeSet(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
}

// ============= UTILITY =============

function safeSet(key: string, value: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        console.warn('[safeSet] Quota exceeded for key:', key, '— freeing space...');
        try {
            // 1) Prune inventory logs aggressively
            const rawLogs = localStorage.getItem(STORAGE_KEYS.INVENTORY_LOGS);
            if (rawLogs) {
                try {
                    const logs = JSON.parse(rawLogs);
                    if (Array.isArray(logs) && logs.length > 20) {
                        localStorage.setItem(STORAGE_KEYS.INVENTORY_LOGS, JSON.stringify(logs.slice(-20)));
                    }
                } catch { /* ignore parse errors */ }
            }

            // 2) Remove any large non-essential keys (> 100KB) that aren't our core keys
            const coreKeys = new Set(Object.values(STORAGE_KEYS));
            const keysToCheck: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && !coreKeys.has(k)) keysToCheck.push(k);
            }
            keysToCheck.sort((a, b) => (localStorage.getItem(b)?.length || 0) - (localStorage.getItem(a)?.length || 0));
            for (const k of keysToCheck.slice(0, 3)) {
                const v = localStorage.getItem(k);
                if (v && v.length > 100_000) {
                    console.warn('[safeSet] Removing large key to free space:', k, `(${(v.length / 1024).toFixed(0)}KB)`);
                    localStorage.removeItem(k);
                }
            }

            // 3) Retry save
            localStorage.setItem(key, value);
            return true;
        } catch {
            console.error('[safeSet] Failed to free space. Save aborted for key:', key);
            return false;
        }
    }
}

export function saveInventoryItem(item: InventoryItem): void {
    const all = getAllInventory();
    const idx = all.findIndex(i => i.id === item.id);
    if (idx >= 0) {
        all[idx] = item;
    } else {
        all.push(item);
    }
    safeSet(STORAGE_KEYS.INVENTORY, JSON.stringify(all));
}

export function deleteInventoryItem(itemId: string): void {
    const all = getAllInventory().filter(i => i.id !== itemId);
    safeSet(STORAGE_KEYS.INVENTORY, JSON.stringify(all));
}

export function updateStock(itemId: string, diff: number, type: 'in' | 'out' | 'adjust', reason: string, staffName: string): void {
    const all = getAllInventory();
    const item = all.find(i => i.id === itemId);
    if (!item) return;

    item.currentStock += diff;
    if (type === 'in') item.lastRestockedAt = new Date().toISOString();

    saveInventoryItem(item);

    // Log the change
    let logs = getAllInventoryLogs();
    const newLog: InventoryLog = {
        id: Date.now().toString(36),
        itemId,
        type,
        quantity: diff,
        reason,
        timestamp: new Date().toISOString(),
        staffName
    };
    logs.push(newLog);

    // Attempt to save logs with a cap
    if (logs.length > 100) logs = logs.slice(-100);
    safeSet(STORAGE_KEYS.INVENTORY_LOGS, JSON.stringify(logs));
}

export function getAllInventoryLogs(): InventoryLog[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(STORAGE_KEYS.INVENTORY_LOGS);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}
