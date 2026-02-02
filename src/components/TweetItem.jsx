import { Link, useNavigate } from "react-router-dom";
import LikeButton from "./LikeButton";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { formatTime } from "../utils/time";
import { useState } from "react";
import RepliesPanel from "./RepliesPanel";

export default function TweetItem({ tweet, showReplyToggle = true }) {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const navigate = useNavigate();

  async function onDelete() {
    if (!user) return;
    if (user.uid !== tweet.uid)
      return alert("You can only delete your own tweets.");
    if (!confirm("Delete this tweet?")) return;

    await deleteDoc(doc(db, "tweets", tweet.id));
  }

  return (
    <div
      className="card"
      style={{ cursor: "pointer" }}
      onClick={() => navigate(`/tweet/${tweet.id}`)}
    >
      <div className="rowBetween" style={{ alignItems: "flex-start" }}>
        {/* LEFT SIDE: avatar + tweet content */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            minWidth: 0,
            flex: 1,
          }}
        >
          {tweet.photoURL ? (
            <img
              src={tweet.photoURL}
              alt=""
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
              onError={() =>
                console.log("Tweet avatar failed to load:", tweet.photoURL)
              }
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
                flexShrink: 0,
              }}
              title={tweet.displayName}
            >
              {(tweet.displayName || "?").slice(0, 1).toUpperCase()}
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900 }}>
              {tweet.displayName}{" "}
              <span className="small" style={{ fontWeight: 700 }}>
                @{tweet.handle}
              </span>
            </div>

            <div className="small">
              {tweet.createdAt ? formatTime(tweet.createdAt) : ""}
            </div>

            <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
              {tweet.text}
            </div>

            {tweet.imageURL && (
              <img
                src={tweet.imageURL}
                alt="tweet"
                style={{ width: "100%", borderRadius: 12, marginTop: 10 }}
              />
            )}

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <LikeButton tweetId={tweet.id} />
                <span className="small">Likes: {tweet.likeCount || 0}</span>
                <span className="small">Replies: {tweet.replyCount || 0}</span>
              </div>

              {showReplyToggle && (
                <button
                  className="btn secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReplies((v) => !v);
                  }}
                >
                  {showReplies ? "Hide replies" : "Reply"}
                </button>
              )}

              <span className="small">Retweets: {tweet.retweetCount || 0}</span>
            </div>

            {showReplyToggle && showReplies && (
              <RepliesPanel tweetId={tweet.id} />
            )}
          </div>
        </div>

        {/* RIGHT SIDE: links + actions */}
        <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
          <Link
            to={`/tweet/${tweet.id}`}
            className="small"
            onClick={(e) => e.stopPropagation()}
          >
            View
          </Link>
          <Link
            to={`/u/${tweet.handle}`}
            className="small"
            onClick={(e) => e.stopPropagation()}
          >
            Profile
          </Link>
          {user?.uid === tweet.uid && (
            <button
              className="btn secondary"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
