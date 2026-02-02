import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"


/**
 * Handle uniqueness strategy (no Cloud Functions):
 * - Use a "handles" collection where docId = handle
 * - In a transaction:
 *   - If handles/{handle} exists => reject
 *   - Else create handles/{handle} -> { uid }
 *   - Create users/{uid} profile doc
 */
async function claimHandleAndCreateProfile({ uid, handle, displayName }) {
  const clean = handle.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,15}$/.test(clean)) {
    throw new Error("Handle must be 3-15 chars: letters/numbers/_");
  }

  const handleRef = doc(db, "handles", clean);
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (tx) => {
    const existing = await tx.get(handleRef);
    if (existing.exists()) {
      throw new Error("That handle is taken. Try another.");
    }
    tx.set(handleRef, { uid, createdAt: serverTimestamp() });
    tx.set(userRef, {
      handle: clean,
      displayName: displayName.trim() || clean,
      photoURL: "",
      bio: "",
      createdAt: serverTimestamp(),
    });
  });
}

export default function Login() {
  const { user } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
  if (user) {
    navigate("/", { replace: true });
  }
}, [user, navigate]);
  

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await claimHandleAndCreateProfile({
          uid: cred.user.uid,
          handle,
          displayName,
        });
        navigate("/", {replace: true});
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 540, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>{mode === "signup" ? "Create account" : "Log in"}</h2>
      <p className="small">
        {mode === "signup"
          ? "Pick a unique handle. We'll reserve it for you."
          : "Log in with your email and password."}
      </p>

      <form onSubmit={submit} className="stack">
        {mode === "signup" && (
          <>
            <input className="input" placeholder="Handle (3-15 chars, a-z 0-9 _)" value={handle} onChange={(e) => setHandle(e.target.value)} />
            <input className="input" placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </>
        )}
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && <div style={{ color: "tomato" }}>{error}</div>}

        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Working..." : mode === "signup" ? "Sign up" : "Log in"}
        </button>

        <button className="btn secondary" type="button" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
          Switch to {mode === "signup" ? "login" : "signup"}
        </button>
      </form>
    </div>
  );
}
