// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { AppUser } from '../types';

export const useAuth = () => {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setAppUser({ 
            uid: user.uid, 
            role: snap.data().role,
            // 1. users 컬렉션에서 email 필드가 있으면 우선 사용
            email: snap.data().email || user.email || undefined
          });
        } else {
          await signOut(auth);
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }
      setLoadingAuth(false);
    });
    return unsub;
  }, []);
  

  const handleLogin = async (email: string, pw: string) => {
    try {
      setLoginError("");
      await signInWithEmailAndPassword(auth, email, pw);
    } catch {
      setLoginError("로그인에 실패했습니다");
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return { appUser, loadingAuth, loginError, handleLogin, handleLogout };
};
