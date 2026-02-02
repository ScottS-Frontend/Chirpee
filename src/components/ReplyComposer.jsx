import { useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

export default function ReplyComposer({ tweetId }) {
  const { user } = useAuth();

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function postReply() {
    if (!user) return alert("Log in to reply.");

    const trimmed = text.trim();
    if (!trimmed) return;

    if (busy) return;
    setBusy(true);

    try {
      // Grab profile for handle/displayName so replies are consistent
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const profile = userSnap.exists() ? userSnap.data() : null;

      const repliesRef = collection(db, "tweets", tweetId, "replies");

      await addDoc(repliesRef, {
        text: trimmed,
        uid: user.uid,
        handle: profile?.handle || "unknown",
        displayName: profile?.displayName || "User",
        photoURL: profile?.photoURL || "",
        createdAt: serverTimestamp(),
      });

      // increment replyCount on parent tweet
      const tweetRef = doc(db, "tweets", tweetId);
      await updateDoc(tweetRef, { replyCount: increment(1) });

      setText("");
    } catch (e) {
      console.error("REPLY FAILED:", e);
      alert(e?.message || "Reply failed. Check console.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ padding: "12px" }}>
      <textarea
        className="input"
        rows={3}
        placeholder="Write a reply…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={280}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
        <div className="small">{text.length}/280</div>
        <button className="btn" onClick={postReply} disabled={busy}>
          {busy ? "Posting…" : "Reply"}
        </button>
      </div>
    </div>
  );
}
