import type { UIMessage } from "@ai-sdk/react";
import { MessageResponse } from "@/components/ai-elements/message";

export interface TextPartProps {
  part: Extract<UIMessage["parts"][number], { type: "text" }>;
  role: UIMessage["role"];
  partKey: number;
}

export function TextPart({ part, role, partKey }: TextPartProps) {
  return role === "user" ? (
    <p key={partKey} className="whitespace-pre-wrap">
      {part.text}
    </p>
  ) : (
    <MessageResponse key={partKey}>{part.text}</MessageResponse>
  );
}
