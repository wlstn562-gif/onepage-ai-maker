'use client';

import React, { useState, useEffect } from 'react';
import {
    X, Package, AlertTriangle, ArrowUpRight, ArrowDownLeft,
    History, Search, Plus, Filter, LayoutGrid, Monitor,
    CheckCircle2, RotateCcw, Boxes
} from 'lucide-react';
import {
    getAllInventory, InventoryItem, InventoryLog,
    getAllInventoryLogs, updateStock, saveInventoryItem
} from '@/lib/inventory-store';

interface InventoryDashboardProps {
    onClose: () => void;
}

const BRANCHES = ['전체', '천안점', '청주점', '대전둔산점', '본사'];

export default function InventoryDashboard({ onClose }: InventoryDashboardProps) {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'stock' | 'logs'>('stock');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [selectedBranch, setSelectedBranch] = useState('전체');

    useEffect(() => {
        setItems(getAllInventory());
        setLogs(getAllInventoryLogs());
    }, []);

    const filteredItems = items.filter(item =>
        (item.name.includes(searchTerm) || item.itemCode.includes(searchTerm)) &&
        (filterCategory === 'all' || item.category === filterCategory) &&
        (selectedBranch === '전체' || item.branch === selectedBranch)
    );

    const lowStockCount = items.filter(i => i.currentStock <= i.minRequired).length;

    return (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl z-[305] flex flex-col font-sans text-white animate-in zoom-in-95 duration-500">

            {/* 1. Dashboard Header */}
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-zinc-950 px-6">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Boxes size={18} className="text-black" />
                        </div>
                        <h1 className="text-sm font-black tracking-tighter text-white uppercase italic">INVENTORY HUD</h1>
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all
                                ${activeTab === 'stock' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <LayoutGrid size={14} /> 재고 현황
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all
                                ${activeTab === 'logs' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <History size={14} /> 변동 이력
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {lowStockCount > 0 && (
                        <div className="px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-black text-rose-500 uppercase flex items-center gap-2 animate-pulse">
                            <AlertTriangle size={14} />
                            {lowStockCount} items low in stock
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-white/5 border border-white/10 text-zinc-400 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-xl"
                    >
                        <X size={18} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* 2. Left Panel: Stock Status */}
                <main className="flex-1 flex flex-col overflow-hidden">

                    {/* Branch Tabs */}
                    <div className="px-6 pt-4 pb-0 border-b border-white/5 bg-zinc-950/50 flex items-center gap-2 overflow-x-auto">
                        {BRANCHES.map(branch => {
                            const branchItems = branch === '전체' ? items : items.filter(i => i.branch === branch);
                            const low = branchItems.filter(i => i.currentStock <= i.minRequired).length;
                            return (
                                <button
                                    key={branch}
                                    onClick={() => setSelectedBranch(branch)}
                                    className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${selectedBranch === branch
                                            ? 'border-emerald-500 text-emerald-400'
                                            : 'border-transparent text-zinc-500 hover:text-white'
                                        }`}
                                >
                                    {branch}
                                    {low > 0 && (
                                        <span className="w-4 h-4 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center">{low}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Toolbar */}
                    <div className="p-6 border-b border-white/5 bg-zinc-950/50 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="재고 항목 검색 (코드, 이름)..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 appearance-none"
                            >
                                <option value="all">전체 카테고리</option>
                                <option value="소모품">소모품</option>
                                <option value="비품">비품</option>
                                <option value="상품">상품</option>
                                <option value="기타">기타</option>
                            </select>
                            <button className="bg-emerald-500 text-black px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20">
                                <Plus size={18} /> 단일 품목 등록
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'stock' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredItems.map(item => (
                                    <div key={item.id} className={`group relative p-6 rounded-3xl border transition-all duration-300 overflow-hidden
                                        ${item.currentStock <= item.minRequired
                                            ? 'bg-rose-500/5 border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)]'
                                            : 'bg-white/5 border-white/10 hover:border-emerald-500/30'}`}>

                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <span className="text-[10px] font-black tracking-widest text-zinc-600 uppercase mb-1 block">{item.itemCode}</span>
                                                <h3 className="text-xl font-black tracking-tighter italic">{item.name}</h3>
                                            </div>
                                            <div className={`p-3 rounded-2xl ${item.currentStock <= item.minRequired ? 'bg-rose-500 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                <Package size={20} />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-end justify-between">
                                                <div className="text-sm text-zinc-500 font-bold uppercase tracking-widest">현재 재고</div>
                                                <div className="text-4xl font-black tracking-tighter">
                                                    <span className={item.currentStock <= item.minRequired ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}>
                                                        {item.currentStock}
                                                    </span>
                                                    <span className="text-lg text-zinc-600 ml-1 italic">{item.unit}</span>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${item.currentStock <= item.minRequired ? 'bg-rose-500' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}
                                                    style={{ width: `${Math.min(100, (item.currentStock / (item.minRequired * 3)) * 100)}%` }}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between text-[10px] font-black tracking-widest text-zinc-600 pt-2 border-t border-white/5">
                                                <span>최소 필요량: {item.minRequired}{item.unit}</span>
                                                <span>지점: {item.branch}</span>
                                            </div>
                                        </div>

                                        {/* Quick Actions Overlay */}
                                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button className="w-14 h-14 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg">
                                                <ArrowUpRight size={24} />
                                            </button>
                                            <button className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg">
                                                <ArrowDownLeft size={24} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto space-y-4">
                                {logs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-96 text-zinc-700 gap-4">
                                        <History size={64} className="opacity-10" />
                                        <p className="text-sm font-black uppercase tracking-[0.2em]">최근 변동 내력이 없습니다</p>
                                    </div>
                                ) : (
                                    logs.slice().reverse().map(log => (
                                        <div key={log.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.type === 'in' ? 'bg-emerald-500/10 text-emerald-500' :
                                                log.type === 'out' ? 'bg-rose-500/10 text-rose-500' :
                                                    'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                {log.type === 'in' ? <ArrowUpRight size={20} /> :
                                                    log.type === 'out' ? <ArrowDownLeft size={20} /> : <RotateCcw size={20} />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-white">
                                                    {log.type === 'in' ? '재고 입고' : log.type === 'out' ? '재고 출고' : '재고 조정'}
                                                    <span className="ml-2 text-zinc-500 font-medium">({log.quantity > 0 ? `+${log.quantity}` : log.quantity})</span>
                                                </p>
                                                <p className="text-xs text-zinc-500 mt-1">{log.reason} • {log.staffName}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </p>
                                                <p className="text-[10px] text-zinc-700">{new Date(log.timestamp).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {/* 3. Right Panel: Alerts & Summary */}
                <aside className="w-80 border-l border-white/5 bg-zinc-950/50 flex flex-col p-6 animate-in slide-in-from-right-10 duration-700">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-8 italic">Inventory Intelligence</h3>

                    <div className="space-y-8">
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total Items</p>
                                <p className="text-2xl font-black italic">{items.length}</p>
                            </div>
                            <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/20">
                                <p className="text-[9px] font-black text-rose-500/50 uppercase tracking-widest mb-1">Low Stock</p>
                                <p className="text-2xl font-black italic text-rose-500">{lowStockCount}</p>
                            </div>
                        </div>

                        {/* Low Stock Alerts Loop */}
                        <div className="space-y-4">
                            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Critical Alerts</span>
                            {items.filter(i => i.currentStock <= i.minRequired).map(i => (
                                <div key={i.id} className="flex items-center gap-3 p-3 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                                    <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center text-white">
                                        <AlertTriangle size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black text-zinc-200 truncate">{i.name}</p>
                                        <p className="text-[9px] text-rose-500 uppercase font-black">Restock Required</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* System Log Mock */}
                        <div className="space-y-4 p-4 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Monitor size={14} className="text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">AI Analyst Online</span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-zinc-400 font-medium">
                                "현재 <span className="text-white font-bold">인화지</span> 재고가 충분하지만, <span className="text-rose-500 font-bold">Magenta 잉크</span>가 부족합니다. 대전 지점으로의 물류 이동을 권장합니다."
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 flex flex-col items-center justify-center gap-4 text-center opacity-30">
                        <CheckCircle2 size={32} className="text-zinc-800" />
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 italic">Inventory Flow Optimal</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
