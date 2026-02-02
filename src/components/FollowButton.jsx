import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

export default function FollowButton({ targetUid }) {
  const { user } = useAuth();

  async function toggle() {
    if (!user) return alert("Log in to follow.");
    if (user.uid === targetUid) return;

    const followingRef = doc(db, "users", user.uid, "following", targetUid);
    const followerRef = doc(db, "users", targetUid, "followers", user.uid);

    const snap = await getDoc(followingRef);
    if (snap.exists()) {
      await deleteDoc(followingRef);
      await deleteDoc(followerRef);
    } else {
      await setDoc(followingRef, { createdAt: serverTimestamp() });
      await setDoc(followerRef, { createdAt: serverTimestamp() });
    }
  }

  return (
    <button className="btn secondary" onClick={toggle}>
      Follow / Unfollow
    </button>
  );
}
