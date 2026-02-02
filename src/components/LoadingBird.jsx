export default function LoadingBird({ label = "Loading…" }) {
  return (
    <div
      className="card"
      style={{
        display: "grid",
        justifyItems: "center",
        gap: 10,
        padding: 24
      }}
    >
      <img
        src="/chirpee-bird-wink.svg"
        alt="Loading"
        width={64}
        height={64}
        style={{
          animation: "chirpeeBob 900ms ease-in-out infinite"
        }}
      />

      <div className="small">{label}</div>
    </div>
  );
}
