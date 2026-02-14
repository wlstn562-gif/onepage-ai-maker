import { NextResponse } from 'next/server';
import { getFinanceData, saveFinanceData, FinanceData, isRedisConfigured } from '@/lib/finance-db';

export async function GET() {
    try {
        const data = await getFinanceData();
        const isRedis = isRedisConfigured();
        console.log(`[SYNC GET] Returning ${data.transactions?.length || 0} txs. Redis: ${isRedis}`);
        return NextResponse.json({ ...data, redisStatus: isRedis });
    } catch (error) {
        console.error('[SYNC GET] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch finance data' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const payload: FinanceData = await req.json();
        const isRedis = isRedisConfigured();
        console.log(`[SYNC POST] Payload: ${payload.transactions?.length || 0} txs. Redis: ${isRedis}`);
        await saveFinanceData(payload);
        return NextResponse.json({ success: true, redisStatus: isRedis, updatedAt: new Date().toISOString() });
    } catch (error) {
        console.error('[SYNC POST] Error:', error);
        return NextResponse.json({ error: 'Failed to save finance data' }, { status: 500 });
    }
}
