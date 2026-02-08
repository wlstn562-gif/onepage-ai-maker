import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getNotices, saveNotices, Notice } from '@/lib/board';

export async function GET() {
    const notices = getNotices();
    // Sort by date desc
    const sorted = notices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        const { title, date, tag, content } = body;

        if (!title || !date || !tag || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const notices = getNotices();
        const newNotice: Notice = {
            id: Date.now().toString(),
            title,
            date,
            tag,
            content
        };

        const updated = [newNotice, ...notices];
        saveNotices(updated);

        return NextResponse.json({ success: true, notice: newNotice });
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

    const notices = getNotices();
    const updated = notices.filter(n => n.id !== id);
    saveNotices(updated);

    return NextResponse.json({ success: true });
}
