import { z } from "zod";
import { answerSchema } from "./contracts";
import type { ChatTurn } from "./knowledge";

const responseSchema = z.object({
  status: z.string(),
  output: z.array(
    z.object({
      type: z.string(),
      content: z
        .array(z.object({ type: z.string(), text: z.string().optional() }))
        .optional(),
    }),
  ),
});

export async function generateAnswer(
  instructions: string,
  messages: ChatTurn[],
) {
  const baseURL =
    process.env.MODEL_BASE_URL || "https://api.longcat.chat/openai/v1";
  const response = await fetch(`${baseURL.replace(/\/$/, "")}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MODEL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.MODEL_ID || "LongCat-2.5",
      instructions,
      input: messages,
      reasoning: { effort: "none" },
      max_output_tokens: 2200,
      text: {
        format: {
          type: "json_schema",
          name: "support_answer",
          strict: true,
          schema: z.toJSONSchema(answerSchema),
        },
      },
      stream: false,
      store: false,
    }),
    signal: AbortSignal.timeout(35000),
  });
  if (!response.ok) {
    const error = new Error("Model provider request failed") as Error & {
      statusCode: number;
    };
    error.statusCode = response.status;
    throw error;
  }
  const data = responseSchema.parse(await response.json());
  if (data.status !== "completed")
    throw new Error("Model response was incomplete");
  const text = data.output
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text")
    .map((part) => part.text ?? "")
    .join("");
  return answerSchema.parse(JSON.parse(text));
}
