import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with cross-site routing.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublicRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/auth/callback') || request.nextUrl.pathname.startsWith('/manifest') || request.nextUrl.pathname.startsWith('/sw.js')
  
  if (!user && !isPublicRoute) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('reason', 'middleware_no_user')
    url.searchParams.set('from', request.nextUrl.pathname)
    const response = NextResponse.redirect(url)
    response.headers.set('Cache-Control', 'no-store, max-age=0')
    return response
  }
  
  if (user && isPublicRoute && request.nextUrl.pathname === '/login') {
    // user is already logged in, redirect away from login page
    const url = request.nextUrl.clone()
    url.pathname = '/'
    const response = NextResponse.redirect(url)
    response.headers.set('Cache-Control', 'no-store, max-age=0')
    return response
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse
}


