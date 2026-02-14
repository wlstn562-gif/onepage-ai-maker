import { NextResponse } from 'next/server';
import { getFinanceData, saveFinanceData, FinanceData } from '@/lib/finance-db';

export async function GET() {
    try {
        const data = await getFinanceData();
        console.log(`[SYNC GET] Returning ${data.transactions?.length || 0} txs, ${data.settlements?.length || 0} settles`);
        return NextResponse.json(data);
    } catch (error) {
        console.error('[SYNC GET] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch finance data' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const payload: FinanceData = await req.json();
        console.log(`[SYNC POST] Received payload: ${payload.transactions?.length || 0} txs, ${payload.settlements?.length || 0} settles`);
        await saveFinanceData(payload);
        console.log(`[SYNC POST] Saved successfully at ${new Date().toISOString()}`);
        return NextResponse.json({ success: true, updatedAt: new Date().toISOString() });
    } catch (error) {
        console.error('[SYNC POST] Error:', error);
        return NextResponse.json({ error: 'Failed to save finance data' }, { status: 500 });
    }
}
