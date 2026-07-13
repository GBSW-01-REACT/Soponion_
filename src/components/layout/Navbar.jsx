import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Moon, Music2, Settings2, Sun, UserRound } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from '../ui/Button'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const logout = async () => { await signOut(); navigate('/') }
  const linkClass = ({ isActive }) => `pod-tab-link ${isActive ? 'pod-tab-link-active' : ''}`

  return <header className="sticky top-0 z-40 border-b bg-[var(--surface)]/95 backdrop-blur-xl">
    <nav className="page-shell flex min-h-[4.75rem] items-center justify-between gap-3">
      <Link to="/" className="flex items-center gap-2 font-extrabold tracking-[-0.07em] text-[var(--text)]">
        <span className="grid size-8 place-items-center rounded-xl bg-[#7d44e5] text-white"><Music2 size={17} strokeWidth={2.5}/></span>
        <span className="text-lg">soponion</span>
      </Link>

      <div className="pod-tab absolute left-1/2 hidden -translate-x-1/2 sm:flex">
        <NavLink end className={linkClass} to="/">홈</NavLink>
        <NavLink className={linkClass} to="/songs">탐색</NavLink>
        <NavLink className={linkClass} to={user ? '/profile' : '/login'}>계정</NavLink>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button className="theme-icon-button" type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? '화이트 모드로 변경' : '블랙 모드로 변경'} aria-pressed={theme === 'dark'} title={theme === 'dark' ? '화이트 모드' : '블랙 모드'}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button>
        {user ? <>
          <Link aria-label="계정 설정" className="grid size-10 place-items-center rounded-xl text-[#d7dddc] hover:bg-[#252a2b] hover:text-white sm:hidden" to="/profile"><Settings2 size={18}/></Link>
          <Link aria-label="내 계정 설정" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold text-[#d7dddc] hover:bg-[#252a2b] hover:text-white" to="/profile"><UserRound size={17}/><span className="hidden md:inline">{profile?.nickname || '계정 설정'}</span></Link>
          <button aria-label="로그아웃" onClick={logout} className="grid size-10 place-items-center rounded-xl text-[#9aa0a1] hover:bg-[#252a2b] hover:text-white"><LogOut size={17}/></button>
        </> : <>
          <Link className="hidden sm:block" to="/login"><Button variant="ghost">로그인</Button></Link>
          <Link to="/signup"><Button>회원가입</Button></Link>
        </>}
      </div>
    </nav>
  </header>
}
