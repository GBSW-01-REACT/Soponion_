import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Music2, Plus, UserRound } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const logout = async () => { await signOut(); navigate('/') }
  const linkClass = ({ isActive }) => `pod-tab-link ${isActive ? 'pod-tab-link-active' : ''}`

  return <header className="sticky top-0 z-40 border-b border-[#232829] bg-[#111516]/95 backdrop-blur-xl">
    <nav className="page-shell flex min-h-[4.75rem] items-center justify-between gap-3">
      <Link to="/" className="flex items-center gap-2 font-extrabold tracking-[-0.07em] text-white">
        <span className="grid size-8 place-items-center rounded-xl bg-[#7d44e5] text-white"><Music2 size={17} strokeWidth={2.5}/></span>
        <span className="text-lg">soponion</span>
      </Link>

      <div className="pod-tab absolute left-1/2 hidden -translate-x-1/2 sm:flex">
        <NavLink end className={linkClass} to="/">홈</NavLink>
        <NavLink className={linkClass} to="/songs">탐색</NavLink>
        {user && <NavLink className={linkClass} to="/songs/new">등록</NavLink>}
      </div>

      <div className="ml-auto flex items-center gap-1">
        {user ? <>
          <Link aria-label="음악 등록" className="grid size-10 place-items-center rounded-xl text-[#d7dddc] hover:bg-[#252a2b] hover:text-white sm:hidden" to="/songs/new"><Plus size={18}/></Link>
          <Link aria-label="내 프로필" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold text-[#d7dddc] hover:bg-[#252a2b] hover:text-white" to="/profile"><UserRound size={17}/><span className="hidden md:inline">{profile?.nickname || '프로필'}</span></Link>
          <button aria-label="로그아웃" onClick={logout} className="grid size-10 place-items-center rounded-xl text-[#9aa0a1] hover:bg-[#252a2b] hover:text-white"><LogOut size={17}/></button>
        </> : <>
          <Link className="hidden sm:block" to="/login"><Button variant="ghost">로그인</Button></Link>
          <Link to="/signup"><Button>회원가입</Button></Link>
        </>}
      </div>
    </nav>
  </header>
}
