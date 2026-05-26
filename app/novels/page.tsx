"use client";

import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, orderBy, addDoc, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Star, BookOpen, X, Heart, Compass, Upload, Plus, Sparkles, Send, Search, SlidersHorizontal, Trash2, ChevronRight } from "lucide-react";

// 🚀 DYNAMIC IMPORT: Brings in the new 3D flipbook engine without crashing Next.js SSR
const BookReader = dynamic(() => import('@/components/BookReader'), { 
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#0c0c0e] space-y-4 z-50">
      <div className="h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      <p className="font-serif text-sm text-amber-500/60 italic animate-pulse tracking-widest">Waking the 3D Physics Engine...</p>
    </div>
  )
});

export default function NovelsLibrary() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [novels, setNovels] = useState<any[]>([]);
  const [filteredNovels, setFilteredNovels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search Engine Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("all");

  // Interface States
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState<any>(null);
  const [activeReadingNovel, setActiveReadingNovel] = useState<any>(null);

  // Novel Creation Form States
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Review States
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userRating, setUserRating] = useState(5);

  const libraryRef = useRef<HTMLHeadingElement | null>(null);

  // Initialize Auth & Fetch Novels
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    fetchNovels();
    return () => unsubscribe();
  }, []);

  // Omni-Search Evaluator
  useEffect(() => {
    let output = novels;

    if (searchQuery.trim() !== "") {
      const criteria = searchQuery.toLowerCase();
      output = output.filter(n => 
        n.title?.toLowerCase().includes(criteria) || 
        n.summary?.toLowerCase().includes(criteria) ||
        n.author_name?.toLowerCase().includes(criteria)
      );
    }

    if (selectedFilterCategory !== "all") {
      output = output.filter(n => n.category?.toLowerCase() === selectedFilterCategory.toLowerCase());
    }

    setFilteredNovels(output);
  }, [searchQuery, selectedFilterCategory, novels]);

  // Database Fetchers
  const fetchNovels = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "publications"), where("type", "==", "novel"), orderBy("created_at", "desc"));
      const querySnapshot = await getDocs(q);
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, likes: [], category: "Epic Fantasy", ...doc.data() });
      });
      setNovels(items);
      setFilteredNovels(items);
    } catch (err) {
      console.error("Error archiving manuscripts registry:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (novelId: string) => {
    try {
      const commentsSnapshot = await getDocs(query(collection(db, `publications/${novelId}/reviews`), orderBy("created_at", "desc")));
      const items: any[] = [];
      commentsSnapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setComments(items);
    } catch (err) {
      console.error("Error formatting manuscript annotations:", err);
    }
  };

  const handleNovelSelection = (novel: any) => {
    setSelectedNovel(novel);
    fetchComments(novel.id);
  };

  const scrollToLibrary = () => {
    libraryRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // SECURE DELETE FUNCTION (Author Only)
  const handleDeleteNovel = async () => {
    if (!selectedNovel || selectedNovel.author_id !== currentUser?.uid) return;
    
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this manuscript? This cannot be undone.");
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "publications", selectedNovel.id));
        setSelectedNovel(null);
        fetchNovels();
      } catch (err) {
        console.error("Failed to delete novel:", err);
        alert("An error occurred while deleting the manuscript.");
      }
    }
  };

  // Upload & Publish Logic
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "irubee_preset");
    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dovq341qc"}/upload`, { method: "POST", body: formData });
    if (!response.ok) throw new Error("Cloud asset infrastructure failed to reply.");
    const data = await response.json();
    return data.secure_url;
  };

  const handlePublishNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("Please authorize your signature entry route before publishing.");
    if (!selectedCoverFile || !selectedPdfFile) return alert("Both a cover display layout photo and a manuscript document file are required.");
    setPublishing(true);

    try {
      const coverUrl = await uploadToCloudinary(selectedCoverFile);
      const pdfUrl = await uploadToCloudinary(selectedPdfFile);

      const payload = {
        author_id: currentUser.uid,
        author_name: currentUser.displayName || "Anonymous Author",
        title,
        summary,
        cover_image_url: coverUrl,
        pdf_url: pdfUrl,
        type: "novel",
        created_at: new Date().toISOString(),
        likes: [],
        average_rating: 5.0,
        total_reviews: 0
      };

      await addDoc(collection(db, "publications"), payload);
      setTitle(""); setSummary(""); setSelectedCoverFile(null); setSelectedPdfFile(null);
      setShowPublishModal(false);
      fetchNovels();
    } catch (err: any) {
      alert(`Publish pipeline halted execution: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  // Interaction Logic
  const handleLikeToggle = async (novel: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return alert("Authentication validation session not discovered.");
    const novelRef = doc(db, "publications", novel.id);
    const isLiked = novel.likes?.includes(currentUser.uid);

    try {
      await updateDoc(novelRef, { likes: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) });
      const updatedNovels = novels.map(n => {
        if (n.id === novel.id) {
          const newLikes = isLiked ? n.likes.filter((id: string) => id !== currentUser.uid) : [...n.likes, currentUser.uid];
          return { ...n, likes: newLikes };
        }
        return n;
      });
      setNovels(updatedNovels);
      if (selectedNovel?.id === novel.id) {
        setSelectedNovel({ ...selectedNovel, likes: isLiked ? selectedNovel.likes.filter((id: string) => id !== currentUser.uid) : [...selectedNovel.likes, currentUser.uid] });
      }
    } catch (err) {
      console.error("Like metric database adjustment failed:", err);
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
      await addDoc(collection(db, `publications/${selectedNovel.id}/reviews`), commentPayload);
      const novelRef = doc(db, "publications", selectedNovel.id);
      const updatedReviewsCount = (selectedNovel.total_reviews || 0) + 1;
      const updatedAvgRating = parseFloat((((selectedNovel.average_rating || 5) * (selectedNovel.total_reviews || 0) + userRating) / updatedReviewsCount).toFixed(1));
      
      await updateDoc(novelRef, { total_reviews: updatedReviewsCount, average_rating: updatedAvgRating });
      setNewComment("");
      fetchComments(selectedNovel.id);
      fetchNovels();
      setSelectedNovel({ ...selectedNovel, total_reviews: updatedReviewsCount, average_rating: updatedAvgRating });
    } catch (err) {
      console.error("Marginalia save process failure:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#24211e] text-[#ebdcb9] flex flex-col selection:bg-[#ebdcb9]/10 selection:text-[#ebdcb9]">
      
      {/* HEADER CONTROLS */}
      <header className="border-b border-[#3d3731] bg-[#2b2723]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-xs font-sans text-[#c4b28d] hover:text-[#ebdcb9] transition-all cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Return to Sanctuary
        </button>
        <h1 className="font-serif text-sm tracking-[0.25em] uppercase text-white/90">Curated Novel Archives</h1>
        <button onClick={() => setShowPublishModal(true)} className="flex items-center gap-1.5 bg-[#ebdcb9] hover:bg-white text-[#24211e] text-[10px] font-sans font-semibold tracking-wider uppercase px-4 py-2 rounded-lg transition-all cursor-pointer shadow-md">
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> Publish Novel
        </button>
      </header>

      {/* 🔮 CINEMATIC FULL SCREEN 3D REEL */}
      {!loading && novels.length > 0 && (
        <section className="relative w-full h-[calc(100vh-60px)] bg-[#191715] flex flex-col justify-center overflow-hidden border-b border-[#3d3731] persist-3d">
          <div className="absolute top-8 left-10 z-20 flex items-center gap-2">
            <Compass className="h-4 w-4 text-amber-400" />
            <span className="font-serif text-xs uppercase tracking-widest text-[#c4b28d]/60">Immersive Master Showcases</span>
          </div>

          <div className="flex gap-10 overflow-x-auto px-[15vw] py-10 scrollbar-none snap-x snap-mandatory items-center h-[70vh]">
            {novels.slice(0, 5).map((novel) => (
              <div 
                key={`3d-reel-${novel.id}`}
                onClick={() => handleNovelSelection(novel)}
                className="group relative flex-shrink-0 w-[70vw] sm:w-[450px] aspect-[3/4] rounded-[2rem] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.8)] border border-[#4d443c]/30 snap-center cursor-pointer transition-all duration-700 ease-out origin-center hover:scale-[1.03] bg-[#2b2723]"
                style={{ transform: "perspective(1200px) rotateY(0deg)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={novel.cover_image_url} alt={novel.title} className="w-full h-full object-cover transition-transform duration-700 scale-100 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-8 flex flex-col justify-end space-y-2">
                  <span className="text-[9px] font-sans text-amber-400 font-bold uppercase tracking-widest bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-md self-start">Premium Manuscript</span>
                  <h3 className="font-serif text-3xl text-white tracking-wide leading-tight">{novel.title}</h3>
                  <p className="text-sm font-sans text-[#c4b28d]/80 font-light line-clamp-2">{novel.summary}</p>
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

      {/* 🏛️ CORE LIBRARY DISPLAY AND SEARCH STRUCTURE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 space-y-8">
        
        <div ref={libraryRef} className="bg-[#2b2723] border border-[#3d3731] rounded-3xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#c4b28d]/40" />
            <input 
              type="text" 
              placeholder="Search through titles, authors, or synopsis profiles..."
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
                <option value="all">All Genres</option>
                <option value="epic fantasy">Epic Fantasy</option>
                <option value="sci-fi fiction">Sci-Fi Fiction</option>
                <option value="mystery thriller">Mystery Thriller</option>
                <option value="historical prose">Historical Prose</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-xl font-serif text-[#ebdcb9] tracking-widest animate-pulse">Decrypting Manuscript Logs...</div>
        ) : filteredNovels.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-[#3d3731] rounded-[2rem]">
            <BookOpen className="h-8 w-8 text-[#c4b28d]/20 mx-auto mb-2" />
            <p className="text-sm font-sans text-[#c4b28d]/40">No original manuscripts matched your search filter criteria rules.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 animate-fade-in">
            {filteredNovels.map((novel) => (
              <div 
                key={novel.id} 
                onClick={() => handleNovelSelection(novel)}
                className="group bg-[#2b2723] border border-[#3d3731] rounded-2xl p-4 flex flex-col justify-between space-y-4 cursor-pointer hover:border-[#ebdcb9]/20 transition-all duration-300 shadow-md"
              >
                <div className="space-y-4">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1e1b19] border border-[#3d3731]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={novel.cover_image_url} alt={novel.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-103" />
                    <button 
                      onClick={(e) => handleLikeToggle(novel, e)}
                      className={`absolute bottom-3 right-3 h-8 w-8 rounded-full border bg-black/60 backdrop-blur-md transition-all flex items-center justify-center cursor-pointer ${novel.likes?.includes(currentUser?.uid) ? "border-red-500/40 text-red-400" : "border-white/10 text-white/60 hover:text-white"}`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${novel.likes?.includes(currentUser?.uid) ? "fill-current" : ""}`} />
                    </button>
                  </div>
                  <div className="space-y-0.5 px-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-serif text-base text-white truncate tracking-wide">{novel.title}</h4>
                      <div className="flex items-center gap-1 text-amber-400 shrink-0">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        <span className="text-[10px] font-sans text-[#ebdcb9]">{novel.average_rating || "5.0"}</span>
                      </div>
                    </div>
                    <p className="text-[11px] font-sans text-[#c4b28d]/50 truncate">By {novel.author_name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* SPLIT SCREEN PREVIEW OVERLAY MODAL */}
      {selectedNovel && !activeReadingNovel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#2b2723] border border-[#3d3731] rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row h-auto max-h-[90vh] md:max-h-[85vh]">
            
            <button onClick={() => setSelectedNovel(null)} className="absolute top-4 right-4 h-8 w-8 bg-[#1e1b19]/80 backdrop-blur-xs border border-[#3d3731] rounded-full flex items-center justify-center text-[#c4b28d] hover:text-white transition-all cursor-pointer z-10">
              <X className="h-4 w-4" />
            </button>

            <div className="w-full md:w-1/2 bg-[#1e1b19] flex items-center justify-center relative p-6 border-b md:border-b-0 md:border-r border-[#3d3731]">
              <div className="relative aspect-[3/4] w-full max-w-[280px] flex items-center justify-center shadow-2xl rounded-xl overflow-hidden border border-[#3d3731]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedNovel.cover_image_url} alt={selectedNovel.title} className="w-full h-full object-cover animate-fade-in" />
              </div>
            </div>

            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col h-[55vh] md:h-[85vh] justify-between overflow-hidden">
              <div className="space-y-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#3d3731] scrollbar-track-transparent flex-1">
                <div className="space-y-1">
                  <span className="text-[8px] tracking-widest font-sans uppercase font-medium text-amber-400/70 border border-amber-500/20 bg-amber-500/5 px-2.5 py-0.5 rounded-full inline-block">Manuscript Core</span>
                  <h2 className="font-serif text-2xl text-white tracking-wide pt-1">{selectedNovel.title}</h2>
                  
                  <p className="text-xs font-sans text-[#c4b28d]/60">
                    Authored by{" "}
                    <button 
                      onClick={() => router.push(`/author/${selectedNovel.author_id}`)}
                      className="text-[#ebdcb9] font-medium font-serif italic hover:text-amber-400 underline decoration-white/10 underline-offset-4 cursor-pointer transition-colors"
                    >
                      {selectedNovel.author_name}
                    </button>
                  </p>
                  
                  <div className="flex items-center gap-4 pt-2 text-xs font-sans text-[#c4b28d]/50">
                    <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-red-400 fill-red-400/20" /> {selectedNovel.likes?.length || 0} Likes</span>
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> {selectedNovel.average_rating || "5.0"} Score</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[9px] font-sans uppercase tracking-widest text-[#c4b28d]/40 font-bold">Synopsis</h4>
                  <p className="text-xs font-sans text-[#c4b28d]/80 leading-relaxed bg-[#1e1b19]/30 border border-[#3d3731]/40 p-3 rounded-xl">{selectedNovel.summary}</p>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-[9px] font-sans uppercase tracking-widest text-[#c4b28d]/40 font-bold">Reader Critique Notes ({comments.length})</h4>
                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <p className="text-[11px] font-sans text-[#c4b28d]/30 italic">No manuscript notes recorded on this file frame yet.</p>
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

              <div className="pt-4 border-t border-[#3d3731] bg-[#2b2723] shrink-0 space-y-3 mt-4">
                {currentUser && (
                  <form onSubmit={handleAddComment} className="flex gap-2 items-center">
                    <input type="text" placeholder="Add an analytical review note..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 bg-[#1e1b19] border border-[#3d3731] text-xs font-sans text-[#ebdcb9] outline-none px-3 py-2.5 rounded-xl placeholder:text-white/5" required />
                    <select value={userRating} onChange={(e) => setUserRating(Number(e.target.value))} className="bg-[#1e1b19] border border-[#3d3731] text-xs text-amber-400 px-2 py-2.5 rounded-xl outline-none">
                      {[5, 4, 3, 2, 1].map(num => <option key={num} value={num}>{num} ★</option>)}
                    </select>
                    <button type="submit" className="h-9 w-9 bg-[#ebdcb9]/10 border border-[#3d3731] rounded-xl flex items-center justify-center text-[#ebdcb9] hover:bg-[#ebdcb9] hover:text-[#24211e] transition-all cursor-pointer"><Send className="h-3.5 w-3.5" /></button>
                  </form>
                )}
                
                {/* INTERACTION AND SECURE DELETE BUTTON */}
                <div className="flex gap-3">
                  <button onClick={(e) => handleLikeToggle(selectedNovel, e)} className={`px-4 bg-[#ebdcb9]/5 border border-[#3d3731] rounded-xl flex items-center justify-center transition-all cursor-pointer ${selectedNovel.likes?.includes(currentUser?.uid) ? "text-red-400 border-red-500/20" : "text-[#c4b28d] hover:text-white"}`}>
                    <Heart className={`h-4 w-4 mr-2 ${selectedNovel.likes?.includes(currentUser?.uid) ? "fill-current" : ""}`} /> Like
                  </button>
                  
                  <button onClick={() => setActiveReadingNovel(selectedNovel)} className="flex-1 bg-[#ebdcb9] hover:bg-white text-[#24211e] text-[11px] font-sans font-medium uppercase tracking-widest py-3.5 rounded-xl transition-all text-center cursor-pointer shadow-md">
                    Read More
                  </button>

                  {/* ONLY RENDER IF LOGGED IN USER IS THE AUTHOR */}
                  {currentUser?.uid === selectedNovel.author_id && (
                    <button 
                      onClick={handleDeleteNovel} 
                      title="Delete Manuscript"
                      className="px-4 bg-red-950/40 border border-red-900/50 hover:bg-red-900/60 rounded-xl flex items-center justify-center text-red-400 transition-all cursor-pointer shadow-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 📖 STAGE 2 IMMERSIVE 3D FLIPBOOK VIEWPORT */}
      {activeReadingNovel && (
        <div className="fixed inset-0 bg-[#0c0c0e] z-50 flex flex-col select-none animate-fade-in">
          
          <header className="border-b border-white/5 bg-[#141211]/90 backdrop-blur-md px-4 py-4 md:px-8 flex items-center justify-between z-[110]">
            <button 
              onClick={() => setActiveReadingNovel(null)} 
              className="flex items-center gap-2 text-xs font-sans text-white/50 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-4 w-4" /> <span className="hidden sm:block">Close Manuscript</span>
            </button>
            <div className="text-center font-serif text-sm tracking-wide text-amber-500/80 truncate px-4 max-w-[60vw]">
              {activeReadingNovel.title}
            </div>
            {/* Spacer to keep title centered */}
            <div className="w-16 hidden sm:block" />
          </header>

          {/* 🚀 THE NEW ENGINE: No manual chevron buttons needed. The engine handles full edge-to-edge touch/click zones automatically. */}
          <div className="flex-1 w-full relative bg-[#0c0c0e]">
            <BookReader url={activeReadingNovel.pdf_url} />
          </div>

          <footer className="absolute bottom-0 w-full py-3 bg-gradient-to-t from-black via-black/80 to-transparent text-center text-[9px] text-white/20 tracking-widest uppercase font-sans z-[110] pointer-events-none">
            Swipe or Tap Edges to Flip Pages
          </footer>
        </div>
      )}

      {/* MANUSCRIPT PUBLISHING CREATION MODAL OVERLAY */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#2b2723] border border-[#3d3731] rounded-[2rem] w-full max-w-xl p-6 md:p-8 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#3d3731] pb-3">
              <h3 className="font-serif text-lg text-white flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-400" /> Submit Original Manuscript</h3>
              <button onClick={() => setShowPublishModal(false)} className="text-[#c4b28d]/40 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            
            <form onSubmit={handlePublishNovel} className="space-y-4">
              <div className="space-y-1"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Manuscript Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl px-3 py-2.5 text-sm text-[#ebdcb9] outline-none focus:border-[#c4b28d]/40 placeholder:text-white/5" required />
              </div>

              <div className="space-y-1"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Summary / Core Plot Synopsis</label>
                <textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Provide a compelling structural introduction framework overview description for readers..." className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl px-3 py-2.5 text-sm text-[#ebdcb9] outline-none resize-none placeholder:text-white/5" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Exhibition Front Cover Image</label>
                  <div className="relative w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl p-3 text-center cursor-pointer hover:bg-[#1e1b19]/80 transition-all">
                    <input type="file" accept="image/*" onChange={(e) => setSelectedCoverFile(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 opacity-0 cursor-pointer w-full" required />
                    <Upload className="h-4 w-4 text-[#c4b28d]/40 mx-auto mb-1" />
                    <span className="text-[11px] font-sans text-[#c4b28d]/60 block truncate">{selectedCoverFile ? selectedCoverFile.name : "Upload Graphic JPEG"}</span>
                  </div>
                </div>

                <div className="space-y-1"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Master Book Text File (PDF)</label>
                  <div className="relative w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl p-3 text-center cursor-pointer hover:bg-[#1e1b19]/80 transition-all">
                    <input type="file" accept="application/pdf" onChange={(e) => setSelectedPdfFile(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 opacity-0 cursor-pointer w-full" required />
                    <Upload className="h-4 w-4 text-[#c4b28d]/40 mx-auto mb-1" />
                    <span className="text-[11px] font-sans text-[#c4b28d]/60 block truncate">{selectedPdfFile ? selectedPdfFile.name : "Select Manuscript PDF"}</span>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={publishing} className="w-full bg-[#ebdcb9] hover:bg-white text-[#24211e] text-xs font-sans font-medium uppercase tracking-wider py-4 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-40">
                {publishing ? "Streaming Layout Packages to Cloud Engine..." : "Publish Novel Catalog"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}