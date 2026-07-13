import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
export function ProtectedRoute({ children }) { const { user, loading } = useAuth(); const location = useLocation(); if (loading) return <div className="page-shell py-20 text-center text-slate-500">로그인 정보를 확인하고 있습니다.</div>; return user ? children : <Navigate to="/login" replace state={{ from: location }} /> }
