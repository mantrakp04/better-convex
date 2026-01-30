import { memo } from "react";
import type { UIMessage } from "@ai-sdk/react";
import type { ChatAddToolApproveResponseFunction } from "ai";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import type { ConfirmationProps } from "@/components/ai-elements/confirmation";
import { ToolApprovalConfirmation } from "../tool-approval-confirmation";

export type ToolPartType = Extract<UIMessage["parts"][number], { type: `tool-${string}` }>;

export interface ToolPartProps {
  part: ToolPartType;
  partKey: number;
  toolApprovalResponse: ChatAddToolApproveResponseFunction;
}

export function getToolName(type: string): string {
  return type.slice(5); // Remove "tool-" prefix
}

export function isToolPart(
  part: UIMessage["parts"][number]
): part is ToolPartType {
  return part.type.startsWith("tool-");
}

export const ToolPart = memo(function ToolPart({
  part,
  partKey,
  toolApprovalResponse,
}: ToolPartProps) {
  const toolName = getToolName(part.type);
  const approval = 'approval' in part
    ? (part.approval as ConfirmationProps['approval'])
    : undefined;

  return (
    <Tool key={partKey}>
      <ToolHeader type={part.type} state={part.state} toolName={toolName} />
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput output={part.output} errorText={part.errorText} />
      </ToolContent>
      <ToolApprovalConfirmation
        approval={approval}
        state={part.state}
        toolApprovalResponse={toolApprovalResponse}
        requestTitle="This tool requires your approval to run."
        acceptedTitle="Tool execution approved."
        rejectedTitle="Tool execution rejected"
      />
    </Tool>
  );
});
