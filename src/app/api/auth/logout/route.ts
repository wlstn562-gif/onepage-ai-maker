import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json(
        { success: true, message: 'Logged out successfully' },
        { status: 200 }
    );

    // Clear all auth cookies
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('user-role', '', { maxAge: 0, path: '/' });
    response.cookies.set('user-info', '', { maxAge: 0, path: '/' });

    return response;
}
