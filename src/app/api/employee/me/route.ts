import { NextResponse } from 'next/server';
import { getEmployees } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // In real app, verify/decode token.
        // Here, we trust the 'user-info' cookie for simplicity OR manually decode the base64 mock token.
        // Let's decode the base64 token.
        const payloadStr = Buffer.from(token.value, 'base64').toString('utf-8');
        const payload = JSON.parse(payloadStr);

        // If admin, this might fail if admin token is just a string.
        if (token.value === 'admin-token-secret') {
            return NextResponse.json({ role: 'admin' });
        }

        const employees = getEmployees();
        const me = employees.find(e => e.id === payload.id);

        if (!me) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Return safe data
        return NextResponse.json(me);

    } catch (error) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
}
