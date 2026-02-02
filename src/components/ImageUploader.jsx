import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

/**
 * Upload path is scoped to the user:
 *   tweet_images/{uid}/{timestamp}-{filename}
 */
export default function ImageUploader({ onUploaded }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  async function onPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) return alert("Log in to upload an image.");

    // Basic validation
    if (!file.type.startsWith("image/")) return alert("Please select an image.");
    if (file.size > 2_000_000) return alert("Max 2MB image size for this tutorial.");

    setBusy(true);
    try {
      const key = `${Date.now()}-${file.name.replaceAll(" ", "_")}`;
      const fileRef = ref(storage, `tweet_images/${user.uid}/${key}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      onUploaded?.(url);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <label className="btn secondary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {busy ? "Uploading..." : "Add image"}
      <input type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />
    </label>
  );
}
