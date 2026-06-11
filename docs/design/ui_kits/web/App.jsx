/* App.jsx — top-level shell + view router */

function App() {
  const [view, setView] = React.useState("chat"); // chat | workflows | builder
  const [messages, setMessages] = React.useState([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);

  const breadcrumbs = {
    chat: ["Knik AI", "Chat"],
    workflows: ["Workflows", "Workflow Hub"],
    builder: ["Workflows", "Builder", "Daily digest"],
  }[view];

  const onSend = (overrideText) => {
    const text = (overrideText || inputValue).trim();
    if (!text || isStreaming) return;
    const userMsg = { role: "user", content: text };
    setInputValue("");
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    // canned reply
    setTimeout(() => {
      const reply = fakeReply(text);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setIsStreaming(false);
    }, 700);
  };

  const onNewChat = () => {
    setMessages([]);
    setInputValue("");
    setView("chat");
  };

  const right =
    view === "workflows" ? (
      <Button
        variant="primary"
        size="sm"
        icon={<MS name="add" size={16} />}
        onClick={() => setView("builder")}
      >
        Create workflow
      </Button>
    ) : view === "chat" ? (
      <>
        <Button
          variant="ghost"
          size="sm"
          icon={<MS name="history" size={16} />}
        >
          History
        </Button>
        <Button variant="ghost" size="sm" icon={<MS name="tune" size={16} />}>
          Model
        </Button>
      </>
    ) : null;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <Sidebar
        view={view}
        onNavigate={(v) => setView(v)}
        onNewChat={onNewChat}
      />
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          background: "transparent",
        }}
      >
        <TopBar breadcrumbs={breadcrumbs} right={right} />
        {view === "chat" && messages.length === 0 && (
          <ChatHome
            inputValue={inputValue}
            onChange={setInputValue}
            onSend={onSend}
          />
        )}
        {view === "chat" && messages.length > 0 && (
          <ChatThread
            messages={messages}
            isStreaming={isStreaming}
            inputValue={inputValue}
            onChange={setInputValue}
            onSend={onSend}
            onReset={onNewChat}
          />
        )}
        {view === "workflows" && (
          <WorkflowHub onOpenBuilder={() => setView("builder")} />
        )}
        {view === "builder" && <WorkflowBuilder />}
      </main>
    </div>
  );
}

function fakeReply(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes("refactor"))
    return "Here are three quick wins. First, replace the inner `for` loop with a generator so we don't materialise the full list. Then swap `json.loads` for `orjson`. Finally, hoist the regex out of the hot path so it isn't recompiled on every call.";
  if (p.includes("blog"))
    return "Outline:\n1. Why TTS finally got good (Kokoro-82M, on-device latency)\n2. Where it fails today (long-form intonation, code-switching)\n3. Three deployment patterns: edge, hybrid, cloud\n4. Cost & power trade-offs\n5. What's next: voice cloning + multi-speaker streams.";
  if (p.includes("debug"))
    return "Looks like a missing dependency in `useEffect` — `[query]` is referenced inside but isn't listed, so React keeps the stale closure. Add it to the dep array and you should see the latest value on every render.";
  if (p.includes("api") || p.includes("doc"))
    return "Generated `openapi.yaml` with 8 endpoints. Each uses `application/json`, `Bearer` auth, and returns `{ data, meta }`. Want me to ship Postman + a TypeScript client?";
  if (p.includes("workflow"))
    return "Spun up a new workflow. Trigger is `cron(0 9 * * *)`. The LLM step uses `gemini-1.5-flash` and the digest is delivered via `email` + `slack`. You can open the builder to inspect each node.";
  return "Got it. I'll work through that and report back. (This is a demo reply — wire `window.claude.complete` to get real answers.)";
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
