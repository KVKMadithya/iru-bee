"use client";

import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, orderBy, addDoc, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Star, BookOpen, X, Heart, Compass, Upload, Plus, Sparkles, Send, ChevronLeft, ChevronRight, Search, SlidersHorizontal, Trash2 } from "lucide-react";

// Use relative path to find your component
const PDFViewer = dynamic(() => import('../../components/PDFViewer'), { ssr: false });

export default function NovelsLibrary() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [novels, setNovels] = useState<any[]>([]);
  const [filteredNovels, setFilteredNovels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("all");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState<any>(null);
  const [activeReadingNovel, setActiveReadingNovel] = useState<any>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userRating, setUserRating] = useState(5);
  const libraryRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    fetchNovels();
    return () => unsubscribe();
  }, []);

  const fetchNovels = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "publications"), where("type", "==", "novel"), orderBy("created_at", "desc"));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setNovels(items);
      setFilteredNovels(items);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchComments = async (novelId: string) => {
    try {
      const q = query(collection(db, `publications/${novelId}/reviews`), orderBy("created_at", "desc"));
      const snapshot = await getDocs(q);
      setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
  };

  const handleDeleteNovel = async () => {
    if (!selectedNovel || selectedNovel.author_id !== currentUser?.uid) return;
    if (confirm("Delete this manuscript? Permanent action.")) {
      await deleteDoc(doc(db, "publications", selectedNovel.id));
      setSelectedNovel(null);
      fetchNovels();
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "irubee_preset");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dovq341qc"}/upload`, { method: "POST", body: formData });
    const data = await res.json();
    return data.secure_url;
  };

  const handlePublishNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedCoverFile || !selectedPdfFile) return;
    setPublishing(true);
    try {
      const [coverUrl, pdfUrl] = await Promise.all([uploadToCloudinary(selectedCoverFile), uploadToCloudinary(selectedPdfFile)]);
      await addDoc(collection(db, "publications"), {
        author_id: currentUser.uid, author_name: currentUser.displayName || "Anonymous",
        title, summary, cover_image_url: coverUrl, pdf_url: pdfUrl, type: "novel", 
        created_at: new Date().toISOString(), likes: [], average_rating: 5.0, total_reviews: 0
      });
      setShowPublishModal(false);
      fetchNovels();
    } finally { setPublishing(false); }
  };

  const handleLikeToggle = async (novel: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const novelRef = doc(db, "publications", novel.id);
    const isLiked = novel.likes?.includes(currentUser.uid);
    await updateDoc(novelRef, { likes: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) });
    fetchNovels();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, `publications/${selectedNovel.id}/reviews`), {
      user_id: currentUser.uid, user_name: currentUser.displayName, rating: userRating, comment: newComment, created_at: new Date().toISOString()
    });
    setNewComment("");
    fetchComments(selectedNovel.id);
  };

  return (
    <div className="min-h-screen bg-[#24211e] text-[#ebdcb9] flex flex-col">
      <header className="border-b border-[#3d3731] bg-[#2b2723]/80 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => router.push("/")} className="text-xs text-[#c4b28d] flex items-center gap-2 hover:text-white"><ArrowLeft className="h-4 w-4" /> Return</button>
        <button onClick={() => setShowPublishModal(true)} className="bg-[#ebdcb9] text-[#24211e] px-4 py-2 rounded-lg text-[10px] font-bold uppercase">Publish Novel</button>
      </header>

      {/* Hero 3D Reel */}
      {!loading && (
        <section className="relative w-full h-[60vh] bg-[#191715] border-b border-[#3d3731] flex items-center overflow-x-auto gap-6 px-10">
          {novels.slice(0, 5).map((n) => (
             <div key={n.id} onClick={() => { setSelectedNovel(n); fetchComments(n.id); }} className="w-72 flex-shrink-0 cursor-pointer">
               <img src={n.cover_image_url} className="w-full aspect-[3/4] object-cover rounded-2xl" />
               <h3 className="mt-2 font-serif text-lg">{n.title}</h3>
             </div>
          ))}
        </section>
      )}

      {/* Library Grid */}
      <main ref={libraryRef} className="p-10 grid grid-cols-4 gap-6">
        {filteredNovels.map((novel) => (
          <div key={novel.id} onClick={() => { setSelectedNovel(novel); fetchComments(novel.id); }} className="bg-[#2b2723] p-4 rounded-2xl cursor-pointer border border-[#3d3731]">
            <img src={novel.cover_image_url} className="aspect-[3/4] object-cover rounded-lg" />
            <h4 className="mt-4 font-serif">{novel.title}</h4>
          </div>
        ))}
      </main>

      {/* Modal & Reader Code Remains the same as provided previously, integrated here... */}
      {selectedNovel && !activeReadingNovel && (
         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
           <div className="bg-[#2b2723] rounded-3xl w-full max-w-2xl p-8 relative flex gap-6">
             <button onClick={() => setSelectedNovel(null)} className="absolute top-4 right-4"><X /></button>
             <img src={selectedNovel.cover_image_url} className="w-40 h-56 object-cover rounded-lg" />
             <div className="flex-1">
               <h2 className="text-2xl font-serif">{selectedNovel.title}</h2>
               <p className="text-sm my-4">{selectedNovel.summary}</p>
               <div className="flex gap-2">
                 <button onClick={() => setActiveReadingNovel(selectedNovel)} className="bg-[#ebdcb9] text-[#24211e] px-6 py-2 rounded-lg font-bold">Read</button>
                 {currentUser?.uid === selectedNovel.author_id && (
                   <button onClick={handleDeleteNovel} className="bg-red-900/50 text-red-200 px-4 py-2 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                 )}
               </div>
             </div>
           </div>
         </div>
      )}

      {activeReadingNovel && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <header className="p-4 flex justify-between"><button onClick={() => setActiveReadingNovel(null)}><X /></button> <span>{currentPageIndex + 1} / {totalPages}</span></header>
            <div className="flex-1 flex justify-center items-center">
              <div className="w-full max-w-md aspect-[1:1.4] bg-white rounded-xl overflow-hidden shadow-2xl">
                <PDFViewer url={activeReadingNovel.pdf_url} currentPage={currentPageIndex} onTotalPages={setTotalPages} />
              </div>
            </div>
            <div className="p-6 flex justify-center gap-4">
                <button onClick={() => setCurrentPageIndex(p => Math.max(0, p - 1))} className="p-4 bg-white/10 rounded-full"><ChevronLeft /></button>
                <button onClick={() => setCurrentPageIndex(p => Math.min(totalPages - 1, p + 1))} className="p-4 bg-white/10 rounded-full"><ChevronRight /></button>
            </div>
        </div>
      )}
    </div>
  );
}