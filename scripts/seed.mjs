import admin from "firebase-admin";
import { fakerEN_US as faker } from "@faker-js/faker";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}. Add it to .env.local`);
  return v;
}

function slugHandle(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function maybe(prob = 0.3) {
  return Math.random() < prob;
}

const EMOJI = [
  "🔥",
  "🚀",
  "💯",
  "😅",
  "👀",
  "👏",
  "✨",
  "💻",
  "☕",
  "📦",
  "🎯",
];

const HASHTAGS = [
  "#buildinpublic",
  "#webdev",
  "#firebase",
  "#react",
  "#100DaysOfCode",
  "#coding",
  "#devlife",
  "#shipit",
];

const BASE_TWEETS = [
  "Just shipped a new feature",
  "Debugged something that made zero sense",
  "Refactored way more than I planned today",
  "Frontend looked fine… backend disagreed",
  "Finally understand how this part works",
  "Small progress still counts",
  "This bug was hiding in plain sight",
  "Feeling good about this build today",
  "Reminder: ship first, polish later",
  "Learning by building is undefeated",
];

const SECOND_LINES = [
  "On to the next feature.",
  "Momentum is everything.",
  "Future me will thank me for this.",
  "Glad I didn’t give up on this one.",
  "This is starting to feel real.",
  "One commit at a time.",
];

const REPLIES = [
  "Love this.",
  "Yep been there 😂",
  "Nice progress.",
  "This is the way.",
  "Good catch.",
  "Huge win honestly.",
  "Keep shipping.",
  "That feeling when it finally works >>>",
];

export function englishTweet(users = []) {
  let text = pick(BASE_TWEETS);

  if (maybe(0.35)) text += `. ${pick(SECOND_LINES)}`;

  if (users.length && maybe(0.25)) {
    const u = pick(users);
    text += ` @${u.handle}`;
  }

  if (maybe(0.35)) text += ` ${pick(HASHTAGS)}`;
  if (maybe(0.4)) text += ` ${pick(EMOJI)}`;

  return text;
}

export function englishReply(users = []) {
  let text = pick(REPLIES);

  if (users.length && maybe(0.2)) {
    const u = pick(users);
    text += ` @${u.handle}`;
  }

  if (maybe(0.3)) text += ` ${pick(EMOJI)}`;

  return text;
}

function makeDownloadURL(bucketName, filePath, token) {
  const encoded = encodeURIComponent(filePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media&token=${token}`;
}

async function downloadToTemp(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = ".jpg";
  const tmpFile = path.join(
    os.tmpdir(),
    `chirpee_seed_${crypto.randomUUID()}${ext}`,
  );
  await fs.writeFile(tmpFile, buf);
  return tmpFile;
}

