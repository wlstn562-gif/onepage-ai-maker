'use client';

import { useState, useEffect } from 'react';
import { calculateTotalLeave } from '@/lib/leave';

interface Employee {
    id: string;
    name: string;
    department: string;
    position: string;
    joinDate: string;
    totalLeave: number;
    usedLeave: number;
    status?: 'active' | 'suspended';
    suspendedAt?: string;
    manualLeave?: number;
    username?: string;
}

export default function EmployeeManagementPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<{
        name: string;
        department: string;
        position: string;
        joinDate: string;
        baseLeave: number;
        manualLeave: number;
        status: 'active' | 'suspended';
        suspendedAt: string;
        username: string;
    }>({
        name: '',
        department: '',
        position: '',
        joinDate: '',
        baseLeave: 0,
        manualLeave: 0,
        status: 'active',
        suspendedAt: '',
        username: '',
    });

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/admin/employees');
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
            }
        } catch (error) {
            console.error('Failed to fetch employees', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const computeBaseLeave = (joinDate: string, status: string, suspendedAt: string) => {
        const cutoffDate = (status === 'suspended' && suspendedAt)
            ? suspendedAt
            : undefined;
        return calculateTotalLeave(joinDate, cutoffDate);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            const newData = { ...prev, [name]: value };

            // Auto-calculate base logic
            if (name === 'joinDate' || name === 'status' || name === 'suspendedAt') {
                if (newData.joinDate) {
                    newData.baseLeave = computeBaseLeave(
                        newData.joinDate,
                        newData.status,
                        newData.suspendedAt
                    );
                }
            }

            return newData;
        });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            department: '',
            position: '',
            joinDate: '',
            baseLeave: 0,
            manualLeave: 0,
            status: 'active',
            suspendedAt: '',
            username: '',
        });
        setEditingId(null);
    };

    const handleOpenAddModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (employee: Employee) => {
        const base = computeBaseLeave(
            employee.joinDate,
            employee.status || 'active',
            employee.suspendedAt || ''
        );

        // Manual leave inference fallback as before
        const storedManual = employee.manualLeave || 0;
        let inferredManual = storedManual;
        if (employee.manualLeave === undefined) {
            inferredManual = employee.totalLeave - base;
        }

        setFormData({
            name: employee.name,
            department: employee.department,
            position: employee.position,
            joinDate: employee.joinDate,
            baseLeave: base,
            manualLeave: inferredManual,
            status: employee.status || 'active',
            suspendedAt: employee.suspendedAt || '',
            username: employee.username || '',
        });
        setEditingId(employee.id);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const totalLeave = Number(formData.baseLeave) + Number(formData.manualLeave);

            const method = editingId ? 'PUT' : 'POST';
            const body = {
                id: editingId,
                name: formData.name,
                department: formData.department,
                position: formData.position,
                joinDate: formData.joinDate,
                totalLeave: totalLeave,
                manualLeave: Number(formData.manualLeave),
                status: formData.status,
                suspendedAt: formData.suspendedAt,
                username: formData.username,
                usedLeave: editingId ? undefined : 0
            };

            const res = await fetch('/api/admin/employees', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setIsModalOpen(false);
                resetForm();
                fetchEmployees();
            } else {
                alert(editingId ? '수정에 실패했습니다.' : '등록에 실패했습니다.');
            }
        } catch (error) {
            alert('오류가 발생했습니다.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`/api/admin/employees?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchEmployees();
            else alert('삭제 실패');
        } catch (e) {
            alert('오류 발생');
        }
    }

    const handleRecalculateAll = async () => {
        if (!confirm('모든 직원의 연차를 재계산하시겠습니까?\n* 임의 추가된 연차는 유지되고, 기본 연차만 업데이트됩니다.')) return;

        setIsRecalculating(true);
        try {
            const res = await fetch('/api/admin/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'recalculate' }),
            });
            if (res.ok) {
                alert('재계산이 완료되었습니다.');
                fetchEmployees();
            } else {
                alert('재계산 실패');
            }
        } catch (e) {
            alert('오류가 발생했습니다.');
        } finally {
            setIsRecalculating(false);
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">직원 관리</h2>
                    <p className="text-zinc-400">직원 입사일 및 연차 정보를 관리합니다.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRecalculateAll}
                        disabled={isRecalculating}
                        className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    >
                        {isRecalculating ? '계산 중...' : '🔄 전체 연차 재계산'}
                    </button>
                    <button
                        onClick={handleOpenAddModal}
                        className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400 transition-colors"
                    >
                        + 직원 등록
                    </button>
                </div>
            </div>

            {/* Employee Table */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-800/50 text-zinc-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">이름 (ID)</th>
                                <th className="px-6 py-3 font-medium">부서</th>
                                <th className="px-6 py-3 font-medium">상태</th>
                                <th className="px-6 py-3 font-medium">입사일</th>
                                <th className="px-6 py-3 font-medium text-center">총 발생 연차</th>
                                <th className="px-6 py-3 font-medium text-center">사용</th>
                                <th className="px-6 py-3 font-medium text-center">잔여</th>
                                <th className="px-6 py-3 font-medium text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
                                        로딩 중...
                                    </td>
                                </tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
                                        등록된 직원이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                employees.map((employee) => (
                                    <tr
                                        key={employee.id}
                                        className="hover:bg-zinc-800/30 transition-colors group"
                                    >
                                        <td className="px-6 py-4 font-medium text-white">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    {employee.name}
                                                    <button
                                                        onClick={() => handleOpenEditModal(employee)}
                                                        className="opacity-0 group-hover:opacity-100 text-xs text-yellow-500 underline"
                                                    >
                                                        수정
                                                    </button>
                                                </div>
                                                {employee.username && (
                                                    <span className="text-xs text-zinc-500">{employee.username}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-300">{employee.department}</td>
                                        <td className="px-6 py-4">
                                            {employee.status === 'suspended' ? (
                                                <span className="inline-flex items-center rounded-full bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400">
                                                    휴직/정지 ({employee.suspendedAt})
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-green-400/10 px-2 py-1 text-xs font-medium text-green-400">
                                                    재직중
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-300">{employee.joinDate}</td>
                                        <td className="px-6 py-4 text-center text-zinc-300">
                                            {employee.totalLeave}
                                            {employee.manualLeave ? (
                                                <span className="text-[10px] text-zinc-500 ml-1">
                                                    ({employee.totalLeave - employee.manualLeave} + {employee.manualLeave > 0 ? `+${employee.manualLeave}` : employee.manualLeave})
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-6 py-4 text-center text-rose-400">{employee.usedLeave}</td>
                                        <td className="px-6 py-4 text-center text-yellow-500 font-bold">
                                            {employee.totalLeave - employee.usedLeave}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(employee.id)}
                                                className="text-zinc-500 hover:text-red-400 transition-colors"
                                            >
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Employee Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h3 className="text-xl font-bold mb-4 text-white">
                            {editingId ? '직원 정보 수정' : '신규 직원 등록'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">이름</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">로그인 ID (영어 소문자)</label>
                                <input
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="예: hong (초기비번 1234)"
                                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">부서</label>
                                    <input
                                        name="department"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">직급</label>
                                    <input
                                        name="position"
                                        value={formData.position}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">입사일</label>
                                <input
                                    type="date"
                                    name="joinDate"
                                    value={formData.joinDate}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                                />
                            </div>

                            {/* Status Selector */}
                            <div className="bg-zinc-800/30 p-3 rounded-lg border border-zinc-800">
                                <label className="block text-xs font-medium text-zinc-400 mb-2">근무 상태</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="active"
                                            checked={formData.status === 'active'}
                                            onChange={handleInputChange}
                                            className="accent-yellow-500"
                                        />
                                        <span className="text-sm text-white">재직 중</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="suspended"
                                            checked={formData.status === 'suspended'}
                                            onChange={handleInputChange}
                                            className="accent-red-500"
                                        />
                                        <span className="text-sm text-red-400">휴직/근무정지</span>
                                    </label>
                                </div>

                                {/* Conditional Date Input */}
                                {formData.status === 'suspended' && (
                                    <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-xs font-medium text-red-400 mb-1">
                                            휴직/정지 시작일
                                        </label>
                                        <input
                                            type="date"
                                            name="suspendedAt"
                                            value={formData.suspendedAt}
                                            onChange={handleInputChange}
                                            required={formData.status === 'suspended'}
                                            className="w-full rounded-lg bg-zinc-900 border border-red-900/50 px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Leave Manual Calculation Area */}
                            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-400">기본 발생 연차 (자동)</span>
                                    <span className="font-bold text-white">{Number(formData.baseLeave).toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <label className="text-yellow-500 font-medium">✨ 임의 추가 / 차감</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            name="manualLeave"
                                            value={formData.manualLeave}
                                            onChange={handleInputChange}
                                            step="0.5"
                                            className="w-20 text-right rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-white focus:border-yellow-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="border-t border-zinc-700 pt-3 flex justify-between items-center">
                                    <span className="font-bold text-white">최종 연차 합계</span>
                                    <span className="text-xl font-black text-yellow-500">
                                        {(Number(formData.baseLeave) + Number(formData.manualLeave)).toFixed(1)}
                                    </span>
                                </div>
                                <p className="text-[10px] text-zinc-500 text-right">
                                    * 기본 {formData.baseLeave} + 추가 {formData.manualLeave}
                                </p>
                            </div>

                            <div className="flex gap-3 mt-6 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 rounded-lg bg-zinc-800 py-3 text-sm font-bold text-zinc-400 hover:bg-zinc-700 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 rounded-lg bg-yellow-500 py-3 text-sm font-bold text-black hover:bg-yellow-400 transition-colors"
                                >
                                    {editingId ? '수정하기' : '등록하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
