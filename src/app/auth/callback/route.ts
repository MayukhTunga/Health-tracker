import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Supabase's getSession() doesn't persist the Google provider_token, so we save it in a secure cookie
      if (session?.provider_token) {
        const cookieStore = await cookies()
        cookieStore.set('google_provider_token', session.provider_token, { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production',
          maxAge: 3500, // Google tokens expire in 1 hr
          path: '/'
        })
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=true`)
}
