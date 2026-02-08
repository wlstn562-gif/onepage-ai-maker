import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getEvents, saveEvents, Event } from '@/lib/board';

export async function GET() {
    const events = getEvents();
    // Sort by date asc (upcoming first)
    // Filter out past events? Maybe just return all for now and let UI filter.
    // Let's sort by date ascending.
    const sorted = events.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime}`);
        const dateB = new Date(`${b.date}T${b.startTime}`);
        return dateA.getTime() - dateB.getTime();
    });
    return NextResponse.json(sorted);
}

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const role = cookieStore.get('user-role')?.value;

    if (role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, date, startTime, endTime, type } = body;

        if (!title || !date || !startTime || !endTime || !type) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const events = getEvents();
        const newEvent: Event = {
            id: Date.now().toString(),
            title,
            date,
            startTime,
            endTime,
            type
        };

        const updated = [...events, newEvent];
        saveEvents(updated);

        return NextResponse.json({ success: true, event: newEvent });
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const cookieStore = await cookies();
    const role = cookieStore.get('user-role')?.value;

    if (role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const events = getEvents();
    const updated = events.filter(e => e.id !== id);
    saveEvents(updated);

    return NextResponse.json({ success: true });
}
