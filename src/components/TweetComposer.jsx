import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import ImageUploader from "./ImageUploader";

export default function TweetComposer() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState(null);
  const [imageURL, setImageURL] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!user) return setProfile(null);
      const snap = await getDoc(doc(db, "users", user.uid));
      setProfile(snap.exists() ? snap.data() : null);
    }
    loadProfile();
  }, [user]);

  async function post() {
    if (!user) return alert("Log in first.");
    if (!profile)
      return alert("Profile still loading — try again in a second.");
    const trimmed = text.trim();
    if (!trimmed && !imageURL) return;

    setBusy(true);
    try {
      await addDoc(collection(db, "tweets"), {
        uid: user.uid,
        handle: profile?.handle || "unknown",
        displayName: profile?.displayName || "Unknown",
        photoURL: profile?.photoURL || "",
        text: trimmed,
        textLower: trimmed.toLowerCase(),
        imageURL: imageURL || "",
        createdAt: serverTimestamp(),
        likeCount: 0,
        replyCount: 0,
        retweetCount: 0,
        originalTweetId: "",
      });
      setText("");
      setImageURL("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <textarea
        className="input"
        rows={3}
        placeholder="What’s happening?"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <ImageUploader onUploaded={(url) => setImageURL(url)} />

        <button className="btn" onClick={post} disabled={busy || !profile}>
          {busy ? "Posting..." : !profile ? "Loading profile..." : "Post"}
        </button>
      </div>

      {imageURL && (
        <div style={{ marginTop: 10 }}>
          <div className="small">Attached image:</div>
          <img
            src={imageURL}
            alt="tweet"
            style={{ width: "100%", borderRadius: 12, marginTop: 6 }}
          />
        </div>
      )}
    </div>
  );
}
