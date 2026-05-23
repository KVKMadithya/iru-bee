"use client";

import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { BookOpen, Feather, Image as ImageIcon, ArrowRight, LogOut, User, Sparkles, Volume2, VolumeX, BarChart3, Fingerprint, Compass } from "lucide-react";

const LIBRARY_SECTIONS = [
  {
    id: "novels",
    title: "Novels",
    subtitle: "Long-form narrative canvases",
    description: "Immerse yourself in multi-chapter manuscripts and full digital bounds engineered within high-contrast typographic reading frames.",
    icon: BookOpen,
    badge: "Premium Library",
    coverUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800"
  },
  {
    id: "poems",
    title: "Poems",
    subtitle: "Stanzas of raw emotion & cadence",
    description: "Discover standalone poetry pieces paired with dynamic typographic styling and adaptive mood-colored visual backdrops.",
    icon: Feather,
    badge: "Literary Verse",
    coverUrl: "https://images.unsplash.com/photo-1580136579312-94651dfd596d?q=80&w=800"
  },
  {
    id: "artworks",
    title: "Artworks",
    subtitle: "Visual narratives & design exhibits",
    description: "Explore exquisite curation spaces showcasing classical artwork backgrounds, cover interpretations, and custom exhibits.",
    icon: ImageIcon,
    badge: "Visual Gallery",
    coverUrl: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=800"
  }
];

