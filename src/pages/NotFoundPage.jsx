import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
export function NotFoundPage() { return <main className="page-shell py-24 text-center"><p className="text-sm font-bold text-red-700">404</p><h1 className="mt-2 text-3xl font-extrabold">찾으시는 페이지가 없어요.</h1><p className="mt-3 text-slate-600">주소가 올바른지 다시 확인해주세요.</p><Link className="mt-6 inline-block" to="/"><Button>홈으로 돌아가기</Button></Link></main> }
