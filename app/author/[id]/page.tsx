"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Feather, Image as ImageIcon, Star, Heart, FileText, User } from "lucide-react";

export default function AuthorShowcaseWorkspace() {
  const router = useRouter();
  const params = useParams();
  const authorId = params?.id as string;

  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authorId) {
      fetchAuthorDataMatrix();
    }
  }, [authorId]);

  const fetchAuthorDataMatrix = async () => {
    try {
      setLoading(true);
      
      // 1. Extract baseline registration profile traits from users collective index
      const userDocSnap = await getDoc(doc(db, "users", authorId));
      if (userDocSnap.exists()) {
        setAuthorProfile(userDocSnap.data());
      }

      // 2. Query all items tagged with this specific author identifier across database files
      const q = query(
        collection(db, "publications"),
        where("author_id", "==", authorId)
      );
      
      const querySnapshot = await getDocs(q);
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, likes: [], ...doc.data() });
      });

      // Sort items locally by creation date safely
      items.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      
      setPublications(items);
    } catch (err) {
      console.error("Error drawing target signature records directory package:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#24211e] flex flex-col items-center justify-center">
        <div className="text-xl font-serif text-[#ebdcb9] tracking-widest animate-pulse">Assembling Curator's Portfolio...</div>
      </div>
    );
  }

  // Pick up display parameters fallback fields cleanly
  const displayName = authorProfile?.name || (publications.length > 0 ? publications[0].author_name : "Independent Creator");
  const avatarUrl = authorProfile?.profilePic || "";
  const bioExcerpt = authorProfile?.bio || "This creator hasn't documented an archival autobiographical statement text index yet.";

  return (
    <div className="min-h-screen bg-[#24211e] text-[#ebdcb9] flex flex-col selection:bg-[#ebdcb9]/10 selection:text-[#ebdcb9]">
      
      {/* HEADER BLOCK CONTROLS */}
      <header className="border-b border-[#3d3731] bg-[#2b2723]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-xs font-sans text-[#c4b28d] hover:text-[#ebdcb9] transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
        <span className="font-serif text-xs tracking-[0.25em] text-white/40 uppercase">Curator Profile View</span>
        <div className="w-16 hidden sm:block" />
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 space-y-12 animate-fade-in">
        
        {/* UPPER IDENTITY BANNER CARD */}
        <div className="bg-[#2b2723] border border-[#3d3731] rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl">
          <div className="h-24 w-24 rounded-full bg-[#1e1b19] border-2 border-[#3d3731] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            {avatarUrl ? (
              // eslint-disable-next-html-element-img
              <img src={avatarUrl} alt="Author Portrait Avatar" className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-[#c4b28d]/30" />
            )}
          </div>
          
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-serif tracking-wide text-white">{displayName}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 text-xs text-[#c4b28d]/60 font-sans">
              <span className="bg-[#ebdcb9]/5 border border-[#3d3731] px-3 py-1 rounded-full">{publications.length} Contributions</span>
              <span className="bg-[#ebdcb9]/5 border border-[#3d3731] px-3 py-1 rounded-full uppercase tracking-wider text-amber-400/70 text-[10px]">Verified Core Signature</span>
            </div>
            <p className="text-sm font-sans text-[#c4b28d]/70 max-w-2xl leading-relaxed pt-1">{bioExcerpt}</p>
          </div>
        </div>

        {/* REPOSITORY GRID SEGMENTS */}
        <div className="space-y-6">
          <h3 className="font-serif text-xl tracking-wide text-white border-b border-[#3d3731] pb-3">Exhibited Collection Shells</h3>
          
          {publications.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[#3d3731] rounded-[2rem] space-y-2">
              <FileText className="h-8 w-8 text-[#c4b28d]/20 mx-auto" />
              <p className="text-sm font-sans text-[#c4b28d]/40">This workspace hasn't dropped any data channels yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {publications.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => router.push(`/${item.type === "art" ? "artworks" : `${item.type}s`}`)}
                  className="group bg-[#2b2723] border border-[#3d3731] rounded-2xl overflow-hidden shadow-md flex flex-col p-4 space-y-4 cursor-pointer hover:border-[#ebdcb9]/30 transition-all duration-300"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1e1b19] border border-[#3d3731]">
                    {/* eslint-disable-next-html-element-img */}
                    <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    <span className="absolute top-2.5 right-2.5 bg-black/70 border border-white/10 text-[8px] tracking-widest uppercase font-sans px-2 py-0.5 rounded-full text-white/80">
                      {item.type}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-serif text-base text-white truncate tracking-wide">{item.title}</h4>
                      <div className="flex items-center gap-1 shrink-0 text-amber-400">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-[10px] font-sans text-[#ebdcb9]">{item.average_rating || "5.0"}</span>
                      </div>
                    </div>
                    <p className="text-[11px] font-sans text-[#c4b28d]/50 truncate capitalize">{item.category || item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#3d3731] py-6 text-center text-xs font-sans text-[#c4b28d]/20">
        &copy; 2026 Iru-bee. Structural Profile Showcase Node.
      </footer>
    </div>
  );
}