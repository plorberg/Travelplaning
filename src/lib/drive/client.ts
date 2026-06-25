"use client";

import {
  GoogleAuthProvider,
  reauthenticateWithPopup,
  signInWithPopup,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const FOLDER_MIME = "application/vnd.google-apps.folder";

export interface DriveUpload {
  id: string;
  url: string; // webViewLink
  name: string;
}

// Incremental consent: request the Drive scope only when the user uploads, so
// the regular sign-in flow is unchanged. The access token is short-lived and is
// used immediately in the browser — it is never sent to or stored on our server.
async function getDriveToken(): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.addScope(DRIVE_SCOPE);
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  const result = user
    ? await reauthenticateWithPopup(user, provider)
    : await signInWithPopup(auth, provider);
  const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
  if (!token) {
    throw new Error("Google Drive permission was not granted.");
  }
  return token;
}

async function shareAnyone(token: string, fileId: string): Promise<void> {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });
}

async function findOrCreateFolder(token: string, folderName: string): Promise<string> {
  const escaped = folderName.replace(/'/g, "\\'");
  const q = encodeURIComponent(
    `mimeType='${FOLDER_MIME}' and name='${escaped}' and trashed=false`,
  );
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (listRes.ok) {
    const data = (await listRes.json()) as { files?: { id: string }[] };
    const existing = data.files?.[0]?.id;
    if (existing) return existing;
  }

  const createRes = await fetch(
    "https://www.googleapis.com/drive/v3/files?fields=id",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: folderName, mimeType: FOLDER_MIME }),
    },
  );
  if (!createRes.ok) throw new Error("Could not create the trip's Drive folder.");
  const folder = (await createRes.json()) as { id: string };
  await shareAnyone(token, folder.id); // folder link-viewable for collaborators
  return folder.id;
}

/** Upload a file into the trip's Drive folder and return its id + shareable link. */
export async function uploadToTripDrive(opts: {
  tripId: string;
  tripName: string;
  file: File;
}): Promise<DriveUpload> {
  const token = await getDriveToken();
  const folderName = `Travelplaning — ${opts.tripName} [${opts.tripId.slice(0, 8)}]`;
  const folderId = await findOrCreateFolder(token, folderName);

  const metadata = { name: opts.file.name, parents: [folderId] };
  const boundary = `tp${Math.random().toString(16).slice(2)}`;
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: ${opts.file.type || "application/octet-stream"}\r\n\r\n`,
    opts.file,
    `\r\n--${boundary}--`,
  ]);

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,name",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  if (!uploadRes.ok) throw new Error("Upload to Google Drive failed.");
  const file = (await uploadRes.json()) as { id: string; webViewLink: string; name: string };
  await shareAnyone(token, file.id); // file itself link-viewable
  return { id: file.id, url: file.webViewLink, name: file.name };
}
