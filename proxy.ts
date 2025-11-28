import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // routes that require REGISTERED users (not anonymous)
  const registeredOnlyRoutes = ['/dashboard', '/appointments']
  const isRegisteredOnlyRoute = registeredOnlyRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // auth routes (login/signup) - redirect to dashboard if already logged in (and not anonymous)
  const authRoutes = ['/login', '/signup']
  const isAuthRoute = authRoutes.some(route =>
    request.nextUrl.pathname === route
  )

  // dashboard and appointments require registered user
  if (isRegisteredOnlyRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // if anonymous user tries to access dashboard, redirect to signup with upgrade flag
    if (user.is_anonymous) {
      const url = request.nextUrl.clone()
      url.pathname = '/signup'
      url.searchParams.set('upgrade', 'true')
      url.searchParams.set('message', 'Create an account to access your dashboard')
      return NextResponse.redirect(url)
    }
  }

  // if registered user visits login/signup, redirect to dashboard
  // but allow anonymous users to visit signup (to upgrade their account)
  if (isAuthRoute && user && !user.is_anonymous) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
