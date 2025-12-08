import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    // 管理画面へのアクセスは、layout.tsxとpage.tsxで認証チェックを行う
    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*'],
}

