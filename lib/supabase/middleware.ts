import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';


export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
      global: {
        fetch: (url, options) => {
          return fetch(url, { ...options, cache: 'no-store' });
        }
      }
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't need auth checking
  const isPublicRoute = request.nextUrl.pathname === '/' || 
                        request.nextUrl.pathname.startsWith('/auth') || 
                        request.nextUrl.pathname.startsWith('/api') ||
                        request.nextUrl.pathname.startsWith('/_next');

  // Prevent logged-in users from seeing login/signup pages
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/signup') ||
                     request.nextUrl.pathname.startsWith('/forgot-password') ||
                     request.nextUrl.pathname.startsWith('/reset-password');

  if (isAuthPage) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Require auth for everything else
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Organization Validation
  if (user && !isPublicRoute && !request.nextUrl.pathname.startsWith('/onboarding') && !request.nextUrl.pathname.startsWith('/settings')) {
    const pathnameParts = request.nextUrl.pathname.split('/').filter(Boolean);
    const slug = pathnameParts[0];

    // If there is no slug (e.g. /dashboard which we'll move), redirect to onboarding
    if (!slug || slug === 'dashboard') {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }

    // Validate that the user belongs to the organization corresponding to the URL slug
    const { data: memberships, error: memberError } = await supabase
      .from('organization_members')
      .select('organizations(id, slug)')
      .eq('user_id', user.id);

    const member = memberships?.find(m => {
      const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
      return org?.slug === slug;
    });

    if (!member) {
      console.log("Middleware Redirect -> /onboarding");
      console.log("Reason: Member not found.");
      console.log("slug:", slug, "user.id:", user.id);
      console.log("memberError:", memberError);
      
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }

    // If cookie is missing or mismatching, update it to match the valid URL they are accessing
    const cookieOrgId = request.cookies.get('active_organization_id')?.value;
    const orgData = member.organizations as any;
    
    if (cookieOrgId !== orgData.id) {
      supabaseResponse.cookies.set('active_organization_id', orgData.id, {
        path: '/',
        httpOnly: true,
        secure: true,
      });
    }
  }

  return supabaseResponse;
}
