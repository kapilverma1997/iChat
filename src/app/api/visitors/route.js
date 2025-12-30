import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb.js";
import LandingPageVisitor from "../../../../models/LandingPageVisitor.js";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    const visitor = new LandingPageVisitor({
      name,
      email,
      message,
    });

    await visitor.save();

    return NextResponse.json(
      { message: "Visitor data saved successfully", visitor },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving visitor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save visitor data" },
      { status: 500 }
    );
  }
}
