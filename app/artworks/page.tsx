"use client";

import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, orderBy, addDoc, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Image as ImageIcon, X, Heart, MessageSquare, Compass, Eye, Send, Plus, Upload, Sparkles, Search, SlidersHorizontal, ChevronRight } from "lucide-react";

const ART_CATEGORIES = ["Digital Matte Painting", "Oil on Canvas", "Surrealism Exhibit", "Minimalist Concept", "Classical Renaissance"];

export default function ArtworksGallery() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [filteredArtworks, setFilteredArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search Engine Filter State Coordinates
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("all");

  // Interface Component View State Controls
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedArt, setSelectedArt] = useState<any>(null);

  // Creative Post Creation State Nodes
  const [postTitle, setPostTitle] = useState("");
  const [postSummary, setPostSummary] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Digital Matte Painting");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Social Engagement Content Thread States
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userRating, setUserRating] = useState(5);

  const libraryGalleryRef = useRef<HTMLHeadingElement | null>(null);

  // 🛡️ AUTH CHECK ENGINE WITH CACHING FREEZE FIX
  useEffect(() => {
    if (auth.currentUser) {
      setCurrentUser(auth.currentUser);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
    
    fetchArtworks();
    return () => unsubscribe();
  }, []);

  // LIVE OMNI-SEARCH ENGINE METRIC SCANNERS
  useEffect(() => {
    let output = artworks;

    if (searchQuery.trim() !== "") {
      const criteria = searchQuery.toLowerCase();
      output = output.filter(a => 
        a.title?.toLowerCase().includes(criteria) || 
        a.summary?.toLowerCase().includes(criteria) ||
        a.author_name?.toLowerCase().includes(criteria)
      );
    }

    if (selectedFilterCategory !== "all") {
      output = output.filter(a => a.category?.toLowerCase() === selectedFilterCategory.toLowerCase());
    }

    setFilteredArtworks(output);
  }, [searchQuery, selectedFilterCategory, artworks]);

  const fetchArtworks = async () => {
    try {
      const q = query(
        collection(db, "publications"),
        where("type", "==", "art"),
        orderBy("created_at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, likes: [], ...doc.data() });
      });
      setArtworks(items);
      setFilteredArtworks(items);
    } catch (err) {
      console.error("Error reading artworks catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (artId: string) => {
    try {
      const commentsSnapshot = await getDocs(
        query(collection(db, `publications/${artId}/reviews`), orderBy("created_at", "desc"))
      );
      const items: any[] = [];
      commentsSnapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setComments(items);
    } catch (err) {
      console.error("Error reading artwork annotations:", err);
    }
  };

  const handleArtSelection = (art: any) => {
    setSelectedArt(art);
    fetchComments(art.id);
  };

  const scrollToGalleryGrid = () => {
    libraryGalleryRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ☁️ CLOUDINARY API MASSIVE BINARY STREAM PIPELINE
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "irubee_preset");
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dovq341qc"}/upload`, 
      { method: "POST", body: formData }
    );
    
    if (!response.ok) throw new Error("Media content transmission to Cloudinary buckets failed.");
    const data = await response.json();
    return data.secure_url;
  };

  const handlePublishArtPiece = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("Please access your workspace identity path before publishing items.");
    if (!selectedFile) return alert("A clean primary master image file is strictly required.");
    setPublishing(true);

    try {
      const masterAssetUrl = await uploadToCloudinary(selectedFile);

      const publicationPayload = {
        author_id: currentUser.uid,
        author_name: currentUser.displayName || "Anonymous Creator",
        title: postTitle,
        type: "art",
        summary: postSummary,
        category: selectedCategory,
        cover_image_url: masterAssetUrl,
        poem_content: null,
        pdf_url: null,
        created_at: new Date().toISOString(),
        likes: [],
        average_rating: 5.0,
        total_reviews: 0
      };

      await addDoc(collection(db, "publications"), publicationPayload);
      
      setPostTitle("");
      setPostSummary("");
      setSelectedFile(null);
      setShowPublishModal(false);
      fetchArtworks();
    } catch (err: any) {
      alert(`Publishing stream failed execution sequence: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleLikeToggle = async (art: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return alert("Please access your user profile to react to gallery exhibitions.");
    const artRef = doc(db, "publications", art.id);
    const isLiked = art.likes?.includes(currentUser.uid);

    try {
      await updateDoc(artRef, {
        likes: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
      });
      
      const updatedArtworks = artworks.map(a => {
        if (a.id === art.id) {
          const newLikes = isLiked ? a.likes.filter((id: string) => id !== currentUser.uid) : [...a.likes, currentUser.uid];
          return { ...a, likes: newLikes };
        }
        return a;
      });
      setArtworks(updatedArtworks);

      if (selectedArt?.id === art.id) {
        setSelectedArt({ 
          ...selectedArt, 
          likes: isLiked ? selectedArt.likes.filter((id: string) => id !== currentUser.uid) : [...selectedArt.likes, currentUser.uid] 
        });
      }
    } catch (err) {
      console.error("Like interaction pipeline failure:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;

    const commentPayload = {
      user_id: currentUser.uid,
      user_name: currentUser.displayName || "Anonymous Critic",
      rating: userRating,
      comment: newComment,
      created_at: new Date().toISOString()
    };

    try {
      const reviewsRef = collection(db, `publications/${selectedArt.id}/reviews`);
      await addDoc(reviewsRef, commentPayload);
      
      const artRef = doc(db, "publications", selectedArt.id);
      const updatedReviewsCount = (selectedArt.total_reviews || 0) + 1;
      const updatedAvgRating = parseFloat(
        (((selectedArt.average_rating || 5) * (selectedArt.total_reviews || 0) + userRating) / updatedReviewsCount).toFixed(1)
      );
      
      await updateDoc(artRef, {
        total_reviews: updatedReviewsCount,
        average_rating: updatedAvgRating
      });

      setNewComment("");
      fetchComments(selectedArt.id);
      fetchArtworks();
      setSelectedArt({ ...selectedArt, total_reviews: updatedReviewsCount, average_rating: updatedAvgRating });
    } catch (err) {
      console.error("Critical annotation log failure:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#24211e] text-[#ebdcb9] flex flex-col selection:bg-[#ebdcb9]/10 selection:text-[#ebdcb9]">
      
      {/* GALLERY HEADER */}
      <header className="border-b border-[#3d3731] bg-[#2b2723]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-xs font-sans text-[#c4b28d] hover:text-[#ebdcb9] transition-all cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Return to Sanctuary
        </button>
        <h1 className="font-serif text-sm tracking-[0.25em] uppercase text-white/90">Visual Arts Gallery</h1>
        <button onClick={() => setShowPublishModal(true)} className="flex items-center gap-1.5 bg-[#ebdcb9] hover:bg-white text-[#24211e] text-[10px] font-sans font-semibold tracking-wider uppercase px-4 py-2 rounded-lg transition-all cursor-pointer shadow-md">
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> Publish Art
        </button>
      </header>

      {/* RENDER SPLIT-LAYER DYNAMIC LOAD SCREENS */}
      {loading ? (
        <div className="flex-1 bg-[#24211e] flex flex-col items-center justify-center">
          <div className="text-xl font-serif text-[#ebdcb9] tracking-widest animate-pulse">Illuminating Exhibition Halls...</div>
        </div>
      ) : (
        <>
          {/* 🎞️ BALANCED 3D CINEMATIC SPOTLIGHT HERO CAROUSEL */}
          {artworks.length > 0 && (
            <section className="relative w-full h-[calc(100vh-60px)] bg-[#070708] flex flex-col justify-between overflow-hidden border-b border-[#3d3731] perspective-3d">
              <div className="pt-8 px-10 flex items-center gap-2 shrink-0">
                <Compass className="h-4 w-4 text-amber-400/80" />
                <span className="font-serif text-xs uppercase tracking-[0.2em] text-[#c4b28d]/60">Selected and popular canvases right now</span>
              </div>
              
              {/* Perfectly Proportioned 3D Perspective Card Track */}
              <div className="flex-1 flex gap-8 overflow-x-auto px-[12vw] scrollbar-none snap-x snap-mandatory items-center max-h-[65vh]">
                {artworks.slice(0, 5).map((art, idx) => {
                  const rotationY = idx % 2 === 0 ? "rotateY(-10deg)" : "rotateY(10deg)";
                  return (
                    <div 
                      key={`3d-exhibit-${art.id}`}
                      onClick={() => handleArtSelection(art)}
                      className="group relative flex-shrink-0 w-[68vw] sm:w-[340px] md:w-[380px] aspect-[3/4] rounded-[2rem] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/5 snap-center cursor-pointer transition-all duration-700 ease-out bg-[#1e1b19] hover:scale-[1.03] hover:rotate-y-0"
                      style={{ transform: `perspective(1200px) ${rotationY} rotateX(1deg)` }}
                    >
                      {/* eslint-disable-next-html-element-img */}
                      <img src={art.cover_image_url} alt={art.title} className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                      
                      {/* Linear gradient veil overlay for perfect layout card legibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90 p-6 flex flex-col justify-end space-y-1.5">
                        <span className="text-[8px] font-sans font-bold uppercase tracking-[0.2em] text-[#dfb86c] bg-[#dfb86c]/10 border border-[#dfb86c]/20 px-2.5 py-0.5 rounded-full self-start">{art.category}</span>
                        <h3 className="font-serif text-2xl text-white tracking-wide font-medium leading-snug truncate w-full">{art.title}</h3>
                        <p className="text-xs font-sans text-[#c4b28d]/50 font-light truncate w-full">Curated by {art.author_name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Scroll Callout Pointer */}
              <div onClick={scrollToGalleryGrid} className="pb-8 flex flex-col items-center gap-1 cursor-pointer group select-none animate-bounce shrink-0">
                <span className="text-[8px] font-sans tracking-[0.35em] uppercase text-[#c4b28d]/40 group-hover:text-[#ebdcb9] transition-colors">Scroll to Gallery</span>
                <ChevronRight className="h-4 w-4 text-[#c4b28d]/30 group-hover:text-[#ebdcb9] rotate-90 stroke-[1.5]" />
              </div>
            </section>
          )}

          {/* 🏛️ CORE LIBRARY STRUCTURE GRID */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 space-y-8">
            
            {/* Live Filter Execution Array Panel */}
            <div ref={libraryGalleryRef} className="bg-[#2b2723] border border-[#3d3731] rounded-3xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#c4b28d]/40" />
                <input 
                  type="text" 
                  placeholder="Filter by master canvas title, artist signatures, or description keywords..."
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
                    {ART_CATEGORIES.map(cat => <option key={cat} value={cat.toLowerCase()}>{cat}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {filteredArtworks.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-[#3d3731] rounded-[2rem]">
                <ImageIcon className="h-8 w-8 text-[#c4b28d]/20 mx-auto mb-3" />
                <p className="text-sm font-sans text-[#c4b28d]/40">The exhibition layout holds no active matching elements right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 animate-fade-in">
                {filteredArtworks.map((art) => (
                  <div 
                    key={art.id}
                    onClick={() => handleArtSelection(art)}
                    className="group bg-[#2b2723] border border-[#3d3731] rounded-2xl p-3.5 flex flex-col justify-between space-y-4 cursor-pointer hover:border-[#ebdcb9]/30 transition-all duration-300 shadow-md"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1e1b19] border border-[#3d3731]">
                        {/* eslint-disable-next-html-element-img */}
                        <img src={art.cover_image_url} alt={art.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 ease-out scale-100 group-hover:scale-103" />
                        
                        <button 
                          onClick={(e) => handleLikeToggle(art, e)}
                          className={`absolute bottom-3 right-3 h-8 w-8 rounded-full border bg-black/60 backdrop-blur-md transition-all flex items-center justify-center cursor-pointer ${art.likes?.includes(currentUser?.uid) ? "border-red-500/40 text-red-400" : "border-white/10 text-white/60 hover:text-white"}`}
                        >
                          <Heart className={`h-3.5 w-3.5 ${art.likes?.includes(currentUser?.uid) ? "fill-current" : ""}`} />
                        </button>
                      </div>
                      
                      <div className="space-y-0.5 px-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-serif text-base text-white truncate tracking-wide group-hover:text-amber-100 transition-colors">{art.title}</h4>
                          <div className="flex items-center gap-1 shrink-0 text-amber-400">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            <span className="text-[10px] font-sans text-[#ebdcb9]">{art.average_rating || "5.0"}</span>
                          </div>
                        </div>
                        <p className="text-[11px] font-sans text-[#c4b28d]/40 capitalize tracking-wider font-medium">{art.category}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {/* 🖼️ ELEGANT ARTWORK POPUP SUMMARY MODAL */}
      {selectedArt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#2b2723] border border-[#3d3731] rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row h-auto max-h-[90vh] md:max-h-[85vh]">
            
            <button 
              onClick={() => setSelectedArt(null)} 
              className="absolute top-4 right-4 h-8 w-8 bg-[#1e1b19]/80 backdrop-blur-xs border border-[#3d3731] rounded-full flex items-center justify-center text-[#c4b28d] hover:text-white transition-all cursor-pointer z-10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Left Column: Prominent Artwork Display */}
            <div className="w-full md:w-1/2 bg-[#1e1b19] flex items-center justify-center relative p-6 border-b md:border-b-0 md:border-r border-[#3d3731]">
              <div className="relative w-full h-64 md:h-full min-h-[260px] flex items-center justify-center">
                {/* eslint-disable-next-html-element-img */}
                <img src={selectedArt.cover_image_url} alt={selectedArt.title} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-fade-in" />
              </div>
            </div>

            {/* Right Column: Scroll-Contained Framework Desktop Fixed */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col h-[55vh] md:h-[85vh] justify-between overflow-hidden">
              
              {/* Inner Body Content Scroll Area */}
              <div className="space-y-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#3d3731] scrollbar-track-transparent flex-1">
                <div className="space-y-1">
                  <span className="text-[8px] font-sans uppercase tracking-widest text-amber-400/70 border border-amber-500/20 bg-amber-500/5 px-2.5 py-0.5 rounded-full inline-block font-medium">{selectedArt.category} Archive</span>
                  <h2 className="font-serif text-2xl text-white tracking-wide pt-1">{selectedArt.title}</h2>
                  
                  {/* Dynamic Creator Workspace Navigation Link Slug */}
                  <p className="text-xs font-sans text-[#c4b28d]/60">
                    Curated by{" "}
                    <button 
                      onClick={() => router.push(`/author/${selectedArt.author_id}`)}
                      className="text-[#ebdcb9] font-medium font-serif italic hover:text-amber-400 underline decoration-white/10 underline-offset-4 cursor-pointer transition-colors"
                    >
                      {selectedArt.author_name}
                    </button>
                  </p>
                  
                  <div className="flex items-center gap-4 pt-2 text-xs font-sans text-[#c4b28d]/50">
                    <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-red-400 fill-red-400/20" /> {selectedArt.likes?.length || 0} Likes</span>
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> {selectedArt.average_rating || "5.0"} Score</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[9px] font-sans uppercase tracking-widest text-[#c4b28d]/40 font-bold">Artist Statement / Summary</h4>
                  <p className="text-xs font-sans text-[#c4b28d]/80 leading-relaxed font-light bg-[#1e1b19]/40 border border-[#3d3731]/40 p-3 rounded-xl">
                    {selectedArt.summary}
                  </p>
                </div>

                {/* Sub-Collection Critique Thread Container */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-[9px] font-sans uppercase tracking-widest text-[#c4b28d]/40 font-bold">Gallery Annotations ({comments.length})</h4>
                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <p className="text-[11px] font-sans text-[#c4b28d]/30 italic">No appraisal annotations recorded on this piece yet.</p>
                    ) : (
                      comments.map((com) => (
                        <div key={com.id} className="bg-[#1e1b19]/50 border border-[#3d3731]/40 rounded-xl p-2.5 space-y-1 text-xs animate-fade-in">
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

              {/* Bottom Fixed Action Rows */}
              <div className="pt-4 border-t border-[#3d3731] bg-[#2b2723] shrink-0 space-y-3 mt-4">
                {currentUser && (
                  <form onSubmit={handleAddComment} className="flex gap-2 items-center animate-fade-in">
                    <input 
                      type="text" 
                      placeholder="Add public gallery annotation thought notes..." 
                      value={newComment} 
                      onChange={(e) => setNewComment(e.target.value)} 
                      className="flex-1 bg-[#1e1b19] border border-[#3d3731] text-xs font-sans text-[#ebdcb9] outline-none px-3 py-2.5 rounded-xl placeholder:text-white/5" 
                      required 
                    />
                    <select 
                      value={userRating} 
                      onChange={(e) => setUserRating(Number(e.target.value))} 
                      className="bg-[#1e1b19] border border-[#3d3731] text-xs text-amber-400 px-2 py-2.5 rounded-xl outline-none"
                    >
                      {[5, 4, 3, 2, 1].map(num => <option key={num} value={num}>{num} ★</option>)}
                    </select>
                    <button type="submit" className="h-9 w-9 bg-[#ebdcb9]/10 border border-[#3d3731] rounded-xl flex items-center justify-center text-[#ebdcb9] hover:bg-[#ebdcb9] hover:text-[#24211e] transition-all cursor-pointer">
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={(e) => handleLikeToggle(selectedArt, e)} 
                    className={`px-4 bg-[#ebdcb9]/5 border border-[#3d3731] rounded-xl flex items-center justify-center transition-all cursor-pointer ${selectedArt.likes?.includes(currentUser?.uid) ? "text-red-400 border-red-500/20" : "text-[#c4b28d] hover:text-white"}`}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${selectedArt.likes?.includes(currentUser?.uid) ? "fill-current" : ""}`} /> Like Exhibition
                  </button>
                  
                  <button 
                    onClick={() => {
                      setSelectedArt(null);
                      router.push("/");
                    }}
                    className="flex-1 bg-[#ebdcb9] hover:bg-white text-[#24211e] text-[11px] font-sans font-medium uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md text-center cursor-pointer"
                  >
                    Open Library Canvas
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 🎨 LOCAL OVERLAY PUBLISHING WINDOW COMPONENT */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#2b2723] border border-[#3d3731] rounded-[2rem] w-full max-w-xl p-6 md:p-8 space-y-5 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#3d3731] pb-3">
              <h3 className="font-serif text-lg text-white flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-400" /> Exhibit New Artwork</h3>
              <button onClick={() => setShowPublishModal(false)} className="text-[#c4b28d]/40 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            
            <form onSubmit={handlePublishArtPiece} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Composition Title</label>
                  <input type="text" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl px-3 py-2.5 text-sm text-[#ebdcb9] outline-none focus:border-[#c4b28d]/40 placeholder:text-white/5" required />
                </div>
                <div className="space-y-1"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Exhibition Genre Type</label>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl px-3 py-2.5 text-sm text-amber-100/90 outline-none">
                    {ART_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Artist Statement / Context Description</label>
                <textarea rows={3} value={postSummary} onChange={(e) => setPostSummary(e.target.value)} placeholder="Provide contextual details or historical notes behind the creation layers..." className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl px-3 py-2.5 text-sm text-[#ebdcb9] outline-none resize-none placeholder:text-white/5" required />
              </div>

              <div className="space-y-1"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Master Canvas Artwork Image File</label>
                <div className="relative w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl p-4 text-center cursor-pointer hover:bg-[#1e1b19]/80 transition-all">
                  <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 opacity-0 cursor-pointer w-full" required />
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <Upload className="h-5 w-5 text-[#c4b28d]/40" />
                    <span className="text-xs font-sans text-[#c4b28d]/70">{selectedFile ? selectedFile.name : "Select or Drop Visual Artwork Image Asset File"}</span>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={publishing} className="w-full bg-[#ebdcb9] hover:bg-white text-[#24211e] text-xs font-sans font-medium uppercase tracking-wider py-4 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-40">
                {publishing ? "Streaming Visual Asset Channels to Cloud Engine..." : "Broadcast to Public Gallery"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}