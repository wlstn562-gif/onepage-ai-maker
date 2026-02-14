import { NextResponse } from 'next/server';
import { getFinanceData, saveFinanceData, FinanceData } from '@/lib/finance-db';

export async function GET() {
    try {
        const data = getFinanceData();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch finance data' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const payload: FinanceData = await req.json();
        saveFinanceData(payload);
        return NextResponse.json({ success: true, updatedAt: new Date().toISOString() });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save finance data' }, { status: 500 });
    }
}
