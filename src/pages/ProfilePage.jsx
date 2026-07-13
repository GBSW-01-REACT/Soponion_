import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Camera, RefreshCw, UserRound } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getProfile, updateProfile, uploadAvatar } from '../services/profiles'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { useToast } from '../components/ui/Toast'

export function ProfilePage() {
  const { id } = useParams()
  const { user, profile: ownProfile, profileError, loading: authLoading, refreshProfile } = useAuth()
  const toast = useToast()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [form, setForm] = useState({ nickname: '', introduction: '', profile_image_url: '' })
  const [editing, setEditing] = useState(false)
  const targetId = id || user?.id
  const own = Boolean(targetId && targetId === user?.id)

  const applyProfile = (nextProfile) => {
    setProfile(nextProfile)
    setForm({
      nickname: nextProfile?.nickname || '',
      introduction: nextProfile?.introduction || '',
      profile_image_url: nextProfile?.profile_image_url || '',
    })
  }

  const loadProfile = async () => {
    if (!targetId) { setLoading(false); return }

    setLoading(true)
    setLoadError(null)

    if (own) {
      const result = await refreshProfile()
      if (result.error) setLoadError(result.error)
      applyProfile(result.data)
    } else {
      const result = await getProfile(targetId)
      if (result.error) setLoadError(result.error)
      applyProfile(result.data)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!targetId) { setLoading(false); return }

    if (own) {
      if (authLoading) return
      if (profileError) setLoadError(profileError)
      applyProfile(ownProfile)
      setLoading(false)
      return
    }

    loadProfile()
  }, [targetId, own, ownProfile, profileError, authLoading])

  const save = async (event) => {
    event.preventDefault()
    if (form.nickname.trim().length < 2) return toast('닉네임은 2자 이상 입력해주세요.', 'error')

    const { data, error } = await updateProfile(user.id, form)
    if (error) return toast(error.code === '23505' ? '이미 사용 중인 닉네임입니다.' : error.message, 'error')

    await refreshProfile()
    applyProfile(data)
    setEditing(false)
    toast('프로필을 저장했습니다.')
  }

  const imageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const { data, error } = await uploadAvatar(user.id, file)
    if (error) return toast(error.message, 'error')
    setForm({ ...form, profile_image_url: data })
    toast('이미지를 업로드했습니다. 저장 버튼을 눌러 반영하세요.')
  }

  if (!targetId) return <main className="page-shell py-16 text-center">로그인 후 계정 설정을 확인할 수 있어요.</main>
  if (loading) return <main className="page-shell py-16 text-center text-[var(--text-muted)]">프로필을 불러오는 중입니다.</main>

  if (loadError) return <ProfileState title="프로필을 불러오지 못했어요." description="잠시 후 다시 시도해주세요." action={loadProfile}/>
  if (!profile) return <ProfileState title="사용자 프로필을 찾을 수 없어요." description={own ? '프로필 생성을 다시 시도해주세요.' : '삭제되었거나 아직 생성되지 않은 사용자예요.'} action={own ? loadProfile : undefined}/>

  return <main className="page-shell max-w-2xl py-10">
    <div className="mb-5"><p className="eyebrow">{own ? 'ACCOUNT SETTINGS' : 'PROFILE'}</p><h1 className="section-title mt-1">{own ? '계정 설정' : '사용자 프로필'}</h1></div>
    <section className="surface overflow-hidden">
      <div className="h-28 bg-[radial-gradient(circle_at_80%_20%,#8b5cf6,transparent_24%),linear-gradient(110deg,#1c2324,#101112)]"/>
      <div className="px-6 pb-7">
        <div className="-mt-12 flex items-end justify-between gap-4">
          <Avatar imageUrl={editing ? form.profile_image_url : profile.profile_image_url} nickname={profile.nickname}/>
          {own && <Button variant="outline" onClick={() => setEditing(!editing)}>{editing ? '취소' : '프로필 수정'}</Button>}
        </div>

        {editing ? <form onSubmit={save} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">닉네임<Input className="mt-2" value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })}/></label>
          <label className="block text-sm font-semibold">소개<Textarea className="mt-2" value={form.introduction} onChange={(event) => setForm({ ...form, introduction: event.target.value })} placeholder="나를 소개해주세요."/></label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#25e39a]"><Camera size={17}/>프로필 이미지 선택<input className="sr-only" type="file" accept="image/*" onChange={imageChange}/></label>
          <Button type="submit" className="w-full">저장하기</Button>
        </form> : <div className="mt-5"><h2 className="text-2xl font-extrabold">{profile.nickname}</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-[var(--text-soft)]">{profile.introduction || '아직 자기소개가 없어요.'}</p></div>}
      </div>
    </section>
  </main>
}

function Avatar({ imageUrl, nickname }) {
  return <div className="grid size-24 place-items-center overflow-hidden rounded-2xl border-4 border-[var(--surface)] bg-[#7d44e5] text-white">
    {imageUrl ? <img src={imageUrl} alt={`${nickname} 프로필 이미지`} className="size-full object-cover"/> : <UserRound size={42}/>}
  </div>
}

function ProfileState({ title, description, action }) {
  return <main className="page-shell py-16 text-center"><UserRound className="mx-auto text-[var(--text-muted)]" size={36}/><h1 className="mt-4 text-xl font-extrabold">{title}</h1><p className="mt-2 text-sm text-[var(--text-muted)]">{description}</p>{action && <Button className="mt-5" variant="outline" onClick={action}><RefreshCw size={16} className="mr-1"/>다시 시도</Button>}</main>
}
