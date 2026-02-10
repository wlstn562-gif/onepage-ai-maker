import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Define paths that require authentication
    const isProtectedRoute = path.startsWith('/groupware')

    // Get the token and role from the cookies
    const token = request.cookies.get('auth-token')?.value
    const role = request.cookies.get('user-role')?.value

    // 1. Root path protection: Only admin can access '/', others redirect to '/photo'
    if (path === '/') {
        if (role !== 'admin') {
            return NextResponse.redirect(new URL('/photo', request.url))
        }
    }

    // 2. Protected routes logic (Groupware)
    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 3. Login page redirection
    if (path === '/login' && token) {
        return NextResponse.redirect(new URL('/groupware', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/', '/groupware/:path*', '/login'],
}
