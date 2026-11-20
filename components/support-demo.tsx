"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, BookOpen, Check, ChevronRight, CircleHelp, Code2, Download, FileText, Layers3, LifeBuoy, MessageSquare, Plus, RotateCcw, ShieldCheck, Sparkles, X } from "lucide-react";
import { articles, type Article } from "@/lib/knowledge";
import { formatHandoff, type Answer, type ChatMessage } from "@/lib/contracts";

const scenarios = [
  { id: "pricing", title: "Find the right plan", description: "A useful answer. A relevant follow-up.", prompt: "How much is the Pro plan?", icon: Layers3, tag: "Answers with sources" },
  { id: "login", title: "Get back into your account", description: "A little context makes all the difference.", prompt: "I can't log in to my account.", icon: LifeBuoy, tag: "Guided troubleshooting" },
  { id: "trust", title: "Know when to ask a human", description: "Clear limits. A thoughtful handoff.", prompt: "Can you guarantee EU-only data storage?", icon: ShieldCheck, tag: "Responsible escalation" },
];

const welcome = (): ChatMessage => ({ id: "welcome", role: "assistant", content: "Hi, I’m Relay’s support assistant. I can help with plans, your account, and your workspace. What would you like to know?" });
type Modal = { type: "article"; article: Article; quote?: string } | { type: "handoff"; handoff: NonNullable<Answer["handoff"]> } | { type: "embed" } | { type: "about" } | null;

