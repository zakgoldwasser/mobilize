import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { message, conversationId: initialConversationId } =
      await request.json();
    let conversationId = initialConversationId;

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
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

    if (!conversationId) {
      const conversation = await openai.conversations.create();
      conversationId = conversation.id;
    }

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Send conversationId early in the stream
          const conversationIdData = JSON.stringify({
            type: "conversationId",
            conversationId: conversationId,
          });
          controller.enqueue(encoder.encode(`data: ${conversationIdData}\n\n`));

          // Call OpenAI API with streaming
          const openaiStream = await openai.responses.create({
            model: "gpt-4o",
            tools: [
              {
                type: "file_search",
                vector_store_ids: [process.env.VECTOR_STORE_ID],
                max_num_results: 20,
              },
            ],
            instructions:
              "You are an assistant on the mobilize.us platform, answer user's questions about events, volunteer opportunities, petitions, and community groups. Encourage them to participate",
            input: message,
            conversation: conversationId,
            stream: true,
          });

          // Stream the response chunks from OpenAI
          for await (const event of openaiStream) {
            // Handle different event types
            if (event.type === "response.output_text.delta") {
              // Extract delta content - handle different possible structures
              const deltaContent =
                event.delta ||
                event.output_text?.delta ||
                event.data?.delta ||
                "";

              // Send text delta to client in SSE format
              const data = JSON.stringify({
                type: "delta",
                content: deltaContent,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (event.type === "response.output_text.annotation.added") {
              // Forward file citation annotation to client
              const data = JSON.stringify({
                type: "annotation",
                annotation: event.annotation,
                item_id: event.item_id,
                sequence_number: event.sequence_number,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (event.type === "response.created") {
              // Response started
              const data = JSON.stringify({
                type: "created",
                responseId: event.response?.id,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (event.type === "response.completed") {
              // Response completed
              const data = JSON.stringify({
                type: "completed",
                response: event.response,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (event.type === "error") {
              // Handle errors from OpenAI
              const data = JSON.stringify({
                type: "error",
                error: event.error,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Send a final chunk to indicate completion
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error("Error streaming from OpenAI:", error);
          const errorData = JSON.stringify({
            type: "error",
            error:
              "Failed to get response from OpenAI. Please check your API key and try again.",
            details: error.message,
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    // Return streaming response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
