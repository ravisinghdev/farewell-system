import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const lastMessage = messages[messages.length - 1];
    const prompt = `You are the Farewell System AI Assistant. You are helpful, friendly, and knowledgeable about the Farewell System platform.
    
    The Farewell System is a platform for organizing school farewell events. Key features include:
    - Creating and managing farewell events.
    - Collecting contributions securely.
    - Sharing photos and videos in a gallery.
    - Real-time chat and announcements.
    - Digital yearbook.
    
    Answer the user's question based on this context. If you don't know the answer, suggest they contact support at support@farewell.app.
    
    User: ${lastMessage.content}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ role: "assistant", content: text });
  } catch (error) {
    console.error("Error in chat API:", error);
    if (error instanceof Error) {
      console.error("Stack:", error.stack);
      console.error("Message:", error.message);
    }
    return NextResponse.json(
      {
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