export default function SupportDemo({ embedded = false }: { embedded?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([welcome()]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scenario, setScenario] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [copied, setCopied] = useState(false);
  const [mobileLibrary, setMobileLibrary] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const latest = [...messages].reverse().find(m => m.result)?.result;
  const cited = new Set(latest?.citations.map(c => c.sourceId) ?? []);
  const lastAssistant = messages.at(-1)?.role === "assistant" ? messages.at(-1) : undefined;

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, busy, error]);
  useEffect(() => { if (modal) dialogRef.current?.showModal(); else dialogRef.current?.close(); setCopied(false); }, [modal]);
  useEffect(() => () => abortRef.current?.abort(), []);

  function reset() {
    abortRef.current?.abort(); abortRef.current = null;
    setMessages([welcome()]); setInput(""); setError(""); setScenario(null); setBusy(false);
  }

  async function send(text: string, fresh = false) {
    if (!text.trim() || busy) return;
    const user: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text.trim() };
    const next = [...(fresh ? [welcome()] : messages), user];
    setMessages(next); setInput(""); setError(""); setBusy(true);
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next.filter(m => m.id !== "welcome").slice(-15).map(({ role, content }) => ({ role, content })) }), signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      if (!controller.signal.aborted) setMessages([...next, { id: crypto.randomUUID(), role: "assistant", content: data.result.answer, result: data.result, latencyMs: data.latencyMs }]);
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Connection interrupted. Please try again.");
    } finally {
      if (abortRef.current === controller) { setBusy(false); abortRef.current = null; inputRef.current?.focus(); }
    }
  }

  async function retry() {
    const last = messages.at(-1);
    if (!last || last.role !== "user" || busy) return;
    setBusy(true); setError("");
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: messages.filter(m => m.id !== "welcome").slice(-15).map(({ role, content }) => ({ role, content })) }), signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Please try again.");
      if (!controller.signal.aborted) setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: data.result.answer, result: data.result, latencyMs: data.latencyMs }]);
    } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Please try again."); }
    finally { if (abortRef.current === controller) { setBusy(false); abortRef.current = null; } }
  }

  function openHandoff() {
    const handoff = latest?.handoff ?? {
      issue: messages.filter(m => m.role === "user").at(-1)?.content || "General support inquiry",
      confirmed: messages.filter(m => m.role === "user").map(m => m.content),
      stepsTried: [], stepsSuggested: [], unresolved: "Please review the full conversation below. This manual draft has not classified the troubleshooting steps.",
    };
    setModal({ type: "handoff", handoff });
  }

  function downloadDraft(handoff: NonNullable<Answer["handoff"]>) {
    const url = URL.createObjectURL(new Blob([formatHandoff(handoff, messages)], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "relay-handoff-draft.txt"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const snippet = typeof window === "undefined" ? "" : `<script src="${window.location.origin}/embed.js" defer></script>`;
  const library = <aside className={`library ${mobileLibrary ? "mobile-open" : ""}`}>
    <div className="rail-heading"><span><BookOpen size={17} /> KNOWLEDGE LIBRARY</span><span className="count">08</span></div>
    <h3>Good answers have a source.</h3>
    <p className="muted library-intro">Explore the sample articles behind the conversation.</p>
    <div className="article-list">{articles.map(article => <button key={article.id} className={`article-button ${cited.has(article.id) ? "cited" : ""}`} onClick={() => setModal({ type: "article", article })}>
      <span className="article-icon"><FileText size={17} /></span><span><strong>{article.title}</strong><small>{article.category}{cited.has(article.id) && " · Cited in reply"}</small></span><ChevronRight size={15} />
    </button>)}</div>
    <div className="library-note"><ShieldCheck size={18} /><p>Missing information is a reason to ask the team, never to make a promise.</p></div>
  </aside>;

  return <div className={embedded ? "app embedded" : "app"}>
    {!embedded && <>
      <header className="site-header"><a href="/" className="brand"><span className="brand-mark"><Layers3 size={24} strokeWidth={1.8} /></span>relay<span className="brand-divider" /> <span className="brand-sub">Support studio</span></a>
        <nav aria-label="Main navigation"><a href="/website">Website preview</a><button className="quiet-button" onClick={() => setModal({ type: "about" })}><CircleHelp size={16} /> About this demo</button><span className="prototype-tag">WORKING PROTOTYPE</span></nav>
      </header>
      <section className="intro"><div><div className="eyebrow"><span /> BUILT FOR THE MOMENT SOMEONE NEEDS HELP</div><h1>A more helpful<br className="mobile-br" /> kind of <span>support.</span></h1><p>Answers with context. Follow-ups that make sense. A clear path to your team.</p></div><div className="intro-note"><span className="asterisk">✳</span><p>A small demo.<br />A complete support journey.</p><span className="note-line" /></div></section>
    </>}

    <main className="workspace">
      {!embedded && <aside className="scenarios"><div className="rail-heading">TAKE IT FOR A SPIN</div><h2>Start with<br />a real question.</h2><p className="muted">Choose a scenario, then keep the conversation going.</p><div className="scenario-list">{scenarios.map(s => <button disabled={busy} key={s.id} className={`scenario-card ${scenario === s.id ? "selected" : ""}`} onClick={() => { setScenario(s.id); void send(s.prompt, true); }}>
        <div className="scenario-top"><s.icon size={20} /><ChevronRight size={16} /></div><h3>{s.title}</h3><p>{s.description}</p><span className="scenario-tag">{s.tag}</span>
      </button>)}</div><button className="integration-link" onClick={() => setModal({ type: "embed" })}><Code2 size={17} /><span>Made for your website<small>Explore the embed</small></span><ChevronRight size={16} /></button></aside>}

      <section className="chat-panel" aria-label="Relay support chat">
        <div className="chat-header"><div className="assistant-avatar"><Sparkles size={23} /></div><div><h2>Relay assistant</h2><p>Here to help you find your next step</p></div><button className="icon-button" title="New conversation" aria-label="New conversation" onClick={reset}><RotateCcw size={18} /></button></div>
        <div className="chat-context"><span><BookOpen size={14} /> Grounded in sample support articles</span><span className="sample-label">DEMO</span></div>
        <div className="messages" role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions">
          <div className="conversation-start">A LITTLE HELP, RIGHT WHEN YOU NEED IT</div>
          {messages.map(message => <div key={message.id} className={`message ${message.role}`}>
            {message.role === "assistant" && <div className="message-author"><span className="tiny-mark"><Sparkles size={12} /></span> Relay <span>Assistant</span></div>}
            <div className="message-bubble">{message.content}</div>
            {message.result?.citations.length ? <div className="citations">{message.result.citations.map((c, i) => { const article = articles.find(a => a.id === c.sourceId); return article ? <button key={`${c.sourceId}-${i}`} onClick={() => setModal({ type: "article", article, quote: c.quote })}><FileText size={13} />{article.title}<ChevronRight size={12} /></button> : null; })}</div> : null}
            {message.result?.status === "clarify" && <div className="response-note"><MessageSquare size={12} /> A quick question to get this right</div>}
            {message.result?.status === "handoff" && <button className="handoff-inline" onClick={() => message.result?.handoff ? setModal({ type: "handoff", handoff: message.result.handoff }) : openHandoff()}><LifeBuoy size={16} /> Preview handoff draft<ChevronRight size={15} /></button>}
            {message.latencyMs !== undefined && <span className="response-time">Live AI · {(message.latencyMs / 1000).toFixed(1)}s</span>}
          </div>)}
          {busy && <div className="thinking"><span /><span /><span /><p>Checking the support articles…</p></div>}
          {error && <div className="error-message" role="alert"><p>{error}</p><button onClick={() => void retry()}>Try again</button></div>}
          {!busy && !error && lastAssistant?.result?.suggestions.length ? <div className="follow-ups">{lastAssistant.result.suggestions.map(text => <button key={text} onClick={() => void send(text)}>{text}<Plus size={12} /></button>)}</div> : null}
          {messages.length === 1 && <div className="welcome-options"><p>A few things you can ask</p>{["How much is the Pro plan?", "I can’t log in.", "Can you guarantee EU-only data storage?"].map(text => <button key={text} onClick={() => void send(text)}>{text}<ChevronRight size={14} /></button>)}</div>}
          <div ref={bottom} />
        </div>
        <div className="composer-area"><form onSubmit={event => { event.preventDefault(); void send(input); }}><label className="sr-only" htmlFor="chat-input">Your question</label><textarea id="chat-input" ref={inputRef} value={input} onChange={event => setInput(event.target.value)} maxLength={2000} rows={2} placeholder="Ask a question about Relay…" onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(input); } }} /><div className="composer-bottom"><span>{input.length > 1800 ? `${input.length}/2000` : "A question is a good place to start."}</span><button className="send-button" disabled={busy || !input.trim()} type="submit" aria-label="Send message"><ArrowUp size={19} /></button></div></form>
          <div className="chat-footer"><span><ShieldCheck size={12} /> Fictional product. Please don’t share personal data.</span><button onClick={openHandoff} disabled={messages.length < 2}>Handoff draft</button></div>
        </div>
      </section>
      {!embedded && library}
    </main>
    {!embedded && <><button className="mobile-library-toggle" onClick={() => setMobileLibrary(!mobileLibrary)}><BookOpen size={16} />{mobileLibrary ? "Hide" : "Browse"} knowledge library</button><footer className="site-footer"><span>A working exploration of thoughtful AI support.</span><div><span>Sample content</span><i /><span>Live AI responses</span><i /><span>Handoff drafts only</span></div><button onClick={() => setModal({ type: "about" })}>Built by Shawn</button></footer></>}

    <dialog ref={dialogRef} className="modal" onCancel={() => setModal(null)} onClick={event => { if (event.target === event.currentTarget) setModal(null); }} aria-labelledby="modal-title">
      <div className="modal-inner"><button className="modal-close icon-button" aria-label="Close dialog" onClick={() => setModal(null)}><X size={20} /></button>
        {modal?.type === "article" && <><div className="eyebrow"><BookOpen size={15} /> SAMPLE KNOWLEDGE ARTICLE</div><h2 id="modal-title">{modal.article.title}</h2><p className="modal-subtitle">{modal.article.category} · Fictional Relay documentation</p>{modal.quote && <blockquote><span>CITED IN THIS ANSWER</span>{modal.quote}</blockquote>}<div className="article-content">{modal.article.content.split(/(?<=\.) /).map((p, i) => <p key={i}>{p}</p>)}</div><div className="modal-note">These are sample product policies, created for this demonstration.</div></>}
        {modal?.type === "handoff" && <><div className="eyebrow"><LifeBuoy size={15} /> A CLEAR NEXT STEP</div><h2 id="modal-title">Ready for a human.</h2><p className="modal-subtitle">A handoff draft with the context your team needs.</p><div className="draft-banner">Draft only — nothing has been sent or created.</div><div className="handoff-fields"><section><h3>Customer’s question</h3><p>{modal.handoff.issue}</p></section><section><h3>Customer-provided details</h3><ul>{(modal.handoff.confirmed.length ? modal.handoff.confirmed : ["No additional details confirmed."]).map((v, i) => <li key={i}>{v}</li>)}</ul></section><section><h3>Steps the customer tried</h3><ul>{(modal.handoff.stepsTried.length ? modal.handoff.stepsTried : ["No completed steps confirmed."]).map((v, i) => <li key={i}>{v}</li>)}</ul></section><section><h3>Steps suggested</h3><ul>{(modal.handoff.stepsSuggested.length ? modal.handoff.stepsSuggested : ["None recorded."]).map((v, i) => <li key={i}>{v}</li>)}</ul></section><section><h3>Needs follow-up</h3><p>{modal.handoff.unresolved}</p></section><details><summary>Full conversation · {messages.length} messages</summary>{messages.map(m => <p key={m.id}><strong>{m.role === "user" ? "Customer" : "Assistant"}:</strong> {m.content}</p>)}</details></div><button className="primary-button" onClick={() => downloadDraft(modal.handoff)}><Download size={17} /> Download draft & transcript</button></>}
        {modal?.type === "embed" && <><div className="eyebrow"><Code2 size={15} /> WEBSITE INTEGRATION</div><h2 id="modal-title">At home on your website.</h2><p className="modal-subtitle">The same assistant, in a lightweight floating widget.</p><a className="preview-link" href="/website"><span className="preview-icon"><MessageSquare size={25} /></span><span><strong>Explore the website preview</strong><small>Open the chat in the bottom-right corner.</small></span><ChevronRight size={20} /></a><h3 className="snippet-heading">One script. A working chat.</h3><pre className="code-snippet"><code>{snippet}</code></pre><button className="secondary-button" onClick={async () => { try { await navigator.clipboard.writeText(snippet); setCopied(true); } catch { setCopied(false); } }}>{copied ? <Check size={16} /> : <Code2 size={16} />}{copied ? "Copied" : "Copy embed code"}</button><p className="modal-note">The iframe keeps styles separate from the host website. For a client release, we’d configure approved domains, brand settings, and the support destination.</p></>}
        {modal?.type === "about" && <><div className="eyebrow"><Sparkles size={15} /> ABOUT THIS DEMO</div><h2 id="modal-title">Small by design.<br />Useful by default.</h2><p className="modal-subtitle">A working website chatbot prototype built by Shawn.</p><div className="about-list"><section><BookOpen /><div><h3>Answers you can inspect</h3><p>Live AI uses retrieved sample articles. Open a citation to compare its supporting quote with the original source.</p></div></section><section><MessageSquare /><div><h3>Conversations with context</h3><p>Follow up about annual billing, or explain your sign-in method. The assistant uses the conversation to guide its next response.</p></div></section><section><LifeBuoy /><div><h3>A handoff with the details</h3><p>When the documentation doesn’t answer a question, preview and download a handoff draft. No ticketing service is connected.</p></div></section></div><div className="modal-note">Relay is fictional. This prototype does not access customer accounts or execute billing actions. Chat history lives in this page’s memory; questions are sent to the AI provider to generate answers. AI can make mistakes. Please use sample questions only.</div></>}
      </div>
    </dialog>
  </div>;
}
