import { routeAgentRequest } from "agents";
import { AIChatAgent } from "agents/ai-chat-agent";
import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse, type StreamTextOnFinishCallback, type ToolSet } from "ai";
import { createDeepAgent } from "deepagents";
import { ChatOpenAI } from "@langchain/openai";
import type { worker } from "../alchemy.run";

export default {
  async fetch(request: Request, env: typeof worker.Env): Promise<Response> {
    return (
      (await routeAgentRequest(request, env, {
        prefix: 'agents',
        cors: true,
      })) || new Response('Not found', { status: 404 })
    );
  },
};

export class Agent extends AIChatAgent<typeof worker.Env> {
  override async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }
    console.log("token", token);
    return super.onRequest(request);
  }

  override async onChatMessage(
    _onFinish: StreamTextOnFinishCallback<ToolSet>
  ): Promise<Response> {
    const model = new ChatOpenAI({
      model: this.env.OPENROUTER_MODEL,
      temperature: 0,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: this.env.OPENROUTER_API_KEY,
      },
    });

    const agent = createDeepAgent({
      model,
      systemPrompt: "You are a helpful assistant.",
    });

    const langchainMessages = await toBaseMessages(this.messages);

    const streamEvents = agent.streamEvents(
      { messages: langchainMessages },
      { version: "v2" }
    );

    return createUIMessageStreamResponse({
      stream: toUIMessageStream(streamEvents),
    });
  }
}