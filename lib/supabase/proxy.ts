import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  hasEnvVars,
  shouldFailFastForMissingRuntimeEnv,
  supabasePublicKey,
} from "../utils";

const PUBLIC_FILE = /\.(.*)$/;
const INITIAL_ORGANIZATION_ONBOARDING_PATH = "/onboarding/organizacao";

function shouldSkipAuth(pathname: string) {
  return (
    pathname === "/manifest.webmanifest" ||
    pathname === "/favicon.ico" ||
    pathname === "/opengraph-image.png" ||
    pathname === "/twitter-image.png" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login") ||
    PUBLIC_FILE.test(pathname)
  );
}

function shouldRequireOrganization(pathname: string) {
  return pathname === "/protected" || pathname.startsWith("/protected/");
}

function assertRuntimeEnvForProxy() {
  if (hasEnvVars) {
    return;
  }

  if (shouldFailFastForMissingRuntimeEnv()) {
    throw new Error(
      "Supabase public environment variables are missing for the session proxy. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
}

async function hasActiveOrganizationMembership(
  supabase: ReturnType<typeof createServerClient>,
  authUserId: string,
) {
  const { data, error } = await supabase
    .from("organization_memberships")
    .select("id")
    .eq("auth_user_id", authUserId)
    .eq("is_active", true)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).length > 0;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (shouldSkipAuth(request.nextUrl.pathname)) {
    return supabaseResponse;
  }

  assertRuntimeEnvForProxy();

  // Local development may run before Supabase env vars are configured.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || !supabasePublicKey) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(supabaseUrl, supabasePublicKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (request.nextUrl.pathname !== "/" && !user) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  if (user?.sub && shouldRequireOrganization(request.nextUrl.pathname)) {
    const hasMembership = await hasActiveOrganizationMembership(
      supabase,
      String(user.sub),
    );

    if (!hasMembership) {
      const url = request.nextUrl.clone();
      url.pathname = INITIAL_ORGANIZATION_ONBOARDING_PATH;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