export default function Home() {
  const router = useRouter();
  const meshRef = useRef<HTMLDivElement | null>(null);

  // Core Identity State Coordinates
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [studioProfile, setStudioProfile] = useState<{ name: string; profilePic: string } | null>(null);

  // Dynamic Platform Database Counters State
  const [platformStats, setPlatformStats] = useState({ items: 0, actions: 0, curators: 0 });

  // Luxury Background Ambient Audio Streams State
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 🛡️ DYNAMIC SYSTEM IDENTITY & INSIGHTS SYNC ENGINE
  useEffect(() => {
    const fetchPlatformMetrics = async () => {
      try {
        const publicationsSnap = await getDocs(collection(db, "publications"));
        const usersSnap = await getDocs(collection(db, "users"));
        
        let aggregateLikes = 0;
        publicationsSnap.forEach((doc) => {
          const data = doc.data();
          if (data.likes && Array.isArray(data.likes)) {
            aggregateLikes += data.likes.length;
          }
        });

        setPlatformStats({
          items: publicationsSnap.size || 0,
          actions: aggregateLikes || 0,
          curators: usersSnap.size || 0
        });
      } catch (err) {
        console.error("Metrics stream mapping failure:", err);
      }
    };

    const fetchStudioProfilePic = async (uid: string) => {
      try {
        const userDocSnap = await getDoc(doc(db, "users", uid));
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setStudioProfile({
            name: data.name || "",
            profilePic: data.profilePic || ""
          });
        }
      } catch (err) {
        console.error("Error drawing header identity matrices:", err);
      }
    };

    if (auth.currentUser) {
      setCurrentUser(auth.currentUser);
      fetchStudioProfilePic(auth.currentUser.uid);
      fetchPlatformMetrics();
      setCheckingAuth(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth");
      } else {
        setCurrentUser(user);
        await fetchStudioProfilePic(user.uid);
        await fetchPlatformMetrics();
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 🖱️ INTERACTIVE MESH COORDINATE TRACKER FOR GRADIENT GLOWS
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!meshRef.current) return;
      const { clientX, clientY } = e;
      const xPercent = (clientX / window.innerWidth) * 100;
      const yPercent = (clientY / window.innerHeight) * 100;
      meshRef.current.style.setProperty("--mouse-x", `${xPercent}%`);
      meshRef.current.style.setProperty("--mouse-y", `${yPercent}%`);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleAudioFocusToggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.15;
    }

    if (isAudioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => console.log("Audio pipeline requires explicit user interaction gesture first."));
    }
    setIsAudioPlaying(!isAudioPlaying);
  };

  const handleSignOut = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    await signOut(auth);
    router.push("/auth");
  };

  const handleNavigation = (sectionId: string) => {
    router.push(`/${sectionId}`);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0b0a09] flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
        <div className="text-4xl font-serif text-[#ebdcb9] tracking-[0.4em] animate-pulse">Iru-bee</div>
        <div className="h-px w-16 bg-[#3d3731]" />
        <span className="text-[9px] font-sans uppercase tracking-widest text-[#c4b28d]/30 font-medium">Decrypting Vault Keyframes...</span>
      </div>
    );
  }

  const activeAvatarUrl = studioProfile?.profilePic || currentUser?.photoURL || "";
  const activeDisplayName = studioProfile?.name || currentUser?.displayName || "Author Profile";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0a09] to-[#12100e] text-[#ebdcb9] flex flex-col selection:bg-[#ebdcb9]/10 selection:text-[#ebdcb9] relative overflow-x-hidden antialiased">
      
      {/* Dynamic Shifting Ambient Glow Mesh Layer */}
      <div 
        ref={meshRef}
        className="absolute inset-0 pointer-events-none opacity-20 transition-all duration-300 z-0 bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),#534333_0%,transparent_60%)]"
      />

      {/* LUXURY HEADER BAR */}
      <header className="border-b border-[#211c18] bg-[#0c0a09]/80 backdrop-blur-xl sticky top-0 z-50 px-6 sm:px-10 py-5 flex items-center justify-between transition-all">
        <div onClick={() => router.push("/")} className="flex items-center gap-3.5 cursor-pointer select-none group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#ebdcb9]/10 to-transparent flex items-center justify-center border border-[#352d27] group-hover:border-[#ebdcb9]/40 transition-all shadow-xl">
            <Fingerprint className="h-4 w-4 text-[#ebdcb9] group-hover:rotate-12 transition-transform" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl font-medium tracking-[0.2em] text-white">Iru-bee</span>
            <span className="text-[8px] font-sans font-bold tracking-widest uppercase text-[#c4b28d]/40">Studio Canvas</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Ambient Player Switch */}
          <button 
            onClick={handleAudioFocusToggle}
            className={`h-9 px-3 rounded-full border transition-all cursor-pointer flex items-center gap-2 text-xs font-sans font-medium uppercase tracking-wider ${isAudioPlaying ? "bg-[#dfb86c]/10 border-[#dfb86c]/30 text-[#dfb86c]" : "bg-white/5 border-[#211c18] text-[#c4b28d]/60 hover:text-white"}`}
          >
            {isAudioPlaying ? <Volume2 className="h-3.5 w-3.5 animate-pulse" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span className="hidden md:inline text-[9px] tracking-widest">Ambient Mode</span>
          </button>

          {/* User Workspace Profile Trigger */}
          <div 
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2.5 bg-gradient-to-r from-[#1f1b18] to-[#141210] border border-[#2d2621] rounded-full p-1 pr-4 cursor-pointer hover:border-[#ebdcb9]/40 transition-all text-xs font-sans text-[#c4b28d] shadow-md"
          >
            {activeAvatarUrl ? (
              // eslint-disable-next-html-element-img
              <img src={activeAvatarUrl} alt="Curator Avatar" className="h-6 w-6 rounded-full object-cover border border-[#40352d]" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-[#0b0a09] flex items-center justify-center border border-[#2d2621]">
                <User className="h-3 w-3 text-[#ebdcb9]" />
              </div>
            )}
            <span className="hidden sm:inline font-medium tracking-wide max-w-[120px] truncate text-[#ebdcb9]">{activeDisplayName}</span>
          </div>
          
          <button onClick={handleSignOut} className="h-9 w-9 rounded-xl bg-white/5 hover:bg-red-950/20 border border-[#211c18] hover:border-red-900/40 text-[#c4b28d] hover:text-red-400 transition-all cursor-pointer flex items-center justify-center shadow-md">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* CORE HUB LAYOUT SECTION AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-10 md:p-16 space-y-16 z-10 relative">
        
        {/* REFINED ARCHIVAL BANNER */}
        <div className="space-y-4 pt-6 max-w-3xl select-none animate-fade-in">
          <span className="text-[10px] uppercase tracking-[0.3em] font-sans text-[#dfb86c] font-bold block flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-amber-400 animate-spin" style={{ animationDuration: "6s" }} />
            Premium Literary Curation Room
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif tracking-tight text-white font-light leading-[1.1]">
            Where Writing <br /><span className="italic font-normal font-serif text-[#ebdcb9]">Becomes Canvas Art</span>
          </h1>
          <p className="text-sm sm:text-base font-sans text-[#c4b28d]/60 leading-relaxed font-light max-w-xl">
            Welcome back, <span className="text-[#dfb86c] font-medium font-serif italic">{studioProfile?.name || currentUser?.displayName || "Creator"}</span>. Select an active medium avenue below to explore independent curation indexes, annotate texts, or broadcast your own compositions.
          </p>
        </div>

        {/* INTERACTIVE ASYMMETRICAL HUB SELECTION MATRIX */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {LIBRARY_SECTIONS.map((section) => {
            const IconComponent = section.icon;
            return (
              <div 
                key={section.id}
                onClick={() => handleNavigation(section.id)}
                className="group relative bg-[#110f0e] border border-[#211c18] rounded-[2.5rem] p-6 space-y-6 transition-all duration-500 hover:border-[#dfb86c]/30 hover:bg-[#161311] shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col justify-between cursor-pointer transform hover:-translate-y-1"
              >
                <div className="space-y-5">
                  <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#070708] border border-[#1f1a16]">
                    {/* eslint-disable-next-html-element-img */}
                    <img src={section.coverUrl} alt={section.title} className="object-cover w-full h-full grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-out scale-100 group-hover:scale-103" />
                    
                    <div className="absolute top-4 left-4">
                      <span className="bg-black/80 backdrop-blur-md border border-[#211c18] text-[8px] font-sans font-bold tracking-widest uppercase px-3 py-1.5 rounded-full text-[#ebdcb9]">
                        {section.badge}
                      </span>
                    </div>

                    <div className="absolute bottom-4 right-4 bg-[#ebdcb9] h-10 w-10 rounded-xl flex items-center justify-center text-[#0b0a09] transition-all duration-500 group-hover:bg-white shadow-xl transform group-hover:rotate-45">
                      <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                    </div>
                  </div>

                  <div className="space-y-1.5 px-1">
                    <h2 className="font-serif text-3xl text-white font-light tracking-wide group-hover:text-[#dfb86c] transition-colors">{section.title}</h2>
                    <p className="text-[11px] font-sans text-[#dfb86c]/60 italic tracking-wider font-light">{section.subtitle}</p>
                    <p className="text-xs font-sans text-[#c4b28d]/40 leading-relaxed pt-2 font-light line-clamp-3">{section.description}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1f1a16] px-1 flex items-center justify-between text-[#c4b28d]/30 group-hover:text-[#c4b28d]/60 transition-colors">
                  <span className="text-[9px] font-sans tracking-[0.2em] uppercase font-bold">Access Registry</span>
                  <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center border border-[#211c18] group-hover:border-[#dfb86c]/20">
                    <IconComponent className="h-3.5 w-3.5 text-[#c4b28d]/70" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* PRODUCTION DATABASES ANALYTICS MATRIX SUMMARY ROW */}
        <section className="bg-[#0e0c0b] border border-[#211a14] rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row gap-8 items-center justify-around select-none">
          <div className="absolute inset-0 bg-radial-gradient(circle_at_bottom_right,#ebdcb9/2,transparent_70%) pointer-events-none" />
          
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-[#211c18] shadow-inner shrink-0 mx-auto">
              <Compass className="h-5 w-5 text-[#dfb86c]" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-light text-white tracking-wide">{platformStats.items}</span>
              <span className="text-[9px] font-sans uppercase tracking-widest text-[#c4b28d]/40 font-bold">Total Vault Manifests</span>
            </div>
          </div>

          <div className="h-px w-full sm:h-10 sm:w-px bg-[#1f1a16]" />

          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-[#211c18] shadow-inner shrink-0 mx-auto">
              <Sparkles className="h-5 w-5 text-[#dfb86c]" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-light text-white tracking-wide">{platformStats.actions}</span>
              <span className="text-[9px] font-sans uppercase tracking-widest text-[#c4b28d]/40 font-bold">Total Accumulative Reactions</span>
            </div>
          </div>

          <div className="h-px w-full sm:h-10 sm:w-px bg-[#1f1a16]" />

          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-[#211c18] shadow-inner shrink-0 mx-auto">
              <BarChart3 className="h-5 w-5 text-[#dfb86c]" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-light text-white tracking-wide">{platformStats.curators}</span>
              <span className="text-[9px] font-sans uppercase tracking-widest text-[#c4b28d]/40 font-bold">Registered Core Curators</span>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-[#141210] py-8 px-6 text-center text-xs font-sans text-[#c4b28d]/20 bg-[#050404] z-10 relative select-none tracking-widest">
        &copy; 2026 Iru-bee. Master Curation Workspace. All rights reserved.
      </footer>
    </div>
  );
}