import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { fileId } = await request.json();

    if (!fileId) {
      return new Response(JSON.stringify({ error: "File ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    try {
      const fileContent = await openai.vectorStores.files.retrieve(fileId, {
        vector_store_id: process.env.VECTOR_STORE_ID,
      });

      // Convert the file content to text
      //   const fileText = await fileContent.text();

      return new Response(
        JSON.stringify({
          success: true,
          fileId,
          content: fileContent.attributes,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error(`Error retrieving file ${fileId}:`, error);
      return new Response(
        JSON.stringify({
          error: "Failed to retrieve file content",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in file API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
