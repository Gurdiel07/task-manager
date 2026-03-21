import { edgeAuth } from "@/lib/auth/edge";
import { NextResponse } from "next/server";

const publicPaths = ["/", "/login", "/register", "/portal"];

export default edgeAuth((req) => {
  const { pathname } = req.nextUrl;

  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  const isAuthApi = pathname.startsWith("/api/auth");
  const isPublicApi = pathname.startsWith("/api/public");

  if (isPublicPath || isAuthApi || isPublicApi) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)"],
};
