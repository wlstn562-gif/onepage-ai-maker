'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, password }),
            });

            const data = await response.json();

            if (response.ok) {
                router.push('/');
                router.refresh(); // Refresh to update middleware state
            } else {
                setError(data.message || '로그인을 실패했습니다.');
            }
        } catch (err) {
            setError('서버 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
            <div className="w-full max-w-sm space-y-8 rounded-2xl bg-zinc-900/50 p-8 border border-white/5 backdrop-blur-xl">
                <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-white">직원 전용 로그인</h2>
                    <p className="mt-2 text-sm text-zinc-400">그룹웨어 접속을 위해 로그인해주세요.</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="id" className="sr-only">아이디</label>
                            <input
                                id="id"
                                name="id"
                                type="text"
                                required
                                className="relative block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-3 text-white placeholder-zinc-500 focus:z-10 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm transition-colors"
                                placeholder="아이디"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">비밀번호</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="relative block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-3 text-white placeholder-zinc-500 focus:z-10 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm transition-colors"
                                placeholder="비밀번호"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-center text-sm text-red-500 font-medium bg-red-500/10 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative flex w-full justify-center rounded-lg bg-yellow-500 px-4 py-3 text-sm font-bold text-black hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                <div className="mt-4 text-center text-xs text-zinc-600">
                    데모 계정: employee / 1234
                </div>
            </div>
        </div>
    );
}
