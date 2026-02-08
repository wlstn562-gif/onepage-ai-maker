import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Define paths that require authentication
    const isProtectedRoute = path.startsWith('/groupware')

    // Get the token from the cookies
    const token = request.cookies.get('auth-token')?.value

    // Redirect to login if accessing a protected route without a token
    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect to groupware if accessing login page with a token
    if (path === '/login' && token) {
        return NextResponse.redirect(new URL('/groupware', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/groupware/:path*', '/login'],
}
