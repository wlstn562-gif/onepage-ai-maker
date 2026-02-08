import { NextResponse } from 'next/server';
import { getEmployees } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, password } = body;

        // 1. Admin Login
        if (id === 'admin' && password === '1234') {
            const response = NextResponse.json(
                { success: true, message: 'Admin login successful', role: 'admin' },
                { status: 200 }
            );

            response.cookies.set('auth-token', 'admin-token-secret', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24,
                path: '/',
            });

            response.cookies.set('user-role', 'admin', {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24,
                path: '/',
            });

            return response;
        }

        // 2. Employee Login (Real DB Check)
        const employees = getEmployees();
        // Check by username OR id. Also check password ("1234" is default if not set)
        const employee = employees.find(e =>
            (e.username === id || e.id === id) &&
            (e.password === password || (!e.password && password === '1234'))
        );

        if (employee) {
            const response = NextResponse.json(
                { success: true, message: 'Login successful', role: 'employee' },
                { status: 200 }
            );

            // Create a simple payload for the token/cookie
            const payload = JSON.stringify({
                id: employee.id,
                name: employee.name,
                username: employee.username
            });

            // In a real app, sign this token. Here we just base64 encode it for the mockup.
            const mockToken = Buffer.from(payload).toString('base64');

            response.cookies.set('auth-token', mockToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24,
                path: '/',
            });

            response.cookies.set('user-role', 'employee', {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24,
                path: '/',
            });

            // Also set user info for client-side convenience
            response.cookies.set('user-info', encodeURIComponent(payload), {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24,
                path: '/',
            });

            // Set simple user-name cookie for easier access
            response.cookies.set('user-name', encodeURIComponent(employee.name), {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24,
                path: '/',
            });

            return response;
        }

        return NextResponse.json(
            { success: false, message: 'Invalid credentials' },
            { status: 401 }
        );

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'An error occurred' },
            { status: 500 }
        );
    }
}
