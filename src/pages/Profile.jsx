import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import TweetItem from "../components/TweetItem";
import LoadingBird from "../components/LoadingBird";

export default function Profile() {
  const { handle } = useParams();
  const [profile, setProfile] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!handle) return;

    setLoading(true);
    setProfile(null);
    setTweets([]);

    // 1) Find user by handle
    async function loadProfileAndTweets() {
      try {
        const qUser = query(
          collection(db, "users"),
          where("handle", "==", handle.toLowerCase()),
          limit(1)
        );

        const userSnap = await getDocs(qUser);
        if (userSnap.empty) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const userDoc = userSnap.docs[0];
        const userData = userDoc.data();
        const uid = userData.uid || userDoc.id;

        setProfile({ id: userDoc.id, ...userData, uid });

        // 2) Live tweets for that user
        const qTweets = query(
          collection(db, "tweets"),
          where("uid", "==", uid),
          orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(
          qTweets,
          (snap) => {
            setTweets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
          },
          (err) => {
            console.error("PROFILE TWEETS ERROR:", err);
            setLoading(false);
          }
        );

        return unsub;
      } catch (err) {
        console.error("PROFILE LOAD ERROR:", err);
        setLoading(false);
      }
    }

    let unsubTweets;
    loadProfileAndTweets().then((unsub) => {
      unsubTweets = unsub;
    });

    return () => {
      if (typeof unsubTweets === "function") unsubTweets();
    };
  }, [handle]);

  if (loading) {
    return (
      <div className="stack">
        <Link className="small" to="/">
          ← Back
        </Link>
        <LoadingBird label="Loading profile…" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="stack">
        <div className="card">User not found.</div>
        <Link className="small" to="/">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <Link className="small" to="/">
        ← Back
      </Link>

      <div className="card">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt=""
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(79,70,229,0.15)",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                flexShrink: 0,
              }}
              title={profile.displayName}
            >
              {(profile.displayName || "?").slice(0, 1).toUpperCase()}
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>
              {profile.displayName}
            </div>
            <div className="small">@{profile.handle}</div>
          </div>
        </div>

        {profile.bio && <div style={{ marginTop: 10 }}>{profile.bio}</div>}
      </div>

      {tweets.length === 0 ? (
        <div className="card small">No posts yet.</div>
      ) : (
        tweets.map((t) => (
          <TweetItem key={t.id} tweet={t} showReplyToggle={true} />
        ))
      )}
    </div>
  );
}
