import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { user } = useAuth();
  const { isDark, toggle } = useTheme();

  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="container rowBetween">
        <Link
          to="/"
          style={{
            fontWeight: 900,
            letterSpacing: 0.2,
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "var(--text)",
          }}
        >
          <img
            src="/chirpee-bird.svg"
            alt="Chirpee"
            style={{ width: 36, height: 36 }}
          />
          Chirpee
        </Link>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link to="/">Home</Link>
          <Link to="/following">Following</Link>
          <Link to="/search">Search</Link>
          {user ? (
            <button className="btn secondary" onClick={() => signOut(auth)}>
              Logout
            </button>
          ) : (
            <Link to="/login">Login</Link>
          )}
          <button className="btn secondary" onClick={toggle}>
            {isDark ? "🌞 Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
    </div>
  );
}
