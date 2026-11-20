import { z } from "zod";
import type { Article, ChatTurn } from "./knowledge";

export const requestSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) })).min(1).max(16),
});

export const answerSchema = z.object({
  answer: z.string().describe("Concise customer-facing plain text; use line breaks for steps. No markdown or links."),
  status: z.enum(["answered", "clarify", "handoff"]),
  citations: z.array(z.object({ sourceId: z.string(), quote: z.string().describe("Exact supporting sentence copied verbatim from this source") })),
  suggestions: z.array(z.string()).describe("Up to 3 short useful follow-up questions or replies the customer could send"),
  handoff: z.object({
    issue: z.string(),
    confirmed: z.array(z.string()),
    stepsTried: z.array(z.string()).describe("Only actions customer says they tried; do not conflate suggestions with completed steps"),
    stepsSuggested: z.array(z.string()),
    unresolved: z.string(),
  }).nullable(),
});

export type Answer = z.infer<typeof answerSchema>;
export type ChatMessage = ChatTurn & { id: string; result?: Answer; latencyMs?: number };

export function validateGrounding(answer: Answer, sources: Article[]): Answer {
  const citations = answer.citations.filter(c => c.quote.trim().length >= 12 && sources.some(s => s.id === c.sourceId && s.content.includes(c.quote.trim())));
  if (answer.status === "answered" && citations.length === 0) {
    return {
      answer: "I couldn't verify an answer in the available support articles. I can prepare a handoff draft so the team can confirm the details.",
      status: "handoff", citations: [], suggestions: [],
      handoff: { issue: "The answer needs verification", confirmed: [], stepsTried: [], stepsSuggested: [], unresolved: "No valid supporting quotation was returned. Review the attached conversation." },
    };
  }
  return { ...answer, citations, suggestions: answer.suggestions.slice(0, 3) };
}

export function formatHandoff(handoff: NonNullable<Answer["handoff"]>, messages: ChatMessage[]): string {
  const list = (values: string[]) => values.length ? values.map(v => `- ${v}`).join("\n") : "- None recorded";
  return `RELAY — HANDOFF DRAFT\nNot sent. No ticket has been created.\n\nQUESTION\n${handoff.issue}\n\nCUSTOMER-PROVIDED DETAILS\n${list(handoff.confirmed)}\n\nSTEPS CUSTOMER CONFIRMED TRYING\n${list(handoff.stepsTried)}\n\nSTEPS SUGGESTED\n${list(handoff.stepsSuggested)}\n\nNEEDS FOLLOW-UP\n${handoff.unresolved}\n\nCONVERSATION\n${messages.map(m => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`).join("\n\n")}`;
}
