"use server";

import { adminDb, adminStorage, FieldValue, serializeTimestamps } from "@/lib/firebase-admin";

const SETTINGS_DOC_ID = "platform";

export async function getPlatformSettings() {
  try {
    const doc = await adminDb.doc(`settings/${SETTINGS_DOC_ID}`).get();

    if (doc.exists) {
      return { success: true, data: serializeTimestamps({ id: doc.id, ...doc.data() }) };
    }

    // Return default settings if none exist
    const defaultSettings = {
      siteName: "EdventureHub",
      siteDescription: "Online Learning Platform",
      logoUrl: null,
      primaryColor: "#7D52F4",
      allowSelfRegistration: true,
    };

    return { success: true, data: defaultSettings };
  } catch (error: any) {
    console.error("Get platform settings error:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePlatformSettings(settings: {
  siteName?: string;
  siteDescription?: string;
  logoUrl?: string;
  primaryColor?: string;
  allowSelfRegistration?: boolean;
}) {
  try {
    await adminDb.doc(`settings/${SETTINGS_DOC_ID}`).set(
      {
        ...settings,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true };
  } catch (error: any) {
    console.error("Update platform settings error:", error);
    return { success: false, error: error.message };
  }
}

export async function uploadSettingsImage(file: File, path: string) {
  try {
    const bucket = adminStorage.bucket();
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await bucket.file(path).save(fileBuffer, {
      contentType: file.type,
    });

    const [url] = await bucket.file(path).getSignedUrl({
      action: "read",
      expires: "2037-12-31",
    });

    return { success: true, url };
  } catch (error: any) {
    console.error("Upload settings image error:", error);
    return { success: false, error: error.message };
  }
}
