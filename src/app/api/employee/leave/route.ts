import { NextResponse } from 'next/server';
import { getEmployees, saveEmployees } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const payloadStr = Buffer.from(token.value, 'base64').toString('utf-8');
        const payload = JSON.parse(payloadStr);
        const userId = payload.id;

        const body = await request.json();
        const { date, type, days, reason } = body;

        if (!date || !days) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const employees = getEmployees();
        const updatedEmployees = employees.map(emp => {
            if (emp.id === userId) {
                const newHistory = {
                    id: Date.now().toString(),
                    date,
                    type, // 'annual', 'half', etc.
                    days: Number(days),
                    reason: reason || '',
                    createdAt: new Date().toISOString()
                };

                return {
                    ...emp,
                    usedLeave: (emp.usedLeave || 0) + Number(days),
                    leaveHistory: [...(emp.leaveHistory || []), newHistory]
                };
            }
            return emp;
        });

        saveEmployees(updatedEmployees);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const payloadStr = Buffer.from(token.value, 'base64').toString('utf-8');
        const payload = JSON.parse(payloadStr);
        const userId = payload.id;

        const { searchParams } = new URL(request.url);
        const historyId = searchParams.get('id');

        if (!historyId) {
            return NextResponse.json({ error: 'Missing history ID' }, { status: 400 });
        }

        const employees = getEmployees();
        const updatedEmployees = employees.map(emp => {
            if (emp.id === userId) {
                const targetItem = emp.leaveHistory?.find(h => h.id === historyId);
                if (!targetItem) return emp; // Item not found

                const newHistory = emp.leaveHistory?.filter(h => h.id !== historyId) || [];

                return {
                    ...emp,
                    usedLeave: Math.max(0, (emp.usedLeave || 0) - targetItem.days), // Restore balance
                    leaveHistory: newHistory
                };
            }
            return emp;
        });

        saveEmployees(updatedEmployees);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
