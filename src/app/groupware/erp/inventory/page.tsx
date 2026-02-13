'use client';

import { useState, useEffect } from 'react';
import {
    getAllInventory, InventoryItem, InventoryLog,
    getAllInventoryLogs, updateStock, saveInventoryItem, deleteInventoryItem,
    INVENTORY_CATALOG, CatalogItem
} from '@/lib/inventory-store';

const BRANCHES = ['전체', '천안점', '청주점', '대전둔산점'];

export default function InventoryManagementPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [selectedBranch, setSelectedBranch] = useState('전체');
    const [searchTerm, setSearchTerm] = useState('');
    const [staffName, setStaffName] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [catalogSearch, setCatalogSearch] = useState('');
    const [catalogGroup, setCatalogGroup] = useState<'주요재고' | '기타재고'>('주요재고');

    useEffect(() => {
        setItems(getAllInventory());
        setLogs(getAllInventoryLogs());

        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        };
        const n = getCookie('user-name');
        if (n) {
            try {
                let decoded = n;
                for (let i = 0; i < 3; i++) {
                    if (decoded.includes('%')) decoded = decodeURIComponent(decoded);
                    else break;
                }
                setStaffName(decoded);
            } catch { setStaffName(n); }
        }
    }, []);

    const handleStockUpdate = (itemId: string, diff: number, type: 'in' | 'out', reason: string) => {
        updateStock(itemId, diff, type, reason, staffName || '직원');
        setItems(getAllInventory());
        setLogs(getAllInventoryLogs());
    };

    const handleDeleteItem = (itemId: string, itemName: string) => {
        if (confirm(`정말로 '${itemName}' 품목을 삭제하시겠습니까?`)) {
            deleteInventoryItem(itemId);
            setItems(getAllInventory());
        }
    };

    const handleRenameItem = (itemId: string, newName: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item || !newName.trim()) return;
        saveInventoryItem({ ...item, name: newName.trim() });
        setItems(getAllInventory());
    };

    const handleAddFromCatalog = (catalogItem: CatalogItem) => {
        const branch = selectedBranch === '전체' ? '천안점' : selectedBranch;
        // Check if already exists for this branch
        const exists = items.find(i => i.name === catalogItem.name && i.branch === branch);
        if (exists) {
            alert(`'${catalogItem.name}'은(는) 이미 ${branch}에 등록되어 있습니다.`);
            return;
        }
        const item: InventoryItem = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
            itemCode: `${catalogItem.category === '소모품' ? 'S' : catalogItem.category === '상품' ? 'G' : 'E'}-${Date.now().toString(36).slice(-3).toUpperCase()}`,
            name: catalogItem.name,
            category: catalogItem.category,
            currentStock: 0,
            minRequired: 5,
            unit: catalogItem.unit,
            lastRestockedAt: new Date().toISOString(),
            branch,
        };
        saveInventoryItem(item);
        setItems(getAllInventory());
    };

    const filteredItems = items.filter(item =>
        (selectedBranch === '전체' || item.branch === selectedBranch) &&
        (item.name.includes(searchTerm) || item.itemCode.includes(searchTerm))
    );

    const branchLowStock = (branch: string) => {
        const branchItems = branch === '전체' ? items : items.filter(i => i.branch === branch);
        return branchItems.filter(i => i.currentStock <= i.minRequired).length;
    };

    const filteredCatalog = INVENTORY_CATALOG.filter(c =>
        c.group === catalogGroup &&
        (catalogSearch === '' || c.name.includes(catalogSearch))
    );

    return (
        <div className="flex gap-6 min-h-[calc(100vh-120px)]">
            {/* ===== LEFT: Main Inventory Grid ===== */}
            <div className="flex-1 space-y-5 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">재고 관리</h2>
                        <p className="text-sm text-zinc-500 mt-1">소모품 및 상품 현황</p>
                    </div>
                    <button
                        onClick={() => setEditMode(!editMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${editMode
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">{editMode ? 'edit_off' : 'edit'}</span>
                        {editMode ? '수정 완료' : '품목 수정'}
                    </button>
                </div>

                {editMode && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/20 text-[11px] text-red-400 font-bold animate-in slide-in-from-top-2 duration-200">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        수정 모드: 이름 클릭 → 수정 / ✕ → 삭제
                    </div>
                )}

                {/* Branch Tabs */}
                <div className="flex items-center gap-1 bg-zinc-900/50 border border-zinc-800 p-1 rounded-xl overflow-x-auto">
                    {BRANCHES.map(branch => {
                        const low = branchLowStock(branch);
                        return (
                            <button key={branch} onClick={() => setSelectedBranch(branch)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${selectedBranch === branch
                                        ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                    }`}>
                                <span className="material-symbols-outlined text-[16px]">{branch === '전체' ? 'warehouse' : 'store'}</span>
                                {branch}
                                {low > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-[9px] font-black text-white flex items-center justify-center animate-pulse">{low}</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="relative max-w-xs">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">search</span>
                    <input type="text" placeholder="품목 검색..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-yellow-500/50" />
                </div>

                {/* Stock Grid */}
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
                        <span className="material-symbols-outlined text-4xl opacity-30 mb-3">inventory_2</span>
                        <p className="text-sm font-bold">등록된 품목이 없습니다</p>
                        <p className="text-xs text-zinc-700 mt-1">우측 목록에서 품목을 추가하세요 →</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredItems.map(item => (
                            <div key={item.id} className={`relative p-3.5 bg-zinc-900/50 border rounded-xl transition-all ${item.currentStock <= item.minRequired ? 'border-red-900/30 bg-red-900/5' : 'border-zinc-800 hover:border-zinc-700'
                                } ${editMode ? 'ring-1 ring-red-500/20' : ''}`}>
                                {editMode && (
                                    <button onClick={() => handleDeleteItem(item.id, item.name)}
                                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-[10px] font-black shadow-lg z-10 animate-in zoom-in-50 duration-200">✕</button>
                                )}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[9px] font-bold text-zinc-600 tracking-widest uppercase">{item.itemCode}</span>
                                        {editMode ? (
                                            <input type="text" defaultValue={item.name}
                                                onBlur={(e) => handleRenameItem(item.id, e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                                className="block text-sm font-bold text-white bg-zinc-800 border border-yellow-500/30 rounded px-1.5 py-0.5 w-full mt-0.5 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none" />
                                        ) : (
                                            <h3 className="text-sm font-bold text-white mt-0.5 truncate">{item.name}</h3>
                                        )}
                                        <p className="text-[10px] text-zinc-500">{item.category} • {item.branch}</p>
                                    </div>
                                </div>

                                <div className="flex items-end justify-between mb-1">
                                    <span className="text-[10px] text-zinc-500 font-bold">현재</span>
                                    <div className="text-xl font-bold font-mono">
                                        <span className={item.currentStock <= item.minRequired ? 'text-red-500' : 'text-emerald-500'}>{item.currentStock}</span>
                                        <span className="text-[10px] text-zinc-600 font-normal ml-0.5">{item.unit}</span>
                                    </div>
                                </div>

                                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden mb-2">
                                    <div className={`h-full rounded-full transition-all duration-500 ${item.currentStock <= item.minRequired ? 'bg-red-500' : 'bg-emerald-600'}`}
                                        style={{ width: `${Math.min(100, (item.currentStock / Math.max(item.minRequired * 3, 1)) * 100)}%` }} />
                                </div>

                                <div className="flex gap-1">
                                    <button onClick={() => { const qty = prompt('입고 수량', '10'); if (qty) handleStockUpdate(item.id, parseInt(qty), 'in', '입고'); }}
                                        className="flex-1 py-1.5 rounded-lg bg-zinc-800 text-[11px] font-bold text-white hover:bg-zinc-700 transition-colors flex items-center justify-center gap-0.5">
                                        <span className="material-symbols-outlined text-[13px] text-emerald-500">add</span> 입고
                                    </button>
                                    <button onClick={() => { const qty = prompt('출고 수량', '1'); if (qty) handleStockUpdate(item.id, -parseInt(qty), 'out', '출고'); }}
                                        className="flex-1 py-1.5 rounded-lg bg-zinc-800 text-[11px] font-bold text-white hover:bg-zinc-700 transition-colors flex items-center justify-center gap-0.5">
                                        <span className="material-symbols-outlined text-[13px] text-red-500">remove</span> 출고
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Logs */}
                {logs.length > 0 && (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                        <div className="p-3 border-b border-zinc-800">
                            <h3 className="text-xs font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-zinc-500 text-[16px]">history</span> 최근 변동
                            </h3>
                        </div>
                        <div className="divide-y divide-zinc-800/50 max-h-60 overflow-y-auto">
                            {logs.slice().reverse().slice(0, 6).map(log => {
                                const item = items.find(i => i.id === log.itemId);
                                if (selectedBranch !== '전체' && item?.branch !== selectedBranch) return null;
                                return (
                                    <div key={log.id} className="px-3 py-2 flex items-center gap-2 text-xs">
                                        <span className={`material-symbols-outlined text-[14px] ${log.type === 'in' ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {log.type === 'in' ? 'south_west' : 'north_east'}
                                        </span>
                                        <span className="font-bold text-white truncate">{item?.name}</span>
                                        <span className={log.type === 'in' ? 'text-emerald-500' : 'text-red-500'}>
                                            {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                                        </span>
                                        <span className="text-zinc-600 ml-auto text-[10px] whitespace-nowrap">{log.staffName} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ===== RIGHT: Catalog Sidebar ===== */}
            <div className="w-72 shrink-0 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-zinc-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-yellow-500 text-[18px]">list_alt</span> 품목 카탈로그
                    </h3>
                    {/* Group Toggle */}
                    <div className="flex gap-1 bg-zinc-800 p-0.5 rounded-lg mb-2">
                        <button onClick={() => setCatalogGroup('주요재고')}
                            className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${catalogGroup === '주요재고' ? 'bg-yellow-500/20 text-yellow-500' : 'text-zinc-400 hover:text-white'}`}>
                            주요재고
                        </button>
                        <button onClick={() => setCatalogGroup('기타재고')}
                            className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${catalogGroup === '기타재고' ? 'bg-yellow-500/20 text-yellow-500' : 'text-zinc-400 hover:text-white'}`}>
                            기타재고
                        </button>
                    </div>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600 text-[14px]">search</span>
                        <input type="text" placeholder="품목 검색..." value={catalogSearch}
                            onChange={e => setCatalogSearch(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-yellow-500/50" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {filteredCatalog.map((cat, idx) => {
                        const activeBranch = selectedBranch === '전체' ? '천안점' : selectedBranch;
                        const alreadyAdded = items.some(i => i.name === cat.name && i.branch === activeBranch);
                        return (
                            <button key={idx}
                                onClick={() => !alreadyAdded && handleAddFromCatalog(cat)}
                                disabled={alreadyAdded}
                                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 transition-all ${alreadyAdded
                                        ? 'opacity-40 cursor-not-allowed'
                                        : 'hover:bg-yellow-500/10 hover:text-yellow-400 cursor-pointer'
                                    }`}>
                                <span className={`material-symbols-outlined text-[16px] ${alreadyAdded ? 'text-emerald-600' : 'text-zinc-600'}`}>
                                    {alreadyAdded ? 'check_circle' : 'add_circle_outline'}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-white truncate">{cat.name}</p>
                                    {cat.note && <p className="text-[9px] text-zinc-500 truncate">{cat.note}</p>}
                                </div>
                                <span className="text-[9px] text-zinc-600 shrink-0">{cat.unit}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="p-3 border-t border-zinc-800 text-center">
                    <p className="text-[10px] text-zinc-600">
                        {selectedBranch === '전체' ? '천안점' : selectedBranch}에 추가됩니다
                    </p>
                </div>
            </div>
        </div>
    );
}
