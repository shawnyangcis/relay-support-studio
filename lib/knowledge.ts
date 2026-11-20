export type Article = {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  keywords: string[];
};

export const articles: Article[] = [
  {
    id: "plans",
    title: "Plans & pricing",
    category: "Billing",
    summary: "Free, Pro and Business. Monthly and annual billing.",
    content:
      "Relay is a fictional team collaboration product. All prices are sample prices in USD, before tax. Free is $0 for up to 3 members and 3 active projects. Pro costs $12 per member per month on monthly billing, or $9 per member per month billed annually ($108 per member per year). Pro includes unlimited projects, team permissions, and 50 GB of storage per workspace. Business costs $24 per member per month on monthly billing, or $19 per member per month billed annually ($228 per member per year). Business adds SAML SSO, audit logs, and 500 GB per workspace. Annual Pro billing saves 25% compared with monthly Pro billing. No Enterprise pricing is documented.",
    keywords: [
      "price",
      "pricing",
      "plan",
      "cost",
      "pro",
      "business",
      "free",
      "annual",
      "yearly",
      "monthly",
      "billing",
      "seat",
      "member",
      "storage",
    ],
  },
  {
    id: "trial",
    title: "Your 14-day trial",
    category: "Getting started",
    summary: "Try Pro with your team. No card required.",
    content:
      "New Relay workspaces can try Pro for 14 days without a credit card. At the end of the trial, a workspace moves to the Free plan unless an owner chooses a paid plan. Projects above the Free plan's limit become read-only; their data is not deleted. There is no documented trial extension policy.",
    keywords: ["trial", "try", "card", "fourteen", "14", "start", "expire"],
  },
  {
    id: "login",
    title: "Trouble signing in",
    category: "Account",
    summary: "The right steps for Google or email sign-in.",
    content:
      "Relay supports Google sign-in and email with password. First confirm which sign-in method the customer originally used. For Google sign-in: select Continue with Google and choose the same Google account used to create the workspace. A Relay password reset does not reset a Google password. If a Google sign-in loop continues, try a private browser window and temporarily disable browser extensions; if it persists, prepare a support handoff with the sign-in method and error text. For email and password: select Forgot password, use the account email, and check the spam folder. Reset links expire after 30 minutes; request a new link if expired. Never ask for a password, reset link, or verification code. If the issue persists after these steps, prepare a support handoff. Relay's documentation does not include administrative account recovery or MFA bypass procedures.",
    keywords: [
      "login",
      "log",
      "sign",
      "signin",
      "password",
      "google",
      "account",
      "access",
      "loop",
      "locked",
      "email",
      "reset",
    ],
  },
  {
    id: "members",
    title: "Invite your teammates",
    category: "Workspace",
    summary: "Invite people and choose their workspace role.",
    content:
      "Workspace owners and admins can invite teammates from Settings > Members > Invite members. Enter each teammate's work email and choose Admin or Member. Invitation links expire after 7 days. An owner or admin can resend an invitation from Settings > Members. Check the spam folder if an invitation is missing. On paid plans, an accepted invitation adds a billable seat with a prorated charge for the remaining billing period. Pending invitations are not billed. Free workspaces support up to 3 members.",
    keywords: [
      "invite",
      "invitation",
      "teammate",
      "member",
      "team",
      "role",
      "admin",
      "seat",
    ],
  },
  {
    id: "invoices",
    title: "Invoices & billing details",
    category: "Billing",
    summary: "Find invoices or update your billing information.",
    content:
      "Only workspace owners can manage billing. Open Settings > Billing > Invoices to download a PDF invoice. Billing details and the tax ID can be updated under Settings > Billing > Billing details for future invoices. To correct an already issued invoice, request support review. The assistant cannot access a real account, download a customer's invoice, change payment details, or issue refunds.",
    keywords: [
      "invoice",
      "receipt",
      "tax",
      "payment",
      "billing",
      "download",
      "vat",
      "pdf",
    ],
  },
  {
    id: "cancel",
    title: "Cancel or change a plan",
    category: "Billing",
    summary: "What happens to access and data after cancellation.",
    content:
      "A workspace owner can cancel from Settings > Billing > Manage plan. Cancellation takes effect at the end of the current paid billing period. Until then, paid features remain available. The workspace then moves to Free, and projects above the Free limit become read-only. Cancellation does not immediately delete workspace data. Refund eligibility is not documented and must be reviewed by support. The assistant cannot cancel a subscription or promise a refund.",
    keywords: [
      "cancel",
      "subscription",
      "refund",
      "downgrade",
      "delete",
      "change",
      "money",
      "back",
    ],
  },
  {
    id: "security",
    title: "Security & data questions",
    category: "Trust",
    summary: "Documented facts and questions that need a specialist.",
    content:
      "The sample Relay documentation states that data is encrypted in transit and at rest. It does not specify data hosting regions, EU-only residency, compliance certifications, retention periods, contractual guarantees, or a DPA. Do not infer these details. Requests for EU-only storage, GDPR or HIPAA compliance, SOC 2 certification, or other undocumented guarantees must be referred to the team for confirmation. No guarantee can be made from the available documentation.",
    keywords: [
      "security",
      "data",
      "eu",
      "europe",
      "region",
      "residency",
      "hosting",
      "gdpr",
      "hipaa",
      "soc",
      "compliance",
      "guarantee",
      "privacy",
      "encrypted",
      "dpa",
      "retention",
    ],
  },
  {
    id: "support",
    title: "Getting help from the team",
    category: "Support",
    summary: "A useful handoff, without starting over.",
    content:
      "This demonstration can prepare a handoff draft with the customer's question, facts the customer provided, steps already suggested, and the unresolved issue. The customer can preview and download the draft. No ticket is created or sent, no human support agent is connected, and no response time is promised. The assistant has no access to customer accounts or business systems. Do not request passwords, card numbers, or other sensitive information. All product details are fictional sample content.",
    keywords: [
      "support",
      "human",
      "agent",
      "person",
      "contact",
      "help",
      "handoff",
      "ticket",
      "unresolved",
      "still",
      "work",
    ],
  },
];

export type ChatTurn = { role: "user" | "assistant"; content: string };
export function retrieveArticles(messages: ChatTurn[]): Article[] {
  const users = messages.filter((m) => m.role === "user").slice(-3);
  const latest = users.at(-1)?.content.toLowerCase() ?? "";
  const previous = users
    .slice(0, -1)
    .map((m) => m.content.toLowerCase())
    .join(" ");
  const words = (text: string) => new Set(text.match(/[a-z0-9]+/g) ?? []);
  const currentWords = words(latest),
    previousWords = words(previous);
  return articles
    .map((article) => ({
      article,
      score: article.keywords.reduce(
        (sum, word) =>
          sum +
          (currentWords.has(word) ? 4 : 0) +
          (previousWords.has(word) ? 1 : 0),
        0,
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.article);
}
