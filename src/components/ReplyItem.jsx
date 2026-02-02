import { formatTime } from "../utils/time";

export default function ReplyItem({ reply }) {
  const name = reply.displayName || "Unknown";
  const handle = reply.handle || "unknown";
  const photoURL = reply.photoURL || "";

  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        {photoURL ? (
          <img
            src={photoURL}
            alt=""
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
            onError={(e) => {
              console.log("Reply avatar failed to load:", photoURL);
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div
            title={name}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(79,70,229,0.15)",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              flexShrink: 0,
              fontSize: 12,
            }}
          >
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900 }}>{name}</div>
            <div className="small">@{handle}</div>
            <div className="small" style={{ opacity: 0.85 }}>
              {reply.createdAt ? formatTime(reply.createdAt) : ""}
            </div>
          </div>

          <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>
            {reply.text}
          </div>
        </div>
      </div>
    </div>
  );
}
