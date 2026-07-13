import { supabase } from '../lib/supabase/client'

export const getProfile = async (id) => supabase
  ? supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  : { data: null, error: new Error('Supabase 환경 변수가 설정되지 않았습니다.') }

export async function ensureProfile(user) {
  if (!supabase || !user) return { data: null, error: new Error('로그인 정보를 확인할 수 없습니다.') }

  const existing = await getProfile(user.id)
  if (existing.error || existing.data) return existing

  const metadataNickname = user.user_metadata?.nickname?.trim()
  const fallbackNickname = user.email?.split('@')[0] || '사용자'
  const nickname = metadataNickname || fallbackNickname

  const created = await supabase
    .from('profiles')
    .insert({ id: user.id, nickname })
    .select()
    .single()

  if (created.error?.code === '23505') return getProfile(user.id)
  return created
}

export const updateProfile = async (id, payload) => supabase.from('profiles').update(payload).eq('id', id).select().single()

export const uploadAvatar = async (userId, file) => {
  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return { data: null, error: new Error('5MB 이하의 이미지 파일만 올릴 수 있습니다.') }
  const path = `${userId}/${crypto.randomUUID()}.${file.name.split('.').pop()}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: false })
  if (error) return { data: null, error }
  return { data: supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl, error: null }
}
