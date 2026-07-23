import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/services/auth.service'
import { createAdminClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

async function getUser() {
  const cookieStore = cookies()
  const token = cookieStore.get('sigep_token')?.value
  if (!token) redirect('/auth/login')

  const payload = verifyToken(token)
  if (!payload) redirect('/auth/login')

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('id, name, login, crm, phone, role, created_at')
    .eq('id', payload.userId)
    .single()

  return user
}

export default async function ProfilePage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')
  return <ProfileClient user={user} />
}
