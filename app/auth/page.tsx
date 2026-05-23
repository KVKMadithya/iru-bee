"use client";

import React, { useState, useEffect } from "react";
import { auth, googleProvider, db } from "@/lib/firebase";
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, AlertCircle, Sparkles } from "lucide-react";

export default function AuthenticationHub() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Smooth mouse coordinate state for the tracking bee companion
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Sync user profile data to Firestore when they onboard
  const syncUserProfile = async (user: any, customName?: string) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: customName || user.displayName || "Anonymous Author",
        email: user.email,
        profilePic: user.photoURL || "",
        bio: "An artistic soul on Iru-bee.",
        joinedAt: new Date().toISOString(),
      });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) throw new Error("Please enter a professional pen name.");
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: username });
        await syncUserProfile(credential.user, username);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message?.replace("Firebase:", "").trim() || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSync = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(result.user);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Google Identity Sync failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#24211e] relative overflow-hidden flex items-center justify-center p-6 selection:bg-[#ebdcb9]/10 selection:text-[#ebdcb9]">
      
      {/* 🐝 PROFESSIONAL CURSOR COMPANION */}
      <div 
        className="bee-companion hidden md:flex items-center justify-center pointer-events-none fixed z-50 text-xl"
        style={{
          transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`,
          left: "12px",
          top: "12px"
        }}
      >
        🐝
      </div>

      {/* BACKGROUND ORGANIC OVERLAY */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200')] bg-cover bg-center" />

      {/* THE INNER FRAME */}
      <div className="w-full max-w-md bg-[#2b2723] border border-[#3d3731] rounded-[2.5rem] p-8 md:p-10 space-y-8 shadow-2xl relative z-10 transition-all">
        
        {/* UPPER IDENTITY LAYER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-[#ebdcb9]/5 border border-[#3d3731] px-3 py-1 rounded-full text-[10px] tracking-[0.2em] uppercase text-[#c4b28d]">
            <Sparkles className="h-3 w-3 text-amber-400" />
            Sanctuary Portal
          </div>
          <h1 className="text-4xl font-serif font-medium tracking-widest text-[#ebdcb9] pt-2">Iru-bee</h1>
          <p className="text-xs font-sans text-[#c4b28d]/60 max-w-xs mx-auto leading-relaxed">
            {isSignUp 
              ? "Establish your structural identity to catalog original literary works." 
              : "Access the curated archives to review manuscripts and standalone verses."}
          </p>
        </div>

        {/* METRIC ERROR FEEDBACK */}
        {error && (
          <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-200/90 leading-relaxed">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* INTERACTIVE FORM FIELD STACK */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-sans uppercase tracking-[0.15em] text-[#c4b28d]/70 ml-1 block">Pen Name / Author Title</label>
              <div className="relative flex items-center">
                <User className="absolute left-4 h-4 w-4 text-[#c4b28d]/30" />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., Adrian Thorne"
                  className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl pl-11 pr-4 py-3.5 text-sm font-sans text-[#ebdcb9] outline-none transition-all focus:border-[#c4b28d]/40 placeholder:text-white/5"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-sans uppercase tracking-[0.15em] text-[#c4b28d]/70 ml-1 block">Email Coordinate</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 h-4 w-4 text-[#c4b28d]/30" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="author@irubee.com"
                className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl pl-11 pr-4 py-3.5 text-sm font-sans text-[#ebdcb9] outline-none transition-all focus:border-[#c4b28d]/40 placeholder:text-white/5"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-sans uppercase tracking-[0.15em] text-[#c4b28d]/70 ml-1 block">Cipher Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 h-4 w-4 text-[#c4b28d]/30" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl pl-11 pr-4 py-3.5 text-sm font-sans text-[#ebdcb9] outline-none transition-all focus:border-[#c4b28d]/40 placeholder:text-white/5"
              />
            </div>
          </div>

          {/* MAIN SUBMIT COMPONENT */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#ebdcb9] hover:bg-white text-[#24211e] font-sans font-medium text-[11px] tracking-[0.2em] uppercase py-4 rounded-xl transition-all shadow-lg active:scale-[0.99] cursor-pointer disabled:opacity-40"
          >
            {loading ? "Synchronizing..." : isSignUp ? "Establish Account" : "Verify & Enter"}
          </button>
        </form>

        {/* LUXURY SECTION SEPARATOR */}
        <div className="relative flex items-center justify-center py-2">
          <div className="absolute w-full border-t border-[#3d3731]" />
          <span className="relative bg-[#2b2723] px-4 text-[9px] font-sans text-[#c4b28d]/40 uppercase tracking-[0.25em]">Direct Access Integration</span>
        </div>

        {/* NATIVE GOOGLE ACCESS ROUTE */}
        <button 
          type="button"
          disabled={loading}
          onClick={handleGoogleSync}
          className="w-full bg-[#1e1b19] hover:bg-[#221f1c] text-[#ebdcb9] border border-[#3d3731] font-sans font-medium text-[11px] tracking-[0.15em] uppercase py-4 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:border-[#c4b28d]/30 disabled:opacity-40"
        >
          <svg className="h-4 w-4 fill-current text-amber-100/80" viewBox="0 0 24 24">
            <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.71 0 3.28.61 4.5 1.64l2.39-2.39C17.11 1.43 14.81 0 12.24 0 5.58 0 0 5.58 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.79-.08-1.4-.23-1.925H12.24z"/>
          </svg>
          Google Identity Sync
        </button>

        {/* BOTTOM TOGGLE TRIGGERS */}
        <div className="text-center pt-2">
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-xs font-sans text-[#c4b28d]/50 hover:text-[#ebdcb9] underline decoration-[#c4b28d]/20 underline-offset-4 transition-all cursor-pointer"
          >
            {isSignUp 
              ? "Possess an existing author signature? Log in" 
              : "New to the curated collection? Create profile"}
          </button>
        </div>

      </div>
    </div>
  );
}