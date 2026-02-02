import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  startAt,
  endAt,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import TweetItem from "../components/TweetItem";
import LoadingBird from "../components/LoadingBird";

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function prefixRange(term) {
  const t = term.trim().toLowerCase();
  return { start: t, end: t + "\uf8ff" };
}

export default function Search() {
  const [term, setTerm] = useState("");
  const debounced = useDebounced(term, 250);

  const [tab, setTab] = useState("users"); // "users" | "tweets"
  const [loading, setLoading] = useState(false);

  const [usersByHandle, setUsersByHandle] = useState([]);
  const [usersByName, setUsersByName] = useState([]);
  const [tweets, setTweets] = useState([]);

  const cleaned = useMemo(() => debounced.trim().toLowerCase(), [debounced]);

  useEffect(() => {
    async function run() {
      // clear on empty
      if (!cleaned) {
        setUsersByHandle([]);
        setUsersByName([]);
        setTweets([]);
        return;
      }

      setLoading(true);

      try {
        const { start, end } = prefixRange(cleaned);

        // ---- USERS: handle prefix ----
        // handle is already stored lowercase in your app
        const qHandle = query(
          collection(db, "users"),
          orderBy("handle"),
          startAt(start),
          endAt(end),
          limit(12)
        );

        // ---- USERS: displayNameLower prefix ----
        // requires displayNameLower to exist (seed adds it)
        const qName = query(
          collection(db, "users"),
          orderBy("displayNameLower"),
          startAt(start),
          endAt(end),
          limit(12)
        );

        // ---- TWEETS: textLower prefix ----
        // requires textLower to exist (seed adds it)
        const qTweets = query(
          collection(db, "tweets"),
          orderBy("textLower"),
          startAt(start),
          endAt(end),
          limit(20)
        );

        const [handleSnap, nameSnap, tweetsSnap] = await Promise.all([
          getDocs(qHandle),
          getDocs(qName),
          getDocs(qTweets),
        ]);

        setUsersByHandle(handleSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setUsersByName(nameSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setTweets(tweetsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("SEARCH ERROR:", err);
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [cleaned]);

  // Merge users (avoid duplicates if same user appears in both lists)
  const usersMerged = useMemo(() => {
    const map = new Map();
    for (const u of usersByHandle) map.set(u.id, u);
    for (const u of usersByName) map.set(u.id, u);
    return Array.from(map.values()).slice(0, 20);
  }, [usersByHandle, usersByName]);

  return (
    <div className="stack">
      <div className="card">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder="Search users or tweets…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            style={{ flex: "1 1 260px" }}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`btn secondary ${tab === "users" ? "active" : ""}`}
              type="button"
              onClick={() => setTab("users")}
            >
              Users
            </button>
            <button
              className={`btn secondary ${tab === "tweets" ? "active" : ""}`}
              type="button"
              onClick={() => setTab("tweets")}
            >
              Tweets
            </button>
          </div>
        </div>

        <div className="small" style={{ marginTop: 10 }}>
          Tip: This is prefix search (fast). Try “mar”, “dev”, “ship”, etc.
        </div>
      </div>

      {loading && (
        <div className="stack">
          <LoadingBird label="Searching…" />
        </div>
      )}

      {!loading && cleaned && tab === "users" && (
        <>
          {usersMerged.length === 0 ? (
            <div className="card small">No users found.</div>
          ) : (
            usersMerged.map((u) => (
              <div key={u.id} className="card">
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {u.photoURL ? (
                    <img
                      src={u.photoURL}
                      alt=""
                      style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "rgba(79,70,229,0.15)",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900,
                      }}
                      title={u.displayName}
                    >
                      {(u.displayName || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900 }}>{u.displayName}</div>
                    <div className="small">@{u.handle}</div>
                    {u.bio && <div className="small" style={{ marginTop: 6 }}>{u.bio}</div>}
                  </div>

                  <div style={{ marginLeft: "auto" }}>
                    <Link className="small" to={`/u/${u.handle}`}>
                      View profile →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {!loading && cleaned && tab === "tweets" && (
        <>
          {tweets.length === 0 ? (
            <div className="card small">No tweets found.</div>
          ) : (
            tweets.map((t) => (
              <TweetItem key={t.id} tweet={t} />
            ))
          )}
        </>
      )}
    </div>
  );
}