async function uploadImageAndGetUrl(bucket, bucketName, localFile, destPath) {
  const token = crypto.randomUUID();

  await bucket.upload(localFile, {
    destination: destPath,
    metadata: {
      contentType: "image/jpeg",
      metadata: {
        // This token is what makes the "download URL" work
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  return {
    imagePath: destPath,
    imageURL: makeDownloadURL(bucketName, destPath, token),
  };
}

function getRandomProfileImage(i = 0) {
  // Use picsum since you already know it works on your machine
  return `https://picsum.photos/seed/chirpee-avatar-${i + 1}/256/256`;
}

/**
 * Optional: delete existing demo users (emails ending with @chirpee.demo)
 * Run: node scripts/seed.mjs --reset
 */
async function resetDemoUsers() {
  const auth = admin.auth();
  let pageToken = undefined;
  const toDelete = [];

  do {
    const res = await auth.listUsers(1000, pageToken);
    for (const u of res.users) {
      if (u.email && u.email.endsWith("@chirpee.demo")) toDelete.push(u.uid);
    }
    pageToken = res.pageToken;
  } while (pageToken);

  if (toDelete.length) {
    console.log(`Deleting ${toDelete.length} demo auth users…`);
    // deleteUsers supports up to 1000 at a time
    await auth.deleteUsers(toDelete);
  } else {
    console.log("No demo auth users found to delete.");
  }
}

async function main() {
  const RESET = process.argv.includes("--reset");

  // Load env from .env.local (simple parser so you don't need extra deps)
  // If you prefer, you can install dotenv and use it instead.
  try {
    const envLocalPath = path.join(process.cwd(), ".env.local");
    const text = await fs.readFile(envLocalPath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const k = m[1];
      let v = m[2];
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    // ignore if missing; requireEnv will throw
  }

  const projectId = requireEnv("SEED_PROJECT_ID");
  const bucketName = requireEnv("SEED_STORAGE_BUCKET");

  const serviceAccountPath = path.join(
    process.cwd(),
    "scripts",
    "serviceAccountKey.json",
  );
  const serviceAccount = JSON.parse(
    await fs.readFile(serviceAccountPath, "utf8"),
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId,
    storageBucket: bucketName,
  });

  const db = admin.firestore();
  const auth = admin.auth();
  const bucket = admin.storage().bucket(bucketName);

  if (RESET) {
    await resetDemoUsers();
  }

  // ---- Create 12 users (Auth + Firestore users + handles) ----
  const USERS = 12;
  const users = [];

  console.log(`Creating ${USERS} demo users…`);

  for (let i = 0; i < USERS; i++) {
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    const displayName = `${first} ${last}`;

    // Ensure unique handles
    let handle = slugHandle(first + last);
    if (handle.length < 4)
      handle = (handle + faker.string.alphanumeric(6)).slice(0, 10);
    handle = `${handle}${faker.number.int({ min: 10, max: 99 })}`.slice(0, 16);

    const email = `${handle}@chirpee.demo`;
    const password = "ChirpeeDemo!123"; // demo password

    // Create Auth user (if exists, reuse)
    let uid;
    try {
      const created = await auth.createUser({ email, password, displayName });
      uid = created.uid;
    } catch (e) {
      // If rerun without --reset, user may exist
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
    }

    let profileImageURL = "";
    let profileImagePath = "";

    try {
      const remoteImage = getRandomProfileImage(i);

      console.log("Downloading avatar:", remoteImage);

      const tmpFile = await downloadToTemp(remoteImage);

      const destPath = `seed/avatars/${crypto.randomUUID()}.jpg`;

      const upload = await uploadImageAndGetUrl(
        bucket,
        bucketName,
        tmpFile,
        destPath,
      );

      profileImageURL = upload.imageURL;
      profileImagePath = upload.imagePath;

      await fs.unlink(tmpFile).catch(() => {});
    } catch (err) {
      console.log("Avatar URL was:", remoteImage);
      console.log("Avatar fetch failed:", err);
    }

    // Firestore user doc
    await db.doc(`users/${uid}`).set(
      {
        uid,
        handle,
        displayName,
        bio: pick([
          "Building things one commit at a time.",
          "Learning in public. Shipping often.",
          "React • Firebase • Chirpee",
          "Coffee powered developer ☕",
          "Debugging is my cardio.",
          "Currently building Chirpee 🚀",
          "Small wins add up.",
          "Frontend curious. Backend brave.",
          "Trying to ship more than I scroll.",
          "Making the internet slightly better.",
        ]),
        photoURL: profileImageURL,
        photoPath: profileImagePath, // optional: you can seed avatar images later
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // handles/{handle} -> { uid }
    await db.doc(`handles/${handle}`).set({ uid }, { merge: true });

    users.push({ uid, handle, displayName, email });
  }

  // ---- Create follow graph (simple random) ----
  console.log("Creating follows…");
  for (const u of users) {
    const followCount = faker.number.int({ min: 2, max: 5 });
    const targets = faker.helpers.arrayElements(
      users.filter((x) => x.uid !== u.uid),
      followCount,
    );

    for (const t of targets) {
      await db.doc(`users/${u.uid}/following/${t.uid}`).set({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await db.doc(`users/${t.uid}/followers/${u.uid}`).set({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  // ---- Create 60 tweets (some with images) ----
  const TWEETS = 60;
  const REPLIES = 100;

  // Use remote placeholder images (we download then upload to Storage)
  const imageUrls = [
    "https://picsum.photos/seed/chirpee1/1200/800",
    "https://picsum.photos/seed/chirpee2/1200/800",
    "https://picsum.photos/seed/chirpee3/1200/800",
    "https://picsum.photos/seed/chirpee4/1200/800",
    "https://picsum.photos/seed/chirpee5/1200/800",
    "https://picsum.photos/seed/chirpee6/1200/800",
  ];

  console.log(`Creating ${TWEETS} tweets…`);

  const tweetRefs = [];

  for (let i = 0; i < TWEETS; i++) {
    const author = faker.helpers.arrayElement(users);

    const baseTweet = {
      uid: author.uid,
      handle: author.handle,
      displayName: author.displayName,
      photoURL: author.photoURL || "",
      text: englishTweet(users),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      likeCount: 0,
      replyCount: 0,
      retweetCount: 0,
      imageURL: "",
      imagePath: "",
    };

    // ~35% of tweets get an image
    const withImage = Math.random() < 0.35;
    if (withImage) {
      const url = faker.helpers.arrayElement(imageUrls);

      const tmpFile = await downloadToTemp(url);
      const destPath = `seed/tweets/${crypto.randomUUID()}.jpg`;

      const { imageURL, imagePath } = await uploadImageAndGetUrl(
        bucket,
        bucketName,
        tmpFile,
        destPath,
      );

      function getRandomProfileImage(i = 0) {
        // Use picsum since you already know it works on your machine
        return `https://picsum.photos/seed/chirpee-avatar-${i + 1}/256/256`;
      }

      baseTweet.imageURL = imageURL;
      baseTweet.imagePath = imagePath;

      // cleanup temp file
      await fs.unlink(tmpFile).catch(() => {});
    }

    const ref = await db.collection("tweets").add(baseTweet);
    tweetRefs.push({ id: ref.id, authorUid: author.uid });
  }

  // ---- Create 100 replies (randomly distributed) ----
  console.log(`Creating ${REPLIES} replies…`);

  for (let i = 0; i < REPLIES; i++) {
    const tweet = faker.helpers.arrayElement(tweetRefs);
    const replier = faker.helpers.arrayElement(users);

    const replyRef = db
      .collection("tweets")
      .doc(tweet.id)
      .collection("replies")
      .doc();

    await replyRef.set({
      text: englishReply(users),
      uid: replier.uid,
      handle: replier.handle,
      displayName: replier.displayName,
      photoURL: replier.photoURL || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // increment replyCount on parent tweet
    await db.doc(`tweets/${tweet.id}`).update({
      replyCount: admin.firestore.FieldValue.increment(1),
    });
  }

  console.log("✅ Seed complete!");
  console.log("Demo user password:", "ChirpeeDemo!123");
  console.log("Example emails:");
  for (const u of users.slice(0, 5)) console.log(" -", u.email);
  console.log("Run again with reset:", "node scripts/seed.mjs --reset");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
