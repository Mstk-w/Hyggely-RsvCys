import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import AdminLayout from '@/components/admin/AdminLayout'
import { db, storage } from '@/lib/firebase'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { formatPrice, cn } from '@/lib/utils'
import type { Product } from '@/types'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Package,
  AlertTriangle,
  Check,
  ImageIcon,
  Loader2,
} from 'lucide-react'

interface ProductFormData {
  name: string
  description: string
  price: number
  stock: number
  category: string
  isAvailable: boolean
  sortOrder: number
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  category: 'bread',
  isAvailable: true,
  sortOrder: 0,
}

export default function AdminProductsPage() {
  const navigate = useNavigate()
  const { admin, loading, initialize } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Form states
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsubscribe = initialize()
    return () => unsubscribe()
  }, [initialize])

  useEffect(() => {
    if (!loading && !admin) {
      navigate('/admin/login')
    }
  }, [admin, loading, navigate])

  // Fetch products
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('sortOrder'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Product[]
      setProducts(productList)
      setProductsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `products/${Date.now()}_${file.name}`
    const storageRef = ref(storage, fileName)
    await uploadBytes(storageRef, file)
    return getDownloadURL(storageRef)
  }

  const handleOpenAddModal = () => {
    setFormData(initialFormData)
    setImageFile(null)
    setImagePreview(null)
    setError(null)
    setIsAddModalOpen(true)
  }

  const handleOpenEditModal = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      isAvailable: product.isAvailable,
      sortOrder: product.sortOrder,
    })
    setImagePreview(product.imageUrl || null)
    setImageFile(null)
    setError(null)
    setIsEditModalOpen(true)
  }

  const handleOpenDeleteModal = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteModalOpen(true)
  }

  const handleCloseModals = () => {
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    setIsDeleteModalOpen(false)
    setSelectedProduct(null)
    setFormData(initialFormData)
    setImageFile(null)
    setImagePreview(null)
    setError(null)
  }

  const handleAddProduct = async () => {
    if (!formData.name.trim()) {
      setError('商品名を入力してください')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      let imageUrl = ''
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      await addDoc(collection(db, 'products'), {
        ...formData,
        imageUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      handleCloseModals()
    } catch (err) {
      console.error('Error adding product:', err)
      setError('商品の追加に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditProduct = async () => {
    if (!selectedProduct) return
    if (!formData.name.trim()) {
      setError('商品名を入力してください')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      let imageUrl = selectedProduct.imageUrl

      if (imageFile) {
        // Delete old image if exists
        if (selectedProduct.imageUrl) {
          try {
            const oldImageRef = ref(storage, selectedProduct.imageUrl)
            await deleteObject(oldImageRef)
          } catch {
            // Ignore if old image doesn't exist
          }
        }
        imageUrl = await uploadImage(imageFile)
      }

      await updateDoc(doc(db, 'products', selectedProduct.id), {
        ...formData,
        imageUrl,
        updatedAt: new Date(),
      })

      handleCloseModals()
    } catch (err) {
      console.error('Error updating product:', err)
      setError('商品の更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Delete image from storage if exists
      if (selectedProduct.imageUrl) {
        try {
          const imageRef = ref(storage, selectedProduct.imageUrl)
          await deleteObject(imageRef)
        } catch {
          // Ignore if image doesn't exist
        }
      }

      await deleteDoc(doc(db, 'products', selectedProduct.id))
      handleCloseModals()
    } catch (err) {
      console.error('Error deleting product:', err)
      setError('商品の削除に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleAvailability = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), {
        isAvailable: !product.isAvailable,
        updatedAt: new Date(),
      })
    } catch (err) {
      console.error('Error toggling availability:', err)
    }
  }

  const handleStockUpdate = async (product: Product, newStock: number) => {
    if (newStock < 0) return
    try {
      await updateDoc(doc(db, 'products', product.id), {
        stock: newStock,
        updatedAt: new Date(),
      })
    } catch (err) {
      console.error('Error updating stock:', err)
    }
  }

  if (loading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">商品・在庫管理</h1>
            <p className="text-secondary-600 mt-1">
              商品の追加・編集・在庫管理ができます
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus className="h-5 w-5" />
            商品を追加
          </button>
        </div>

        {/* Products Table */}
        <div className="card overflow-hidden p-0">
          {productsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-secondary-500">
              <Package className="h-12 w-12 mb-4" />
              <p>商品がまだ登録されていません</p>
              <button
                onClick={handleOpenAddModal}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                最初の商品を追加する
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50 border-b border-secondary-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-700">
                      商品
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-700">
                      カテゴリ
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-secondary-700">
                      価格
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-secondary-700">
                      在庫
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-secondary-700">
                      販売状態
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-secondary-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-secondary-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-lg bg-secondary-100 overflow-hidden flex-shrink-0">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-secondary-400">
                                <ImageIcon className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-secondary-900">
                              {product.name}
                            </p>
                            <p className="text-sm text-secondary-500 line-clamp-1">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">
                          {product.category === 'bread' ? 'パン' : product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-secondary-900">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              handleStockUpdate(product, product.stock - 1)
                            }
                            disabled={product.stock <= 0}
                            className="w-8 h-8 rounded-full bg-secondary-100 hover:bg-secondary-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                          >
                            -
                          </button>
                          <span
                            className={cn(
                              'w-12 text-center font-medium',
                              product.stock <= 5
                                ? 'text-red-600'
                                : 'text-secondary-900'
                            )}
                          >
                            {product.stock}
                          </span>
                          <button
                            onClick={() =>
                              handleStockUpdate(product, product.stock + 1)
                            }
                            className="w-8 h-8 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-700 flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleAvailability(product)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                            product.isAvailable
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-secondary-100 text-secondary-500 hover:bg-secondary-200'
                          )}
                        >
                          {product.isAvailable ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              販売中
                            </>
                          ) : (
                            '停止中'
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-2 rounded-lg text-secondary-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="編集"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(product)}
                            className="p-2 rounded-lg text-secondary-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="削除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseModals}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-secondary-900">
                {isAddModalOpen ? '商品を追加' : '商品を編集'}
              </h2>
              <button
                onClick={handleCloseModals}
                className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  商品画像
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl cursor-pointer transition-colors',
                    'hover:border-primary-400 hover:bg-primary-50/50',
                    imagePreview
                      ? 'border-primary-300 bg-primary-50/30'
                      : 'border-secondary-300'
                  )}
                >
                  {imagePreview ? (
                    <div className="relative aspect-video">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                        <span className="text-white font-medium">
                          クリックして変更
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-secondary-500">
                      <Upload className="h-10 w-10 mb-3" />
                      <p className="font-medium">画像をアップロード</p>
                      <p className="text-sm mt-1">クリックして選択</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-secondary-700 mb-2"
                >
                  商品名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="例: プレミアムカンパーニュ"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-secondary-700 mb-2"
                >
                  説明
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input-field resize-none"
                  rows={3}
                  placeholder="商品の説明を入力してください"
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-secondary-700 mb-2"
                  >
                    価格（円）
                  </label>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label
                    htmlFor="stock"
                    className="block text-sm font-medium text-secondary-700 mb-2"
                  >
                    在庫数
                  </label>
                  <input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input-field"
                  />
                </div>
              </div>

              {/* Category & Sort Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-secondary-700 mb-2"
                  >
                    カテゴリ
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="bread">パン</option>
                    <option value="pastry">ペストリー</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="sortOrder"
                    className="block text-sm font-medium text-secondary-700 mb-2"
                  >
                    表示順
                  </label>
                  <input
                    id="sortOrder"
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sortOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input-field"
                  />
                </div>
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      isAvailable: !formData.isAvailable,
                    })
                  }
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-colors',
                    formData.isAvailable ? 'bg-primary-600' : 'bg-secondary-300'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
                      formData.isAvailable ? 'left-7' : 'left-1'
                    )}
                  />
                </button>
                <span className="text-sm font-medium text-secondary-700">
                  {formData.isAvailable ? '販売中' : '販売停止'}
                </span>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-secondary-200 px-6 py-4 flex gap-3">
              <button
                onClick={handleCloseModals}
                className="btn-outline flex-1"
                disabled={isSubmitting}
              >
                キャンセル
              </button>
              <button
                onClick={isAddModalOpen ? handleAddProduct : handleEditProduct}
                disabled={isSubmitting}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    {isAddModalOpen ? '追加する' : '保存する'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseModals}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-secondary-900">
                  商品を削除しますか？
                </h2>
                <p className="text-secondary-600 text-sm mt-1">
                  「{selectedProduct.name}」を削除します。この操作は取り消せません。
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCloseModals}
                className="btn-outline flex-1"
                disabled={isSubmitting}
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    削除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    削除する
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
