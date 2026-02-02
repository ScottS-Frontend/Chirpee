import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  increment,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

export default function LikeButton({ tweetId }) {
  const { user } = useAuth();

  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  // 🔥 Real-time listener: does THIS user like THIS tweet?
  useEffect(() => {
    if (!user) {
      setLiked(false);
      return;
    }

    const likeRef = doc(db, "tweets", tweetId, "likes", user.uid);

    const unsub = onSnapshot(likeRef, (snap) => {
      setLiked(snap.exists());
    });

    return () => unsub();
  }, [user, tweetId]);

  async function toggle() {
    if (!user) return alert("Log in to like.");
    if (busy) return;

    setBusy(true);

    try {
      const likeRef = doc(db, "tweets", tweetId, "likes", user.uid);
      const tweetRef = doc(db, "tweets", tweetId);

      if (liked) {
        // ❤️ → remove like
        await deleteDoc(likeRef);

        await updateDoc(tweetRef, {
          likeCount: increment(-1),
        });

        setLiked(false);
      } else {
        // 🤍 → add like
        await setDoc(likeRef, {
          createdAt: serverTimestamp(),
        });

        await updateDoc(tweetRef, {
          likeCount: increment(1),
        });

        setLiked(true);
      }
    } catch (e) {
      console.error("LIKE FAILED:", e);
      alert("Like failed. Check console.");
    } finally {
      setBusy(false);
    }
  }

  return (
  <button
    className="btn secondary"
    onClick={toggle}
    disabled={busy}
    title={liked ? "Unlike" : "Like"}
    style={{
      fontSize: "18px",
      display: "flex",
      alignItems: "center",
      gap: "6px"
    }}
  >
    {busy ? "…" : (
      <span
        className={`chirpee-heart ${liked ? "is-liked" : ""}`}
        style={{ color: liked ? "#ff3040" : "#aaa" }}
      >
        {liked ? "❤️" : "🤍"}
      </span>
    )}
  </button>
);
}
