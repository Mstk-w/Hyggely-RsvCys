import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useReservationStore } from '@/stores/reservationStore'
import { formatPrice } from '@/lib/utils'
import { Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react'
import type { Product, CartItem } from '@/types'

export default function ProductSelection() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const { items, addItem, removeItem, updateItemQuantity, getTotalAmount, getTotalItems, nextStep } = useReservationStore()

  // Fetch products from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'products'),
      where('isAvailable', '==', true),
      orderBy('sortOrder')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Product[]
      setProducts(productList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const getItemQuantity = (productId: string) => {
    const item = items.find((i) => i.productId === productId)
    return item?.quantity || 0
  }

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return

    const currentQty = getItemQuantity(product.id)
    if (currentQty >= product.stock) return

    const cartItem: CartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
    }
    addItem(cartItem)
  }

  const handleQuantityChange = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    const currentQty = getItemQuantity(productId)
    const newQty = currentQty + delta

    if (newQty <= 0) {
      removeItem(productId)
    } else if (newQty <= product.stock) {
      updateItemQuantity(productId, newQty)
    }
  }

  const handleNext = () => {
    if (getTotalItems() === 0) return
    nextStep()
    navigate('/datetime')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-secondary-900">商品を選択してください</h2>
        <p className="text-secondary-600 mt-1">ご予約したい商品と数量をお選びください</p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => {
          const quantity = getItemQuantity(product.id)
          const isOutOfStock = product.stock <= 0
          const isMaxStock = quantity >= product.stock

          return (
            <div
              key={product.id}
              className={`card ${isOutOfStock ? 'opacity-60' : ''}`}
            >
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="w-24 h-24 bg-secondary-100 rounded-lg overflow-hidden flex-shrink-0">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-secondary-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-secondary-900">{product.name}</h3>
                  <p className="text-sm text-secondary-600 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-primary-700">
                      {formatPrice(product.price)}
                    </span>
                    <span className={`text-sm ${isOutOfStock ? 'text-red-600' : 'text-secondary-500'}`}>
                      {isOutOfStock ? '在庫切れ' : `残り ${product.stock} 個`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="mt-4 flex items-center justify-end gap-2">
                {quantity > 0 ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(product.id, -1)}
                      className="w-8 h-8 rounded-full bg-secondary-100 hover:bg-secondary-200 flex items-center justify-center transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(product.id, 1)}
                      disabled={isMaxStock}
                      className="w-8 h-8 rounded-full bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock}
                    className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
                  >
                    <Plus className="h-4 w-4" />
                    カートに追加
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-secondary-600">
          現在販売中の商品はありません
        </div>
      )}

      {/* Cart Summary */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-secondary-200 shadow-lg p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-primary-600" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                  {getTotalItems()}
                </span>
              </div>
              <div>
                <p className="text-sm text-secondary-600">合計</p>
                <p className="font-bold text-lg">{formatPrice(getTotalAmount())}</p>
              </div>
            </div>
            <button
              onClick={handleNext}
              className="btn-primary flex items-center gap-2"
            >
              受取日時を選択
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Spacer for fixed cart */}
      {getTotalItems() > 0 && <div className="h-24" />}
    </div>
  )
}
