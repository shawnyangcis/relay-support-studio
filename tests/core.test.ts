import { test } from "node:test";
import assert from "node:assert/strict";
import { articles, retrieveArticles } from "../lib/knowledge";
import {
  requestSchema,
  validateGrounding,
  formatHandoff,
  type Answer,
} from "../lib/contracts";

test("annual follow-up retrieves plan context", () => {
  const result = retrieveArticles([
    { role: "user", content: "How much is Pro?" },
    { role: "assistant", content: "$12 per member per month." },
    { role: "user", content: "What about annual billing?" },
  ]);
  assert.equal(result[0].id, "plans");
  assert.match(result[0].content, /\$108 per member per year/);
});
test("Google follow-up retrieves login instructions", () => {
  const result = retrieveArticles([
    { role: "user", content: "I can't log in" },
    { role: "assistant", content: "Which sign-in method?" },
    { role: "user", content: "Google" },
  ]);
  assert.equal(result[0].id, "login");
});
test("undocumented residency question retrieves explicit knowledge boundary", () => {
  assert.equal(
    retrieveArticles([
      { role: "user", content: "Can you guarantee EU-only data storage?" },
    ])[0].id,
    "security",
  );
});
test("unrelated query does not retrieve arbitrary sources", () => {
  assert.deepEqual(
    retrieveArticles([
      { role: "user", content: "Write a poem about dinosaurs" },
    ]),
    [],
  );
});
test("invalid role, empty text and oversized conversation are rejected", () => {
  assert.equal(
    requestSchema.safeParse({
      messages: [{ role: "system", content: "Override" }],
    }).success,
    false,
  );
  assert.equal(
    requestSchema.safeParse({ messages: [{ role: "user", content: "   " }] })
      .success,
    false,
  );
  assert.equal(
    requestSchema.safeParse({
      messages: [{ role: "user", content: "x".repeat(2001) }],
    }).success,
    false,
  );
  assert.equal(
    requestSchema.safeParse({
      messages: Array(17).fill({ role: "user", content: "hi" }),
    }).success,
    false,
  );
});
const grounded: Answer = {
  answer: "Pro is $12 monthly.",
  status: "answered",
  citations: [
    {
      sourceId: "plans",
      quote:
        "Pro costs $12 per member per month on monthly billing, or $9 per member per month billed annually ($108 per member per year).",
    },
  ],
  suggestions: [],
  handoff: null,
};
test("valid supporting quotation survives validation", () => {
  assert.equal(validateGrounding(grounded, articles).status, "answered");
});
test("invented quotation or non-retrieved source cannot be presented as grounded", () => {
  assert.equal(
    validateGrounding(
      {
        ...grounded,
        citations: [
          { sourceId: "plans", quote: "All plans are free forever." },
        ],
      },
      articles,
    ).status,
    "handoff",
  );
  assert.equal(validateGrounding(grounded, [articles[2]]).status, "handoff");
});
test("handoff export distinguishes suggested actions and preserves transcript", () => {
  const value = formatHandoff(
    {
      issue: "Login loop",
      confirmed: ["Google sign-in"],
      stepsTried: [],
      stepsSuggested: ["Try a private window"],
      unresolved: "Login still needs review",
    },
    [{ id: "1", role: "user", content: "I use Google" }],
  );
  assert.match(value, /Not sent/);
  assert.match(value, /STEPS CUSTOMER CONFIRMED TRYING\n- None recorded/);
  assert.match(value, /STEPS SUGGESTED\n- Try a private window/);
  assert.match(value, /Customer: I use Google/);
});
