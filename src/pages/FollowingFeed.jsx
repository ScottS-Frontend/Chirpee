import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebase";
import { collection, getDocs, query, limit, where, orderBy } from "firebase/firestore";
import TweetItem from "../components/TweetItem";

export default function FollowingFeed() {
  const { user } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    async function load() {
      if (!user) return;

      const followingRef = collection(db, "users", user.uid, "following");
      const snap = await getDocs(followingRef);

      const uids = snap.docs.map((d) => d.id);

      if (uids.length === 0) {
        setTweets([]);
        setNote("You're not following anyone yet.");
        return;
      }

      const limited = uids.slice(0, 10);
      setNote(uids.length > 10 ? "Showing a feed from your first 10 follows (tutorial limit)." : "");

      const tq = query(
        collection(db, "tweets"),
        where("uid", "in", limited),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const tSnap = await getDocs(tq);
      setTweets(tSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }

    load();
  }, [user]);

  return (
    <div className="stack">
      <div className="card">
        <div style={{ fontWeight: 900 }}>Following Feed</div>
        {note && <div className="small">{note}</div>}
      </div>

      {tweets.map((t) => (
        <TweetItem key={t.id} tweet={t} />
      ))}
    </div>
  );
}
