"use client";

import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, orderBy, addDoc, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Feather, X, Heart, Upload, Plus, Sparkles, Send, Compass, Search, SlidersHorizontal, AlignLeft, AlignCenter, AlignRight, ChevronRight } from "lucide-react";

const POEM_CATEGORIES = ["Melancholy", "Romance", "Nature", "Philosophical", "Whimsical", "Classical Verse"];

// 🌌 PREMIUM LUXURY AMBIENT VISUAL STATE DICTIONARY MAP
const AMBIENT_MOOD_MAP: Record<string, string> = {
  "melancholy": "from-[#111625] via-[#16121e] to-[#0c0c0e]",
  "romance": "from-[#251119] via-[#1a0e1b] to-[#0c0c0e]",
  "nature": "from-[#0f1f15] via-[#121a14] to-[#0c0c0e]",
  "philosophical": "from-[#1a1125] via-[#111b24] to-[#0c0c0e]",
  "whimsical": "from-[#221f12] via-[#1b151c] to-[#0c0c0e]",
  "classical verse": "from-[#1c1813] via-[#141210] to-[#0c0c0e]"
};

export default function PoemsLibrary() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [poems, setPoems] = useState<any[]>([]);
  const [filteredPoems, setFilteredPoems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search Engine Filter State Coordinates
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("all");

  // Premium Immersive Typographic Flow States
  const [poemAlignment, setPoemAlignment] = useState<"left" | "center" | "right">("center");

  // Modular Multi-Stage Screen Controls
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedPoem, setSelectedPoem] = useState<any>(null);
  const [activeReadingPoem, setActiveReadingPoem] = useState<any>(null);

  // Publication Form Data State
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [poemContent, setPoemContent] = useState("");
  const [category, setCategory] = useState("Classical Verse");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Social Engagement / Comment Form Data State
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userRating, setUserRating] = useState(5);

  const libraryGridRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (auth.currentUser) setCurrentUser(auth.currentUser);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUser(user);
    });
    fetchPoems();
    return () => unsubscribe();
  }, []);

  // LIVE OMNI-SEARCH ENGINE MATRIX EXTRACTOR
  useEffect(() => {
    let output = poems;

    if (searchQuery.trim() !== "") {
      const criteria = searchQuery.toLowerCase();
      output = output.filter(p => 
        p.title?.toLowerCase().includes(criteria) || 
        p.summary?.toLowerCase().includes(criteria) ||
        p.author_name?.toLowerCase().includes(criteria)
      );
    }

    if (selectedFilterCategory !== "all") {
      output = output.filter(p => p.category?.toLowerCase() === selectedFilterCategory.toLowerCase());
    }

    setFilteredPoems(output);
  }, [searchQuery, selectedFilterCategory, poems]);

  const fetchPoems = async () => {
    try {
      const q = query(collection(db, "publications"), where("type", "==", "poem"), orderBy("created_at", "desc"));
      const querySnapshot = await getDocs(q);
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, likes: [], category: "Classical Verse", ...doc.data() });
      });
      setPoems(items);
      setFilteredPoems(items);
    } catch (err) {
      console.error("Error archiving verse metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (poemId: string) => {
    try {
      const commentsSnapshot = await getDocs(query(collection(db, `publications/${poemId}/reviews`), orderBy("created_at", "desc")));
      const items: any[] = [];
      commentsSnapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setComments(items);
    } catch (err) {
      console.error("Error reading community reviews:", err);
    }
  };

  const handlePoemSelection = (poem: any) => {
    setSelectedPoem(poem);
    fetchComments(poem.id);
  };

  const scrollToLibrary = () => {
    libraryGridRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "irubee_preset");
    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dovq341qc"}/upload`, { method: "POST", body: formData });
    if (!response.ok) throw new Error("Cloud media transmission pipeline failed.");
    const data = await response.json();
    return data.secure_url;
  };

  const handlePublishPoem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("Please establish a signature session before broadcasting a composition.");
    if (!selectedFile) return alert("An authentic visual display cover graphic is required.");
    if (poemContent.length > 5000) return alert("Composition metrics breach maximum safety volume parameters (5,000 chars).");
    setPublishing(true);

    try {
      const coverUrl = await uploadToCloudinary(selectedFile);
      const payload = {
        author_id: currentUser.uid,
        author_name: currentUser.displayName || "Anonymous Author",
        title,
        summary: summary || "A pristine standalone verse setup.",
        poem_content: poemContent,
        category,
        cover_image_url: coverUrl,
        type: "poem",
        created_at: new Date().toISOString(),
        likes: [],
        average_rating: 5.0,
        total_reviews: 0
      };

      await addDoc(collection(db, "publications"), payload);
      setTitle(""); setSummary(""); setPoemContent(""); setSelectedFile(null);
      setShowPublishModal(false);
      fetchPoems();
    } catch (err: any) {
      alert(`Publish pipeline interrupted: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleLikeToggle = async (poem: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return alert("Please access your user matrix path to interact with compositions.");
    const poemRef = doc(db, "publications", poem.id);
    const isLiked = poem.likes?.includes(currentUser.uid);

    try {
      await updateDoc(poemRef, { likes: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) });
      const updatedPoems = poems.map(p => {
        if (p.id === poem.id) {
          const newLikes = isLiked ? p.likes.filter((id: string) => id !== currentUser.uid) : [...p.likes, currentUser.uid];
          return { ...p, likes: newLikes };
        }
        return p;
      });
      setPoems(updatedPoems);
      if (selectedPoem?.id === poem.id) {
        setSelectedPoem({ ...selectedPoem, likes: isLiked ? selectedPoem.likes.filter((id: string) => id !== currentUser.uid) : [...selectedPoem.likes, currentUser.uid] });
      }
    } catch (err) {
      console.error("Like stream execution interrupted:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;

    const commentPayload = {
      user_id: currentUser.uid,
      user_name: currentUser.displayName || "Anonymous Reader",
      rating: userRating,
      comment: newComment,
      created_at: new Date().toISOString()
    };

    try {
      const reviewsRef = collection(db, `publications/${selectedPoem.id}/reviews`);
      await addDoc(reviewsRef, commentPayload);
      
      const poemRef = doc(db, "publications", selectedPoem.id);
      const updatedReviewsCount = (selectedPoem.total_reviews || 0) + 1;
      const updatedAvgRating = parseFloat((((selectedPoem.average_rating || 5) * (selectedPoem.total_reviews || 0) + userRating) / updatedReviewsCount).toFixed(1));
      
      await updateDoc(poemRef, { total_reviews: updatedReviewsCount, average_rating: updatedAvgRating });
      setNewComment("");
      fetchComments(selectedPoem.id);
      fetchPoems();
      setSelectedPoem({ ...selectedPoem, total_reviews: updatedReviewsCount, average_rating: updatedAvgRating });
    } catch (err) {
      console.error("Review transaction sequence failed:", err);
    }
  };

  // Safe fallback evaluator string picker for dynamic ambient backgrounds
  const fetchAmbientGradientClass = (moodString: string) => {
    const optimizedKey = moodString?.toLowerCase().trim() || "classical verse";
    return AMBIENT_MOOD_MAP[optimizedKey] || AMBIENT_MOOD_MAP["classical verse"];
  };

  return (
    <div className="min-h-screen bg-[#24211e] text-[#ebdcb9] flex flex-col selection:bg-[#ebdcb9]/10 selection:text-[#ebdcb9]">
      
      {/* HEADER CONTROL COMPONENT */}
      <header className="border-b border-[#3d3731] bg-[#2b2723]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-xs font-sans text-[#c4b28d] hover:text-[#ebdcb9] transition-all cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Return to Sanctuary
        </button>
        <h1 className="font-serif text-sm tracking-[0.25em] uppercase text-white/90">Elegiac Poetry Archives</h1>
        <button onClick={() => setShowPublishModal(true)} className="flex items-center gap-1.5 bg-[#ebdcb9] hover:bg-white text-[#24211e] text-[10px] font-sans font-semibold tracking-wider uppercase px-4 py-2 rounded-lg transition-all cursor-pointer shadow-md">
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> Publish Poem
        </button>
      </header>

      {/* 🔮 CINEMATIC FULL SCREEN 3D REEL */}
      {!loading && poems.length > 0 && (
        <section className="relative w-full h-[calc(100vh-60px)] bg-[#191715] flex flex-col justify-center overflow-hidden border-b border-[#3d3731] perspective-3d">
          <div className="absolute top-8 left-10 z-20 flex items-center gap-2">
            <Compass className="h-4 w-4 text-amber-400" />
            <span className="font-serif text-xs uppercase tracking-widest text-[#c4b28d]/60">Ethereal Verses & Moving Stanzas</span>
          </div>

          <div className="flex gap-10 overflow-x-auto px-[15vw] py-10 scrollbar-none snap-x snap-mandatory items-center h-[70vh]">
            {poems.slice(0, 5).map((poem) => (
              <div 
                key={`3d-reel-${poem.id}`}
                onClick={() => handlePoemSelection(poem)}
                className="group relative flex-shrink-0 w-[70vw] sm:w-[450px] aspect-[3/4] rounded-[2rem] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.8)] border border-[#4d443c]/30 snap-center cursor-pointer transition-all duration-700 ease-out origin-center hover:scale-[1.03] bg-[#2b2723]"
              >
                {/* eslint-disable-next-html-element-img */}
                <img src={poem.cover_image_url} alt={poem.title} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-100 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-8 flex flex-col justify-end space-y-2">
                  <span className="text-[9px] font-sans text-amber-400 font-bold uppercase tracking-widest bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-md self-start">{poem.category}</span>
                  <h3 className="font-serif text-3xl text-white tracking-wide leading-tight">{poem.title}</h3>
                  <p className="text-sm font-sans text-[#c4b28d]/80 font-light line-clamp-2">{poem.summary}</p>
                </div>
              </div>
            ))}
          </div>

          <div onClick={scrollToLibrary} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 cursor-pointer group select-none animate-bounce">
            <span className="text-[9px] font-sans tracking-[0.3em] uppercase text-[#c4b28d]/40 group-hover:text-[#ebdcb9]">Scroll Down to Library</span>
            <ChevronRight className="h-4 w-4 text-[#c4b28d]/30 group-hover:text-[#ebdcb9] rotate-90 stroke-[1.5]" />
          </div>
        </section>
      )}

      {/* 🏛️ CORE ASSET LIBRARY GRID */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 space-y-8">
        
        {/* Omni-Filter Configuration Sheet Panel */}
        <div ref={libraryGridRef} className="bg-[#2b2723] border border-[#3d3731] rounded-3xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#c4b28d]/40" />
            <input 
              type="text" 
              placeholder="Search through poem titles, specific curators, or narrative manifestos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl pl-11 pr-4 py-3 text-sm text-[#ebdcb9] outline-none focus:border-[#ebdcb9]/30 transition-all placeholder:text-[#c4b28d]/30"
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto shrink-0">
            <div className="bg-[#1e1b19] border border-[#3d3731] rounded-xl px-3 flex items-center gap-2 text-xs text-[#c4b28d]/70 w-full md:w-auto">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#c4b28d]/40" />
              <select 
                value={selectedFilterCategory}
                onChange={(e) => setSelectedFilterCategory(e.target.value)}
                className="bg-transparent py-3 outline-none text-[#ebdcb9] font-sans text-xs cursor-pointer w-full"
              >
                <option value="all">All Mood Types</option>
                {POEM_CATEGORIES.map(cat => <option key={cat} value={cat.toLowerCase()}>{cat}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-xl font-serif text-[#ebdcb9] tracking-widest animate-pulse">Unrolling Papyrus Records...</div>
        ) : filteredPoems.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-[#3d3731] rounded-[2rem]">
            <Feather className="h-8 w-8 text-[#c4b28d]/20 mx-auto mb-2" />
            <p className="text-sm font-sans text-[#c4b28d]/40">No standalone stanzas have populated this layout selection matches.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 animate-fade-in">
            {filteredPoems.map((poem) => (
              <div 
                key={poem.id} 
                onClick={() => handlePoemSelection(poem)}
                className="group bg-[#2b2723] border border-[#3d3731] rounded-2xl p-4 flex flex-col justify-between space-y-4 cursor-pointer hover:border-[#ebdcb9]/20 transition-all duration-300 shadow-md"
              >
                <div className="space-y-4">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1e1b19] border border-[#3d3731]">
                    {/* eslint-disable-next-html-element-img */}
                    <img src={poem.cover_image_url} alt={poem.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-103" />
                    <button 
                      onClick={(e) => handleLikeToggle(poem, e)}
                      className={`absolute bottom-3 right-3 h-8 w-8 rounded-full border bg-black/60 backdrop-blur-md transition-all flex items-center justify-center cursor-pointer ${poem.likes?.includes(currentUser?.uid) ? "border-red-500/40 text-red-400" : "border-white/10 text-white/60 hover:text-white"}`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${poem.likes?.includes(currentUser?.uid) ? "fill-current" : ""}`} />
                    </button>
                  </div>
                  <div className="space-y-0.5 px-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-serif text-base text-white truncate tracking-wide">{poem.title}</h4>
                      <div className="flex items-center gap-1 text-amber-400 shrink-0">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        <span className="text-[10px] font-sans text-[#ebdcb9]">{poem.average_rating || "5.0"}</span>
                      </div>
                    </div>
                    <p className="text-[11px] font-sans text-[#c4b28d]/50 truncate">By {poem.author_name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* STAGE 1 POPUP MODAL: ENGAGEMENT & REVIEW SPACE (Desktop Margin Fix Applied) */}
      {selectedPoem && !activeReadingPoem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#2b2723] border border-[#3d3731] rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row h-auto max-h-[90vh] md:max-h-[85vh]">
            
            <button onClick={() => setSelectedPoem(null)} className="absolute top-4 right-4 h-8 w-8 bg-[#1e1b19]/80 backdrop-blur-xs border border-[#3d3731] rounded-full flex items-center justify-center text-[#c4b28d] hover:text-white transition-all cursor-pointer z-10"><X className="h-4 w-4" /></button>

            {/* Left Frame Display Column */}
            <div className="w-full md:w-1/2 bg-[#1e1b19] flex items-center justify-center relative p-6 border-b md:border-b-0 md:border-r border-[#3d3731]">
              <div className="relative aspect-[3/4] w-full max-w-[280px] flex items-center justify-center shadow-2xl rounded-xl overflow-hidden border border-[#3d3731]">
                {/* eslint-disable-next-html-element-img */}
                <img src={selectedPoem.cover_image_url} alt={selectedPoem.title} className="w-full h-full object-cover animate-fade-in" />
              </div>
            </div>

            {/* Right Detailed Engagement Curation Panel (Scroll-Contained Framework Fixed) */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col h-[55vh] md:h-[85vh] justify-between overflow-hidden">
              
              {/* Inner Body Scroll block context */}
              <div className="space-y-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#3d3731] scrollbar-track-transparent flex-1">
                <div className="space-y-1">
                  <span className="text-[8px] tracking-widest font-sans uppercase font-medium text-amber-400/70 border border-amber-500/20 bg-amber-500/5 px-2.5 py-0.5 rounded-full inline-block">{selectedPoem.category} Manifest</span>
                  <h2 className="font-serif text-2xl text-white tracking-wide pt-1">{selectedPoem.title}</h2>
                  
                  {/* Dynamic Author Profile Workspace Navigation Link */}
                  <p className="text-xs font-sans text-[#c4b28d]/60">
                    Curated by{" "}
                    <button 
                      onClick={() => router.push(`/author/${selectedPoem.author_id}`)}
                      className="text-[#ebdcb9] font-medium font-serif italic hover:text-amber-400 underline decoration-white/10 underline-offset-4 cursor-pointer transition-colors"
                    >
                      {selectedPoem.author_name}
                    </button>
                  </p>
                  
                  <div className="flex items-center gap-4 pt-2 text-xs font-sans text-[#c4b28d]/50">
                    <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-red-400 fill-red-400/20" /> {selectedPoem.likes?.length || 0} Likes</span>
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> {selectedPoem.average_rating || "5.0"} Score</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[9px] font-sans uppercase tracking-widest text-[#c4b28d]/40 font-bold">Summary Description</h4>
                  <p className="text-xs font-sans text-[#c4b28d]/80 leading-relaxed bg-[#1e1b19]/30 border border-[#3d3731]/40 p-3 rounded-xl">{selectedPoem.summary}</p>
                </div>

                {/* Live Comments Feedback Stream Thread logs */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[9px] font-sans uppercase tracking-widest text-[#c4b28d]/40 font-bold">Community Marginalia ({comments.length})</h4>
                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <p className="text-[11px] font-sans text-[#c4b28d]/30 italic">No margin notations left on this file page yet.</p>
                    ) : (
                      comments.map((com) => (
                        <div key={com.id} className="bg-[#1e1b19]/50 border border-[#3d3731]/40 rounded-xl p-2.5 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[11px] text-[#c4b28d]/60">
                            <span className="font-serif text-white/80 font-medium">{com.user_name}</span>
                            <div className="flex items-center gap-0.5 text-amber-400"><Star className="h-2.5 w-2.5 fill-current" /><span>{com.rating}</span></div>
                          </div>
                          <p className="text-[#c4b28d]/80 font-sans leading-relaxed">{com.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Interaction Form Action Rows (Locked explicitly to bottom layout map boundaries) */}
              <div className="pt-4 border-t border-[#3d3731] bg-[#2b2723] shrink-0 space-y-3 mt-4">
                {currentUser && (
                  <form onSubmit={handleAddComment} className="flex gap-2 items-center">
                    <input type="text" placeholder="Leave public margin thought notes..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 bg-[#1e1b19] border border-[#3d3731] text-xs font-sans text-[#ebdcb9] outline-none px-3 py-2.5 rounded-xl placeholder:text-white/5" required />
                    <select value={userRating} onChange={(e) => setUserRating(Number(e.target.value))} className="bg-[#1e1b19] border border-[#3d3731] text-xs text-amber-400 px-2 py-2.5 rounded-xl outline-none">
                      {[5, 4, 3, 2, 1].map(num => <option key={num} value={num}>{num} ★</option>)}
                    </select>
                    <button type="submit" className="h-9 w-9 bg-[#ebdcb9]/10 border border-[#3d3731] rounded-xl flex items-center justify-center text-[#ebdcb9] hover:bg-[#ebdcb9] hover:text-[#24211e] transition-all cursor-pointer"><Send className="h-3.5 w-3.5" /></button>
                  </form>
                )}
                
                <div className="flex gap-3">
                  <button onClick={(e) => handleLikeToggle(selectedPoem, e)} className={`px-4 bg-[#ebdcb9]/5 border border-[#3d3731] rounded-xl flex items-center justify-center transition-all cursor-pointer ${selectedPoem.likes?.includes(currentUser?.uid) ? "text-red-400 border-red-500/20" : "text-[#c4b28d] hover:text-white"}`}><Heart className={`h-4 w-4 mr-2 ${selectedPoem.likes?.includes(currentUser?.uid) ? "fill-current" : ""}`} /> Like Composition</button>
                  <button onClick={() => setActiveReadingPoem(selectedPoem)} className="flex-1 bg-[#ebdcb9] hover:bg-white text-[#24211e] text-[11px] font-sans font-medium uppercase tracking-widest py-3.5 rounded-xl transition-all text-center cursor-pointer shadow-md">Read Full Verse</button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 📖 STAGE 2 DISPLAY CANVAS READER: EXCLUSIVE ADAPTIVE GRADIENT BACKGROUND & ALIGNMENT CONFIGURATION */}
      {activeReadingPoem && (
        <div className={`fixed inset-0 bg-gradient-to-br ${fetchAmbientGradientClass(activeReadingPoem.category)} z-50 overflow-y-auto flex flex-col justify-between transition-all duration-1000 select-none`}>
          
          {/* Typographic Top Control Matrix Bar */}
          <header className="border-b border-white/5 bg-black/40 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <button onClick={() => setActiveReadingPoem(null)} className="flex items-center gap-2 text-xs font-sans text-white/50 hover:text-white transition-all cursor-pointer"><X className="h-4 w-4" /> Close Viewport</button>
            
            {/* Unique Custom Typography Layout Controls */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              <button 
                onClick={() => setPoemAlignment("left")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${poemAlignment === "left" ? "bg-white/10 text-[#dfb86c]" : "text-white/40 hover:text-white"}`}
                title="Left Align Verses"
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => setPoemAlignment("center")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${poemAlignment === "center" ? "bg-white/10 text-[#dfb86c]" : "text-white/40 hover:text-white"}`}
                title="Center Align Verses"
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => setPoemAlignment("right")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${poemAlignment === "right" ? "bg-white/10 text-[#dfb86c]" : "text-white/40 hover:text-white"}`}
                title="Right Align Verses"
              >
                <AlignRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <span className="font-serif text-xs text-white/30 tracking-[0.3em] uppercase hidden sm:inline">Adaptive Mood Canvas</span>
          </header>

          <div className="max-w-6xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col md:flex-row gap-12 md:gap-16 items-center my-auto">
            
            {/* Left Dynamic Section Layout: High Contrast Fluid Alignment Text Box */}
            <div className="w-full md:w-7/12 space-y-8 animate-slide-up">
              <div style={{ textAlign: poemAlignment }} className="space-y-4">
                <span className="text-[10px] font-sans font-semibold text-[#dfb86c]/60 tracking-widest uppercase block">{activeReadingPoem.category} Anthology</span>
                <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#dfb86c] tracking-wide font-medium leading-tight select-text">{activeReadingPoem.title}</h2>
              </div>
              <div className="h-[1px] w-16 bg-[#3d3731] mx-auto md:mx-0" style={{ marginLeft: poemAlignment === "center" ? "auto" : poemAlignment === "right" ? "auto" : "0", marginRight: poemAlignment === "center" ? "auto" : "0" }} />
              
              <div 
                style={{ textAlign: poemAlignment }}
                className="font-serif text-lg md:text-xl text-white/95 font-light leading-[2.3] whitespace-pre select-text tracking-wide antialiased transition-all duration-300 max-h-[55vh] overflow-y-auto pr-2"
              >
                {activeReadingPoem.poem_content}
              </div>

              <div style={{ textAlign: poemAlignment }} className="pt-6 border-t border-white/5">
                <p className="font-serif text-sm text-[#dfb86c] tracking-widest italic font-medium select-text">Written by {activeReadingPoem.author_name}</p>
              </div>
            </div>

            {/* Right Display Layout Section: Static Display Artwork Framing */}
            <div className="w-full md:w-5/12 flex justify-center items-center">
              <div className="relative w-full aspect-[3/4] max-w-[340px] rounded-3xl overflow-hidden border border-white/10 bg-[#1e1b19] shadow-[0_30px_80px_rgba(0,0,0,0.8)] transition-transform duration-500 hover:scale-102">
                {/* eslint-disable-next-html-element-img */}
                <img src={activeReadingPoem.cover_image_url} alt={activeReadingPoem.title} className="w-full h-full object-cover grayscale opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              </div>
            </div>

          </div>

          <footer className="py-6 px-6 text-center text-[10px] tracking-wider font-sans text-white/10 border-t border-white/5 bg-black/10 backdrop-blur-xs">Mode generated live by Iru-bee thematic design modules.</footer>
        </div>
      )}

      {/* ACTION CREATION OVERLAY BOX WIDGET COMPONENT */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#2b2723] border border-[#3d3731] rounded-[2rem] w-full max-w-xl p-6 md:p-8 space-y-5 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#3d3731] pb-3">
              <h3 className="font-serif text-lg text-white flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-400" /> Broadcast New Poetic Verse</h3>
              <button onClick={() => setShowPublishModal(false)} className="text-[#c4b28d]/40 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            
            <form onSubmit={handlePublishPoem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Composition Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl px-3 py-2.5 text-sm text-[#ebdcb9] outline-none focus:border-[#c4b28d]/40 placeholder:text-white/5" required />
                </div>
                <div className="space-y-1"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Verse Categorization</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl px-3 py-2.5 text-sm text-amber-100/90 outline-none">{POEM_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                </div>
              </div>

              <div className="space-y-1"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Summary Manifesto / Description (Optional)</label>
                <textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Brief contextual overview notes..." className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl px-3 py-2.5 text-sm text-[#ebdcb9] outline-none resize-none placeholder:text-white/5" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Poetic Verses (Max 5,000 Characters)</label><span className="text-[10px] font-sans text-[#c4b28d]/40">{poemContent.length} / 5000</span></div>
                <textarea rows={6} value={poemContent} onChange={(e) => setPoemContent(e.target.value)} placeholder="Type or paste your verses cleanly preserving rhythmic line breaks here..." className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl px-3 py-2.5 text-sm font-serif text-[#ebdcb9] outline-none whitespace-pre placeholder:text-white/5" required />
              </div>

              <div className="space-y-1"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Exhibition Cover Display Image File</label>
                <div className="relative w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl p-4 text-center cursor-pointer hover:bg-[#1e1b19]/80 transition-all">
                  <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 opacity-0 cursor-pointer w-full" required />
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <Upload className="h-5 w-5 text-[#c4b28d]/40" />
                    <span className="text-xs font-sans text-[#c4b28d]/70">{selectedFile ? selectedFile.name : "Select or Drop Cover Asset Image"}</span>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={publishing} className="w-full bg-[#ebdcb9] hover:bg-white text-[#24211e] text-xs font-sans font-medium uppercase tracking-wider py-4 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-40">{publishing ? "Streaming Verse Layers to Cloud Engine..." : "Commit and Publish Verse"}</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}