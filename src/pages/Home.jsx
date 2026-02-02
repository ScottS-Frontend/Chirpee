import { useEffect, useState, useRef } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import TweetComposer from "../components/TweetComposer";
import TweetItem from "../components/TweetItem";
import { useAuth } from "../context/AuthContext";
import LoadingBird from "../components/LoadingBird";
import useMinLoading from "../hooks/useMinLoading";

export default function Home() {
  const { user } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [Loading, setLoading] = useState(true);
  const loadStartRef = useRef(Date.now());
  const finishLoading = useMinLoading(800);

  useEffect(() => {
    const q = query(
      collection(db, "tweets"),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setTweets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

        const MIN_LOAD = 800;

        const elapsed = Date.now() - loadStartRef.current;
        const remaining = Math.max(0, MIN_LOAD - elapsed);

        setTimeout(() => setLoading(false), remaining);
      },
      (err) => {
        console.error("HOME FEED ERROR:", err);

        const MIN_LOAD = 800;
        const elapsed = Date.now() - loadStartRef.current;
        const remaining = Math.max(0, MIN_LOAD - elapsed);

        setTimeout(() => setLoading(false), remaining);
      },
    );

    return () => unsub();
  }, []);

  if (Loading) {
    return (
      <div className="stack">
        <LoadingBird label="Loading tweets…" />
      </div>
    );
  }

  return (
    <div className="stack">
      {user && <TweetComposer />}
      {!user && (
        <div className="card">
          <div style={{ fontWeight: 900 }}>Welcome to Chirpee</div>
          <div className="small">Log in to post, like, and follow.</div>
        </div>
      )}
      {tweets.map((t) => (
        <TweetItem key={t.id} tweet={t} />
      ))}
    </div>
  );
}
