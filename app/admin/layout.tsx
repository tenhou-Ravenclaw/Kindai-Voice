import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server-auth'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createServerSupabaseClient()

    // 認証チェック
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    return <>{children}</>
}

