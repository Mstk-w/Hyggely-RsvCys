import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AlertTriangle, Package } from 'lucide-react'
import type { Product } from '@/types'

const LOW_STOCK_THRESHOLD = 5

export default function StockAlerts() {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'products'),
      where('isAvailable', '==', true),
      where('stock', '<=', LOW_STOCK_THRESHOLD),
      orderBy('stock')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Product[]
      setLowStockProducts(products)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-secondary-900 mb-4">在庫アラート</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-secondary-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-medium text-secondary-900">在庫アラート</h3>
      </div>

      {lowStockProducts.length === 0 ? (
        <div className="text-center py-8 text-secondary-500">
          <Package className="h-12 w-12 mx-auto mb-2 text-secondary-300" />
          在庫が少ない商品はありません
        </div>
      ) : (
        <div className="space-y-3">
          {lowStockProducts.map((product) => (
            <div
              key={product.id}
              className={`flex items-center gap-4 p-3 rounded-lg ${
                product.stock === 0
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              {/* Product Image */}
              <div className="w-12 h-12 bg-secondary-100 rounded-lg overflow-hidden flex-shrink-0">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-secondary-400">
                    <Package className="h-6 w-6" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-secondary-900 truncate">{product.name}</p>
                <p
                  className={`text-sm ${
                    product.stock === 0 ? 'text-red-600' : 'text-yellow-700'
                  }`}
                >
                  {product.stock === 0 ? '在庫切れ' : `残り ${product.stock} 個`}
                </p>
              </div>

              {/* Status Badge */}
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  product.stock === 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {product.stock === 0 ? '要補充' : '少量'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
