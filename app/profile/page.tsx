"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, orderBy, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { User, Edit3, PlusCircle, BookOpen, Feather, Image as ImageIcon, Star, FileText, X, ArrowLeft, Upload, Heart, MessageSquare, Eye, Send, Sparkles } from "lucide-react";

const CAT_MAP = {
  novel: ["Epic Fantasy", "Sci-Fi Fiction", "Mystery Thriller", "Historical Prose", "Anthology Collection"],
  poem: ["Melancholy", "Romance", "Nature", "Philosophical", "Whimsical", "Classical Verse"],
  art: ["Digital Matte Painting", "Oil on Canvas", "Surrealism Exhibit", "Minimalist Concept", "Classical Renaissance"]
};

export default function ProfileCanvas() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publications, setPublications] = useState<any[]>([]);

  // Modal Screen Toggles
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<any>(null);

  // Edit Profile Form State
  const [penName, setPenName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profilePicUploading, setProfilePicUploading] = useState(false);

  // Create Post Form State
  const [postType, setPostType] = useState<"novel" | "poem" | "art">("novel");
  const [postTitle, setPostTitle] = useState("");
  const [postSummary, setPostSummary] = useState("");
  const [poemContent, setPoemContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Epic Fantasy");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Review System Content Thread States
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userRating, setUserRating] = useState(5);

  // 🛡️ ENHANCED LIFECYCLE AUTH GUARD TO KILL INFINITE LOADING SCREEN TRAPS
  useEffect(() => {
    if (auth.currentUser) {
      setCurrentUser(auth.currentUser);
      fetchProfileData(auth.currentUser);
      fetchUserPublications(auth.currentUser.uid);
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth");
      } else {
        setCurrentUser(user);
        await fetchProfileData(user);
        await fetchUserPublications(user.uid);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    setSelectedCategory(CAT_MAP[postType][0]);
  }, [postType]);

  const fetchProfileData = async (userInstance: any) => {
    const docRef = doc(db, "users", userInstance.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setPenName(data.name || userInstance.displayName || "");
      setBio(data.bio || "");
      setAvatarUrl(data.profilePic || userInstance.photoURL || "");
    } else {
      setPenName(userInstance.displayName || "");
      setAvatarUrl(userInstance.photoURL || "");
    }
  };

  const fetchUserPublications = async (uid: string) => {
    try {
      const q = query(collection(db, "publications"), where("author_id", "==", uid), orderBy("created_at", "desc"));
      const querySnapshot = await getDocs(q);
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, likes: [], ...doc.data() });
      });
      setPublications(items);
    } catch (err) {
      console.error("Error drawing personal records registry index:", err);
    }
  };

  const fetchComments = async (pubId: string) => {
    try {
      const commentsSnapshot = await getDocs(query(collection(db, `publications/${pubId}/reviews`), orderBy("created_at", "desc")));
      const items: any[] = [];
      commentsSnapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setComments(items);
    } catch (err) {
      console.error("Error reading portfolio marginalia reviews:", err);
    }
  };

  const handleOpenInspector = (pub: any) => {
    setSelectedPublication(pub);
    fetchComments(pub.id);
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "irubee_preset");
    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dovq341qc"}/upload`, { method: "POST", body: formData });
    if (!response.ok) throw new Error("Cloud media network pipeline transmission failure.");
    const data = await response.json();
    return data.secure_url;
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    setProfilePicUploading(true);
    try {
      const newAvatarUrl = await uploadToCloudinary(file);
      setAvatarUrl(newAvatarUrl);
    } catch (err: any) {
      alert(`Avatar cloud storage sync failure: ${err.message}`);
    } finally {
      setProfilePicUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    await setDoc(doc(db, "users", currentUser.uid), { name: penName, bio, profilePic: avatarUrl, email: currentUser.email, uid: currentUser.uid }, { merge: true });
    setShowEditProfile(false);
    fetchProfileData(currentUser);
  };

  const handlePublishContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedFile) return alert("Required primary visual media file attachment is missing.");
    if (postType === "novel" && !selectedPdfFile) return alert("A structural manuscript text PDF document is required for novels.");
    setUploading(true);

    try {
      const primaryMediaUrl = await uploadToCloudinary(selectedFile);
      let dynamicPdfUrl = null;

      if (postType === "novel" && selectedPdfFile) {
        dynamicPdfUrl = await uploadToCloudinary(selectedPdfFile);
      }

      const publicationPayload = {
        author_id: currentUser.uid,
        author_name: penName || currentUser.displayName || "Anonymous Creator",
        title: postTitle,
        type: postType,
        summary: postSummary,
        category: selectedCategory,
        cover_image_url: primaryMediaUrl,
        pdf_url: dynamicPdfUrl,
        poem_content: postType === "poem" ? poemContent : null,
        created_at: new Date().toISOString(),
        likes: [],
        average_rating: 5.0,
        total_reviews: 0
      };

      await addDoc(collection(db, "publications"), publicationPayload);
      
      setPostTitle(""); setPostSummary(""); setPoemContent(""); setSelectedFile(null); setSelectedPdfFile(null);
      setShowCreatePost(false);
      fetchUserPublications(currentUser.uid);
    } catch (err: any) {
      alert(`Publishing operations interrupted: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleLikeToggle = async (pub: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    const pubRef = doc(db, "publications", pub.id);
    const isLiked = pub.likes?.includes(currentUser.uid);

    try {
      await updateDoc(pubRef, { likes: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) });
      const updated = publications.map(p => {
        if (p.id === pub.id) {
          const newLikes = isLiked ? p.likes.filter((uid: string) => uid !== currentUser.uid) : [...p.likes, currentUser.uid];
          return { ...p, likes: newLikes };
        }
        return p;
      });
      setPublications(updated);
      if (selectedPublication?.id === pub.id) {
        setSelectedPublication({ ...selectedPublication, likes: isLiked ? selectedPublication.likes.filter((uid: string) => uid !== currentUser.uid) : [...selectedPublication.likes, currentUser.uid] });
      }
    } catch (err) {
      console.error("Interaction save sequence error:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;

    const commentPayload = { user_id: currentUser.uid, user_name: penName || currentUser.displayName || "Anonymous", rating: userRating, comment: newComment, created_at: new Date().toISOString() };

    try {
      await addDoc(collection(db, `publications/${selectedPublication.id}/reviews`), commentPayload);
      const pubRef = doc(db, "publications", selectedPublication.id);
      const updatedReviewsCount = (selectedPublication.total_reviews || 0) + 1;
      const updatedAvgRating = parseFloat((((selectedPublication.average_rating || 5) * (selectedPublication.total_reviews || 0) + userRating) / updatedReviewsCount).toFixed(1));
      
      await updateDoc(pubRef, { total_reviews: updatedReviewsCount, average_rating: updatedAvgRating });
      setNewComment("");
      fetchComments(selectedPublication.id);
      fetchUserPublications(currentUser.uid);
      setSelectedPublication({ ...selectedPublication, total_reviews: updatedReviewsCount, average_rating: updatedAvgRating });
    } catch (err) {
      console.error("Critique line deployment sequence failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#24211e] text-[#ebdcb9] flex flex-col selection:bg-[#ebdcb9]/10 selection:text-[#ebdcb9]">
      
      {/* HEADER COMPACT HUB */}
      <header className="border-b border-[#3d3731] bg-[#2b2723]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-xs font-sans text-[#c4b28d] hover:text-[#ebdcb9] transition-all cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Back to Sanctuary
        </button>
        <span className="font-serif text-base tracking-widest text-white/40">Author Studio</span>
      </header>

      {/* RENDER VIEW SWITCH CONTAINER */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#24211e]">
          <div className="text-xl font-serif text-[#ebdcb9] tracking-widest animate-pulse">Synchronizing Studio Portfolios...</div>
        </div>
      ) : (
        <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 space-y-12 animate-fade-in">
          
          {/* UPPER AUTHOR IDENTITY PROFILE CARD */}
          <div className="bg-[#2b2723] border border-[#3d3731] rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="h-24 w-24 rounded-full bg-[#1e1b19] border-2 border-[#3d3731] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {avatarUrl ? (
                  // eslint-disable-next-html-element-img
                  <img src={avatarUrl} alt="Author Portrait Avatar" className="h-full w-full object-cover animate-fade-in" />
                ) : (
                  <User className="h-10 w-10 text-[#c4b28d]/30" />
                )}
              </div>
              <div className="space-y-1.5">
                <h2 className="text-3xl font-serif tracking-wide text-white">{penName || "Unnamed Identity"}</h2>
                <p className="text-xs font-sans text-amber-400/60 tracking-wider uppercase font-medium">Verified Curator</p>
                <p className="text-sm font-sans text-[#c4b28d]/70 max-w-md leading-relaxed">{bio || "This signature field contains no autobiographical records yet. Select Edit to modify details."}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-center">
              <button onClick={() => setShowEditProfile(true)} className="flex items-center justify-center gap-2 bg-[#ebdcb9]/5 border border-[#3d3731] hover:bg-[#ebdcb9]/10 text-xs font-sans tracking-wide text-[#c4b28d] px-4 py-3 rounded-xl transition-all cursor-pointer w-1/2 md:w-auto">
                <Edit3 className="h-3.5 w-3.5" /> Edit Profile
              </button>
              <button onClick={() => setShowCreatePost(true)} className="flex items-center justify-center gap-2 bg-[#ebdcb9] hover:bg-white text-[#24211e] text-xs font-sans font-medium tracking-wide px-5 py-3 rounded-xl transition-all cursor-pointer w-1/2 md:w-auto shadow-md">
                <PlusCircle className="h-3.5 w-3.5" /> Post Creation
              </button>
            </div>
          </div>

          {/* INSTAGRAM-STYLE PORTFOLIO GRID GALLERY */}
          <div className="space-y-6">
            <div className="border-b border-[#3d3731] pb-3">
              <h3 className="font-serif text-xl tracking-wide text-white">Your Published Collections ({publications.length})</h3>
            </div>

            {publications.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-[#3d3731] rounded-[2rem] space-y-2">
                <FileText className="h-8 w-8 text-[#c4b28d]/20 mx-auto" />
                <p className="text-sm font-sans text-[#c4b28d]/40">Your archive directory holds no dynamic manifests at present.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {publications.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleOpenInspector(item)}
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
                      <p className="text-[11px] font-sans text-[#c4b28d]/50 truncate">{item.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      {/* MODAL 1: ACCOUNT DETAIL MODIFICATIONS */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#2b2723] border border-[#3d3731] rounded-[2rem] w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-white">Adjust Signature Details</h3>
              <button onClick={() => setShowEditProfile(false)} className="text-[#c4b28d]/40 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-2 py-2 bg-[#1e1b19] border border-[#3d3731] rounded-2xl p-4">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-[#24211e] border border-[#3d3731] relative flex items-center justify-center shadow-inner">
                  {avatarUrl ? (
                    // eslint-disable-next-html-element-img
                    <img src={avatarUrl} alt="Preview portrait" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-[#c4b28d]/20" />
                  )}
                  {profilePicUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] font-sans text-[#ebdcb9] tracking-widest text-center animate-pulse">
                      Processing...
                    </div>
                  )}
                </div>
                
                <label className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ebdcb9]/5 border border-[#3d3731] hover:bg-[#ebdcb9]/10 text-[10px] font-sans font-medium uppercase tracking-wider text-[#c4b28d] transition-all cursor-pointer">
                  <Upload className="h-3 w-3" />
                  <span>Upload Profile Photo</span>
                  <input type="file" accept="image/*" disabled={profilePicUploading} onChange={handleAvatarFileChange} className="hidden" />
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Pen Name</label>
                <input type="text" value={penName} onChange={(e) => setPenName(e.target.value)} className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl px-3 py-2.5 text-sm text-[#ebdcb9] outline-none" required />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Autobiographical Bio</label>
                <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl px-3 py-2.5 text-sm text-[#ebdcb9] outline-none resize-none" />
              </div>
              
              <button type="submit" disabled={profilePicUploading} className="w-full bg-[#ebdcb9] text-[#24211e] text-xs font-sans font-medium uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-40">
                Commit Records
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: HARMONIZED MULTI-FORMAT CREATION HUB */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#2b2723] border border-[#3d3731] rounded-[2rem] w-full max-w-lg p-6 space-y-5 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#3d3731] pb-3">
              <h3 className="font-serif text-lg text-white flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-amber-400" /> Broadcast New Composition</h3>
              <button onClick={() => setShowCreatePost(false)} className="text-[#c4b28d]/40 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#1e1b19] rounded-xl border border-[#3d3731]">
              {(["novel", "poem", "art"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setPostType(t)} className={`py-1.5 rounded-lg text-xs font-sans tracking-wide capitalize transition-all cursor-pointer ${postType === t ? "bg-[#3d3731] text-white" : "text-[#c4b28d]/40 hover:text-[#c4b28d]"}`}>{t}</button>
              ))}
            </div>

            <form onSubmit={handlePublishContent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Composition Title</label>
                  <input type="text" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl px-3 py-2.5 text-sm text-[#ebdcb9] outline-none" required />
                </div>
                <div className="space-y-1"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Catalog Category</label>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl px-3 py-2.5 text-sm text-amber-100/90 outline-none">
                    {CAT_MAP[postType].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Synopsis / Summary Manifesto</label>
                <textarea rows={2} value={postSummary} onChange={(e) => setPostSummary(e.target.value)} className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl px-3 py-2.5 text-sm text-[#ebdcb9] outline-none resize-none placeholder:text-white/5" placeholder="Brief textual index synopsis overview..." required />
              </div>

              {postType === "poem" && (
                <div className="space-y-1"><label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Poetic Verses (Preserve Spacing Breaks)</label>
                  <textarea rows={5} value={poemContent} onChange={(e) => setPoemContent(e.target.value)} placeholder="Type or paste stanzas cleanly here..." className="w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl px-3 py-2.5 text-sm font-serif text-[#ebdcb9] outline-none whitespace-pre" required />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">
                    {postType === "art" ? "Master Artwork Asset Image" : "Exhibition Front Cover Image"}
                  </label>
                  <div className="relative w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl p-3 text-center cursor-pointer hover:bg-[#1e1b19]/80 transition-all">
                    <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 opacity-0 cursor-pointer w-full" required />
                    <Upload className="h-4 w-4 text-[#c4b28d]/40 mx-auto mb-1" />
                    <span className="text-[11px] font-sans text-[#c4b28d]/60 block truncate">{selectedFile ? selectedFile.name : "Select JPEG graphic"}</span>
                  </div>
                </div>

                {postType === "novel" && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="text-[10px] font-sans uppercase tracking-widest text-[#c4b28d]">Manuscript Text Document (PDF)</label>
                    <div className="relative w-full bg-[#1e1b19] border border-[#3d3731] rounded-xl p-3 text-center cursor-pointer hover:bg-[#1e1b19]/80 transition-all">
                      <input type="file" accept="application/pdf" onChange={(e) => setSelectedPdfFile(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 opacity-0 cursor-pointer w-full" required />
                      <Upload className="h-4 w-4 text-[#c4b28d]/40 mx-auto mb-1" />
                      <span className="text-[11px] font-sans text-[#c4b28d]/60 block truncate">{selectedPdfFile ? selectedPdfFile.name : "Attach Text PDF"}</span>
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={uploading} className="w-full bg-[#ebdcb9] hover:bg-white text-[#24211e] text-xs font-sans font-medium uppercase tracking-wider py-4 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-40">
                {uploading ? "Streaming Data Layers to Cloud Engine..." : "Commit and Publish Content"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EXPANSIVE SPLIT-CANVAS PORTFOLIO ASSET INSPECTOR WITH ACTIVE FEEDBACK THREADS */}
      {selectedPublication && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 z-50 animate-fade-in">
          <div className="bg-[#2b2723] border border-[#3d3731] rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]">
            
            <button onClick={() => setSelectedPublication(null)} className="absolute top-4 right-4 h-8 w-8 bg-[#1e1b19]/80 backdrop-blur-xs border border-[#3d3731] rounded-full flex items-center justify-center text-[#c4b28d] hover:text-white transition-all cursor-pointer z-10"><X className="h-4 w-4" /></button>

            {/* Left Column Graphic Display Wrapper */}
            <div className="w-full md:w-1/2 bg-[#1e1b19] flex items-center justify-center relative p-6 border-b md:border-b-0 md:border-r border-[#3d3731]">
              <div className="relative aspect-[3/4] w-full max-w-[280px] flex items-center justify-center shadow-2xl rounded-xl overflow-hidden border border-[#3d3731]">
                {/* eslint-disable-next-html-element-img */}
                <img src={selectedPublication.cover_image_url} alt={selectedPublication.title} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Right Column Detailed Social Context Content Engine Panel */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col h-full overflow-y-auto justify-between max-h-[50vh] md:max-h-full">
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[8px] font-sans uppercase tracking-widest text-amber-400/70 border border-amber-500/20 bg-amber-500/5 px-2.5 py-0.5 rounded-full inline-block font-medium">
                    {selectedPublication.category} • {selectedPublication.type}
                  </span>
                  <h2 className="font-serif text-2xl text-white tracking-wide pt-1">{selectedPublication.title}</h2>
                  <p className="text-xs font-sans text-[#c4b28d]/60">Authored by <span className="text-[#ebdcb9] font-medium font-serif italic">{selectedPublication.author_name}</span></p>
                  
                  <div className="flex items-center gap-4 pt-2 text-xs font-sans text-[#c4b28d]/50">
                    <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-red-400 fill-red-400/20" /> {selectedPublication.likes?.length || 0} Likes</span>
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> {selectedPublication.average_rating || "5.0"} Score</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[9px] font-sans uppercase tracking-widest text-[#c4b28d]/40 font-bold">Synopsis</h4>
                  <p className="text-xs font-sans text-[#c4b28d]/80 leading-relaxed bg-[#1e1b19]/30 border border-[#3d3731]/40 p-3 rounded-xl">{selectedPublication.summary}</p>
                </div>

                {selectedPublication.type === "poem" && selectedPublication.poem_content && (
                  <div className="space-y-2 animate-fade-in">
                    <h4 className="text-[9px] font-sans uppercase tracking-widest text-[#c4b28d]/40 font-bold">Poetic Stanzas Preview</h4>
                    <div className="text-xs font-serif text-[#ebdcb9]/90 leading-relaxed bg-[#1e1b19]/60 border border-[#3d3731] p-3 rounded-xl max-h-32 overflow-y-auto whitespace-pre italic">{selectedPublication.poem_content}</div>
                  </div>
                )}

                {/* Live Comments / Reviews List Panel */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-[9px] font-sans uppercase tracking-widest text-[#c4b28d]/40 font-bold">Margin Annotations ({comments.length})</h4>
                  <div className="space-y-2.5 max-h-32 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <p className="text-[11px] font-sans text-[#c4b28d]/30 italic">No appraisal notations recorded on this piece yet.</p>
                    ) : (
                      comments.map((com) => (
                        <div key={com.id} className="bg-[#1e1b19]/50 border border-[#3d3731]/40 rounded-xl p-2.5 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[11px] text-[#c4b28d]/60">
                            <span className="font-serif text-white/80 font-medium">{com.user_name}</span>
                            <div className="flex items-center gap-0.5 text-amber-400">
                              <Star className="h-2.5 w-2.5 fill-current" />
                              <span>{com.rating}</span>
                            </div>
                          </div>
                          <p className="text-[#c4b28d]/80 font-sans leading-relaxed">{com.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Interaction Form Row Inputs */}
              <div className="pt-4 border-t border-[#3d3731] mt-6 space-y-3">
                {currentUser && (
                  <form onSubmit={handleAddComment} className="flex gap-2 items-center">
                    <input type="text" placeholder="Add a public validation thread comment note..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 bg-[#1e1b19] border border-[#3d3731] text-xs font-sans text-[#ebdcb9] outline-none px-3 py-2.5 rounded-xl placeholder:text-white/5" required />
                    <select value={userRating} onChange={(e) => setUserRating(Number(e.target.value))} className="bg-[#1e1b19] border border-[#3d3731] text-xs text-amber-400 px-2 py-2.5 rounded-xl outline-none">
                      {[5, 4, 3, 2, 1].map(num => <option key={num} value={num}>{num} ★</option>)}
                    </select>
                    <button type="submit" className="h-9 w-9 bg-[#ebdcb9]/10 border border-[#3d3731] rounded-xl flex items-center justify-center text-[#ebdcb9] hover:bg-[#ebdcb9] hover:text-[#24211e] transition-all cursor-pointer"><Send className="h-3.5 w-3.5" /></button>
                  </form>
                )}

                <div className="flex gap-3">
                  <button onClick={(e) => handleLikeToggle(selectedPublication, e)} className={`px-4 bg-[#ebdcb9]/5 border border-[#3d3731] rounded-xl flex items-center justify-center transition-all cursor-pointer ${selectedPublication.likes?.includes(currentUser?.uid) ? "text-red-400 border-red-500/20" : "text-[#c4b28d] hover:text-white"}`}><Heart className={`h-4 w-4 mr-2 ${selectedPublication.likes?.includes(currentUser?.uid) ? "fill-current" : ""}`} /> Like Creation</button>
                  <button 
                    onClick={() => {
                      // Correctly maps 'art' to your specialized folder layout path '/artworks'
                      const targetRoute = selectedPublication.type === "art" ? "artworks" : `${selectedPublication.type}s`;
                      router.push(`/${targetRoute}`);
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

    </div>
  );
}