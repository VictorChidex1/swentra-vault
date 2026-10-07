import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  sendEmailVerification,
  applyActionCode,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  confirmPasswordReset: (oobCode: string, newPassword: string) => Promise<void>
  verifyEmail: () => Promise<void>
  applyVerificationCode: (oobCode: string) => Promise<void>
  reauthenticateAndChangePassword: (currentPass: string, newPass: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value: AuthContextValue = {
    user,
    loading,

    signIn: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password)
    },

    signUp: async (email, password) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await sendEmailVerification(cred.user, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      })
    },

    signOut: async () => {
      await firebaseSignOut(auth)
    },

    sendPasswordReset: async (email) => {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      })
    },

    confirmPasswordReset: async (oobCode, newPassword) => {
      await confirmPasswordReset(auth, oobCode, newPassword)
    },

    verifyEmail: async () => {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser, {
          url: `${window.location.origin}/verify-email`,
          handleCodeInApp: true,
        })
      }
    },

    applyVerificationCode: async (oobCode) => {
      await applyActionCode(auth, oobCode)
      if (auth.currentUser) {
        await auth.currentUser.reload()
      }
    },

    reauthenticateAndChangePassword: async (currentPass, newPass) => {
      const currentUser = auth.currentUser
      if (!currentUser?.email) throw new Error('No active user or email')
      const cred = EmailAuthProvider.credential(currentUser.email, currentPass)
      await reauthenticateWithCredential(currentUser, cred)
      await updatePassword(currentUser, newPass)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}