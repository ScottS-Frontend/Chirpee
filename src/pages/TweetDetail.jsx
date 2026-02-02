import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";
import TweetItem from "../components/TweetItem";
import RepliesPanel from "../components/RepliesPanel";
import LoadingBird from "../components/LoadingBird";
import useMinLoading from "../hooks/useMinLoading";

export default function TweetDetail() {
  const { tweetId } = useParams();
  const [tweet, setTweet] = useState(null);
  const [loading, setLoading] = useState(true);
  const finishLoading = useMinLoading(800);

  useEffect(() => {
    if (!tweetId) return;

    const tweetRef = doc(db, "tweets", tweetId);

    const unsub = onSnapshot(
      tweetRef,
      (snap) => {
        if (!snap.exists()) {
          setTweet(null);
          finishLoading(setLoading);

          return;
        }
        setTweet({ id: snap.id, ...snap.data() });
        finishLoading(setLoading);
      },
      (err) => {
        console.error("TWEET DETAIL ERROR:", err);
        finishLoading(setLoading);
      },
    );

    return () => unsub();
  }, [tweetId]);

  if (loading) {
    return (
      <div className="stack">
        <LoadingBird label="Loading tweet…" />
      </div>
    );
  }

  if (!tweet) {
    return (
      <div className="stack">
        <div className="card">Tweet not found.</div>
        <Link className="small" to="/">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link className="small" to="/">
          ← Back
        </Link>
        <div className="small">Tweet</div>
      </div>

      <TweetItem tweet={tweet} showReplyToggle={false} />

      {/* Always show replies on the detail page */}
      <RepliesPanel tweetId={tweet.id} />
    </div>
  );
}
