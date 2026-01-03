import { create } from 'zustand'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { Admin } from '@/types'

interface AuthStore {
  user: User | null
  admin: Admin | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  initialize: () => () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  admin: null,
  loading: true,
  error: null,

  signIn: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Check if user is an admin
      const adminDoc = await getDoc(doc(db, 'admins', user.uid))
      if (!adminDoc.exists()) {
        await firebaseSignOut(auth)
        set({ error: '管理者権限がありません', loading: false })
        return false
      }

      const adminData = adminDoc.data() as Omit<Admin, 'id'>
      set({
        user,
        admin: { id: user.uid, ...adminData },
        loading: false,
        error: null,
      })
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ログインに失敗しました'
      set({ error: errorMessage, loading: false })
      return false
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      await firebaseSignOut(auth)
      set({ user: null, admin: null, loading: false, error: null })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ログアウトに失敗しました'
      set({ error: errorMessage, loading: false })
    }
  },

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid))
          if (adminDoc.exists()) {
            const adminData = adminDoc.data() as Omit<Admin, 'id'>
            set({
              user,
              admin: { id: user.uid, ...adminData },
              loading: false,
            })
          } else {
            set({ user: null, admin: null, loading: false })
          }
        } catch {
          set({ user: null, admin: null, loading: false })
        }
      } else {
        set({ user: null, admin: null, loading: false })
      }
    })
    return unsubscribe
  },
}))
