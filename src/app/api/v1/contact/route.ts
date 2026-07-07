import type { NextRequest } from "next/server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { error, success } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();
    if (!name || !email || !subject || !message) {
      return error("name, email, subject, and message are required");
    }

    await db.insert(contactMessages).values({ name, email, subject, message });

    return success({}, "Message sent successfully");
  } catch (e) {
    return error((e as Error).message);
  }
}
