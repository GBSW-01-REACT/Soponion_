import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase/client'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'

function getSignupErrorMessage(error) {
  const message = error?.message?.toLowerCase() || ''

  if (error?.code === '23505') return '이미 사용 중인 닉네임입니다.'
  if (message.includes('rate limit')) return '회원가입 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  if (message.includes('already registered')) return '이미 가입된 이메일입니다. 로그인해주세요.'
  if (message.includes('invalid email')) return '이메일 형식을 다시 확인해주세요.'

  return '회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.'
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const submit = async (event) => {
    event.preventDefault()
    if (!supabase) return toast('Supabase 환경 변수를 확인해주세요.', 'error')

    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)

    if (error) return toast('이메일 또는 비밀번호를 다시 확인해주세요.', 'error')
    toast('로그인했습니다.')
    navigate(location.state?.from?.pathname || '/')
  }

  return <AuthLayout title="다시 만나서 반가워요" description="로그인하고 음악 이야기에 참여하세요.">
    <form onSubmit={submit} className="space-y-4">
      <Field label="이메일" type="email" value={email} onChange={setEmail}/>
      <Field label="비밀번호" type="password" value={password} onChange={setPassword}/>
      <Button type="submit" disabled={busy} className="w-full">{busy ? '로그인 중...' : '로그인'}</Button>
    </form>
    <p className="mt-5 text-center text-sm text-[#aeb4b5]">
      아직 회원이 아니신가요? <Link className="font-bold text-[#25e39a] hover:underline" to="/signup">회원가입</Link>
    </p>
  </AuthLayout>
}

export function SignupPage() {
  const [form, setForm] = useState({ nickname: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()
    if (!supabase) return toast('Supabase 환경 변수를 확인해주세요.', 'error')
    if (busy) return
    if (form.nickname.trim().length < 2) return toast('닉네임은 2자 이상 입력해주세요.', 'error')
    if (form.password.length < 6) return toast('비밀번호는 6자 이상 입력해주세요.', 'error')

    setBusy(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { nickname: form.nickname.trim() } },
    })
    setBusy(false)

    if (error) return toast(getSignupErrorMessage(error), 'error')
    toast('회원가입이 완료되었습니다. 이메일 인증을 확인해주세요.')
    navigate('/login')
  }

  return <AuthLayout title="음악 이야기를 시작해요" description="나만의 음악 기록을 남겨보세요.">
    <form onSubmit={submit} className="space-y-4">
      <Field label="닉네임" value={form.nickname} onChange={(value) => setForm({ ...form, nickname: value })}/>
      <Field label="이메일" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })}/>
      <Field
        label="비밀번호"
        type="password"
        value={form.password}
        onChange={(value) => setForm({ ...form, password: value })}
        hint="6자 이상 입력해주세요."
      />
      <Button type="submit" disabled={busy} className="w-full">{busy ? '가입 중...' : '회원가입'}</Button>
    </form>
    <p className="mt-5 text-center text-sm text-[#aeb4b5]">
      이미 계정이 있나요? <Link className="font-bold text-[#25e39a] hover:underline" to="/login">로그인</Link>
    </p>
  </AuthLayout>
}

function Field({ label, hint, value, onChange, type = 'text' }) {
  return <label className="block text-sm font-semibold">
    {label}
    <Input
      required
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2"
      autoComplete={type === 'password' ? 'current-password' : undefined}
    />
    {hint && <span className="mt-1 block text-xs font-normal text-[#8e9798]">{hint}</span>}
  </label>
}

function AuthLayout({ title, description, children }) {
  return <main className="page-shell flex min-h-[calc(100dvh-8rem)] items-center justify-center py-10">
    <section className="w-full max-w-md rounded-3xl border border-[#363e40] bg-[#1b1f20] p-6 shadow-2xl shadow-black/20 sm:p-8">
      <p className="font-bold text-[#a778ff]">soponion</p>
      <h1 className="mt-2 text-2xl font-extrabold">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-[#aeb4b5]">{description}</p>
      <div className="mt-7">{children}</div>
    </section>
  </main>
}
