import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import ReplyComposer from "./ReplyComposer";
import ReplyItem from "./ReplyItem";

export default function RepliesPanel({ tweetId }) {
  const { user } = useAuth();
  const [replies, setReplies] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "tweets", tweetId, "replies"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
      setReplies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [tweetId]);

  return (
    <div className="stack" style={{ marginTop: "10px" }}>
      {user ? (
        <ReplyComposer tweetId={tweetId} />
      ) : (
        <div className="card small">Log in to reply.</div>
      )}

      {replies.length === 0 ? (
        <div className="card small">No replies yet.</div>
      ) : (
        replies.map((r) => <ReplyItem key={r.id} reply={r} />)
      )}
    </div>
  );
}
