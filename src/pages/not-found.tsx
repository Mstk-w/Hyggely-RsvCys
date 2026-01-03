import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-200">404</h1>
        <h2 className="text-2xl font-bold text-secondary-800 mt-4">
          ページが見つかりません
        </h2>
        <p className="text-secondary-600 mt-2 mb-8">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/" className="btn-primary flex items-center gap-2">
            <Home className="h-5 w-5" />
            トップページへ
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-outline flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            戻る
          </button>
        </div>
      </div>
    </div>
  )
}
