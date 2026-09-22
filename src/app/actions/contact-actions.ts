"use server";

import { adminDb, FieldValue } from "@/lib/firebase-admin";

export type ContactFormState = { success?: boolean; error?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Public form: anyone may submit, so every field is validated here, not in the UI. */
export async function sendContactMessage(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!name || !message) return { error: "Name and message are required." };
  if (!EMAIL.test(email)) return { error: "Enter a valid email address." };
  if (name.length > 100 || email.length > 200 || subject.length > 150)
    return { error: "One of your fields is too long." };
  if (message.length > 5000) return { error: "Message must be 5000 characters or fewer." };

  try {
    await adminDb.collection("contact_messages").add({
      name,
      email,
      subject,
      message,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Send contact message error:", error);
    return { error: "Could not send your message. Please try again." };
  }
}
