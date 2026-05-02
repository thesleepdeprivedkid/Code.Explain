import OpenAI from "openai";
import { useState, useRef, useEffect } from "react";

const LANGUAGES = ["Auto-detect", "JavaScript", "Python", "Java", "C++", "C", "TypeScript", "Rust", "Go", "SQL", "HTML/CSS"];

const SAMPLE_CODE = `function quickSort(arr) {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  
  return [...quickSort(left), ...middle, ...quickSort(right)];
}`;

const DIFFICULTY_LEVELS = [
  { id: "beginner",     label: "Beginner",     hint: "Explain assuming no prior knowledge. Use simple analogies and avoid all jargon." },
  { id: "intermediate", label: "Intermediate", hint: "Explain assuming basic programming knowledge. You can use standard CS terms." },
  { id: "expert",       label: "Expert",       hint: "Be concise and technical. Assume strong CS knowledge. Skip basics, focus on nuance." },
];

const MODES = [
  { id: "explain",   label: "Explain",    title: "EXPLANATION" },
  { id: "breakdown", label: "Breakdown",  title: "STRUCTURED BREAKDOWN" },
  { id: "eli5",      label: "ELI5",       title: "SIMPLIFIED EXPLANATION" },
];

const EXT_TO_LANG = {
  js: "JavaScript", jsx: "JavaScript", ts: "TypeScript", tsx: "TypeScript",
  py: "Python", java: "Java", cpp: "C++", cc: "C++", c: "C",
  rs: "Rust", go: "Go", sql: "SQL", html: "HTML/CSS", css: "HTML/CSS",
};

export default function CodeExplainer() {
  const [code, setCode]           = useState("");
  const [language, setLanguage]   = useState("Auto-detect");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [activeTab, setActiveTab] = useState("explain");
  const [results, setResults]     = useState({ explain: null, breakdown: null, eli5: null });
  const [loading, setLoading]     = useState({ explain: false, breakdown: false, eli5: false });
  const [error, setError]         = useState("");
  const [charCount, setCharCount] = useState(0);
  const [splitView, setSplitView] = useState(false);
  const outputRef  = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { setCharCount(code.length); }, [code]);

  useEffect(() => {
    const anyDone = Object.values(results).some(r => r !== null);
    if (anyDone && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [results]);

  const getPrompt = (mode) => {
    const diff = DIFFICULTY_LEVELS.find(d => d.id === difficulty);
    const langHint = language !== "Auto-detect" ? ` The code is written in ${language}.` : "";
    const diffHint = ` ${diff.hint}`;
    switch (mode) {
      case "breakdown":
        return `Analyze this code and give a structured breakdown.${langHint}${diffHint} Format your response with these sections:\n\n**What it does** (1-2 sentences)\n\n**Line-by-line breakdown** (go through each meaningful line or block)\n\n**Key concepts used** (list the CS concepts/patterns at play)\n\n**Potential gotchas** (any edge cases or things to watch out for)`;
      case "eli5":
        return `Explain this code like I'm a complete beginner.${langHint} Use simple analogies, avoid jargon, and make it fun and easy to understand. Imagine you're explaining it to someone who has never coded before.`;
      default:
        return `Explain what this code does in clear, concise language.${langHint}${diffHint} Cover: the overall purpose, how it works step by step, and any important techniques or patterns used.`;
    }
  };

  const explainCode = async () => {
    if (!code.trim()) { setError("Paste some code first!"); return; }
    if (code.length > 8000) { setError("Code is too long. Keep it under 8000 characters."); return; }

    setError("");
    setResults({ explain: null, breakdown: null, eli5: null });

    const client = new OpenAI({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      dangerouslyAllowBrowser: true,
    });

    // Run all three modes in parallel
    MODES.forEach(async ({ id }) => {
      setLoading(prev => ({ ...prev, [id]: true }));
      try {
        const completion = await client.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages: [
            { role: "system", content: "You are an expert programming tutor. You explain code clearly, accurately, and helpfully. Use markdown formatting in your responses." },
            { role: "user",   content: `${getPrompt(id)}\n\n\`\`\`\n${code}\n\`\`\`` },
          ],
        });
        const text = completion.choices[0]?.message?.content || "";
        setResults(prev => ({ ...prev, [id]: text }));
      } catch (err) {
        setResults(prev => ({ ...prev, [id]: `⚠ Error: ${err.message}` }));
      } finally {
        setLoading(prev => ({ ...prev, [id]: false }));
      }
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    const detectedLang = EXT_TO_LANG[ext];
    if (detectedLang) setLanguage(detectedLang);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCode(ev.target.result);
      setResults({ explain: null, breakdown: null, eli5: null });
      setError("");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const loadSample = () => {
    setCode(SAMPLE_CODE);
    setLanguage("JavaScript");
    setResults({ explain: null, breakdown: null, eli5: null });
    setError("");
  };

  const clearAll = () => {
    setCode("");
    setResults({ explain: null, breakdown: null, eli5: null });
    setError("");
    setLanguage("Auto-detect");
    textareaRef.current?.focus();
  };

  const anyLoading = Object.values(loading).some(Boolean);
  const anyResult  = Object.values(results).some(r => r !== null);

  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split("\n");
    const elements = [];
    let i = 0;

    const renderInline = (str) => {
      const parts = str.split(/\*\*(.+?)\*\*/g);
      return parts.map((p, j) =>
        j % 2 === 1 ? <strong key={j} style={{ color: "#f5f0e8", fontWeight: 600 }}>{p}</strong> : p
      );
    };

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith("# ")) {
        elements.push(<h2 key={i} style={{ color: "#f0c040", fontFamily: "'DM Mono', monospace", fontSize: "1rem", fontWeight: 700, marginTop: "1.4rem", marginBottom: "0.5rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>{trimmed.slice(2)}</h2>);
      } else if (trimmed.startsWith("## ")) {
        elements.push(<h3 key={i} style={{ color: "#f0c040", fontFamily: "'DM Mono', monospace", fontSize: "0.85rem", fontWeight: 600, marginTop: "1.2rem", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{trimmed.slice(3)}</h3>);
      } else if (trimmed.startsWith("### ")) {
        elements.push(<h4 key={i} style={{ color: "#d4b840", fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", fontWeight: 600, marginTop: "1rem", marginBottom: "0.3rem", letterSpacing: "0.06em" }}>{trimmed.slice(4)}</h4>);
      } else if (trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.length > 4 && !trimmed.slice(2, -2).includes("**")) {
        elements.push(<h3 key={i} style={{ color: "#f0c040", fontFamily: "'DM Mono', monospace", fontSize: "0.85rem", fontWeight: 600, marginTop: "1.2rem", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{trimmed.slice(2, -2)}</h3>);
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        elements.push(
          <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem", paddingLeft: "0.5rem" }}>
            <span style={{ color: "#f0c040", flexShrink: 0 }}>▸</span>
            <span style={{ color: "#e0ddd5" }}>{renderInline(trimmed.slice(2))}</span>
          </div>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        const num = trimmed.match(/^(\d+\.\s)/)[0];
        elements.push(
          <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem", paddingLeft: "0.5rem" }}>
            <span style={{ color: "#f0c040", flexShrink: 0, fontFamily: "'DM Mono', monospace", fontSize: "0.8rem" }}>{num}</span>
            <span style={{ color: "#e0ddd5" }}>{renderInline(trimmed.slice(num.length))}</span>
          </div>
        );
      } else if (trimmed.startsWith("```")) {
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) { codeLines.push(lines[i]); i++; }
        elements.push(
          <pre key={i} style={{ background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "6px", padding: "0.75rem 1rem", margin: "0.5rem 0", fontSize: "0.78rem", overflowX: "auto", color: "#a8d8a8", fontFamily: "'DM Mono', monospace" }}>
            {codeLines.join("\n")}
          </pre>
        );
      } else if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        elements.push(<hr key={i} style={{ border: "none", borderTop: "1px solid #2a2a2a", margin: "0.8rem 0" }} />);
      } else if (trimmed === "") {
        elements.push(<div key={i} style={{ height: "0.4rem" }} />);
      } else {
        elements.push(<p key={i} style={{ color: "#d6d3ca", lineHeight: 1.7, marginBottom: "0.2rem", fontSize: "0.9rem" }}>{renderInline(trimmed)}</p>);
      }
      i++;
    }
    return elements;
  };

  const OutputPanel = ({ modeId, compact }) => {
    const modeInfo = MODES.find(m => m.id === modeId);
    const isLoading = loading[modeId];
    const result = results[modeId];
    if (!isLoading && !result) return null;
    return (
      <div style={{ background: "#141414", border: "1px solid #222", borderRadius: "12px", overflow: "hidden", flex: compact ? "1" : undefined, minWidth: 0 }}>
        <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid #1e1e1e", background: "#111", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f0c040" }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#666", letterSpacing: "0.1em", textTransform: "uppercase" }}>{modeInfo.title}</span>
          {isLoading && <div style={{ marginLeft: "auto", width: 14, height: 14, border: "2px solid #2a2a2a", borderTopColor: "#f0c040", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
        </div>
        {isLoading ? (
          <div style={{ padding: "2rem 1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#555" }}>analyzing...</span>
          </div>
        ) : (
          <>
            <div style={{ padding: "1.25rem 1.5rem 1.5rem", overflowY: "auto", maxHeight: compact ? "70vh" : undefined }}>{renderMarkdown(result)}</div>
            <div style={{ padding: "0 1.25rem 1rem", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(result)}>copy</button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        .app { min-height: 100vh; background: #0f0f0f; color: #e0ddd5; font-family: 'Syne', sans-serif; padding: 2rem 1rem 4rem; }
        .grid-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; background-image: linear-gradient(rgba(240,192,64,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(240,192,64,0.03) 1px, transparent 1px); background-size: 40px 40px; }
        .container { max-width: 1100px; margin: 0 auto; position: relative; z-index: 1; }
        .header { margin-bottom: 2rem; display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
        .title { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; line-height: 1; letter-spacing: -0.03em; }
        .title-accent { color: #f0c040; }
        .subtitle { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: #666; margin-top: 0.5rem; letter-spacing: 0.05em; }
        .badge { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 4px; padding: 0.4rem 0.8rem; font-family: 'DM Mono', monospace; font-size: 0.7rem; color: #888; letter-spacing: 0.05em; }
        .card { background: #141414; border: 1px solid #222; border-radius: 12px; overflow: hidden; margin-bottom: 1.25rem; }
        .card-header { padding: 0.75rem 1.25rem; border-bottom: 1px solid #1e1e1e; display: flex; align-items: center; justify-content: space-between; background: #111; flex-wrap: wrap; gap: 0.5rem; }
        .card-title { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: #555; letter-spacing: 0.1em; text-transform: uppercase; }
        .controls-row { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
        select { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 6px; color: #ccc; font-family: 'DM Mono', monospace; font-size: 0.75rem; padding: 0.4rem 0.75rem; cursor: pointer; outline: none; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.5rem center; padding-right: 1.75rem; transition: border-color 0.2s; }
        select:hover { border-color: #444; }
        .tab { background: transparent; border: 1px solid transparent; border-radius: 6px; color: #555; font-family: 'DM Mono', monospace; font-size: 0.7rem; padding: 0.35rem 0.7rem; cursor: pointer; transition: all 0.15s; letter-spacing: 0.04em; text-transform: uppercase; }
        .tab:hover { color: #999; border-color: #333; }
        .tab.active { background: #f0c040; color: #0f0f0f; font-weight: 600; border-color: #f0c040; }
        .tab.done { border-color: #2a4a2a; color: #7ec88a; }
        .tab.done.active { background: #f0c040; color: #0f0f0f; border-color: #f0c040; }
        textarea { width: 100%; min-height: 240px; background: #141414; border: none; color: #c8ffa0; font-family: 'DM Mono', monospace; font-size: 0.82rem; line-height: 1.7; padding: 1.25rem; resize: vertical; outline: none; tab-size: 2; letter-spacing: 0.01em; }
        textarea::placeholder { color: #333; }
        .footer-bar { padding: 0.6rem 1.25rem; border-top: 1px solid #1e1e1e; display: flex; align-items: center; justify-content: space-between; background: #111; flex-wrap: wrap; gap: 0.5rem; }
        .char-count { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: #444; }
        .btn-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .btn { border-radius: 7px; font-family: 'DM Mono', monospace; font-size: 0.75rem; padding: 0.5rem 1rem; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; letter-spacing: 0.04em; font-weight: 500; }
        .btn-ghost { background: transparent; border-color: #2a2a2a; color: #666; }
        .btn-ghost:hover { border-color: #444; color: #999; }
        .btn-primary { background: #f0c040; color: #0a0a0a; border-color: #f0c040; font-weight: 700; font-size: 0.8rem; padding: 0.55rem 1.4rem; }
        .btn-primary:hover:not(:disabled) { background: #f5d060; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(240,192,64,0.25); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .error-box { background: #1a0808; border: 1px solid #4a1818; border-radius: 8px; padding: 0.75rem 1.25rem; font-family: 'DM Mono', monospace; font-size: 0.78rem; color: #f08080; margin-bottom: 1.25rem; }
        .diff-pills { display: flex; gap: 0.25rem; }
        .diff-pill { background: transparent; border: 1px solid #2a2a2a; border-radius: 6px; color: #555; font-family: 'DM Mono', monospace; font-size: 0.68rem; padding: 0.3rem 0.65rem; cursor: pointer; transition: all 0.15s; letter-spacing: 0.04em; }
        .diff-pill:hover { border-color: #444; color: #999; }
        .diff-pill.active { background: #1a1a2a; border-color: #5566aa; color: #aabbff; }
        .output-tabs { display: flex; gap: 0.25rem; padding: 0.75rem 1.25rem; border-bottom: 1px solid #1e1e1e; background: #111; }
        .split-view { display: flex; gap: 1rem; margin-bottom: 1.25rem; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease; }
        input[type="file"] { display: none; }
        @media (max-width: 700px) { .split-view { flex-direction: column; } }
      `}</style>

      <div className="app">
        <div className="grid-bg" />
        <div className="container">

          {/* Header */}
          <div className="header">
            <div>
              <div className="title">code<span className="title-accent">.</span>explain</div>
              <div className="subtitle">// paste code → get clarity → understand more</div>
            </div>
            <div className="badge">GROQ · LLAMA 3.3 70B</div>
          </div>

          {/* Config */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">CONFIG</span>
              <div className="controls-row">
                <select value={language} onChange={e => setLanguage(e.target.value)}>
                  {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                </select>
                <div className="diff-pills">
                  {DIFFICULTY_LEVELS.map(d => (
                    <button key={d.id} className={`diff-pill ${difficulty === d.id ? "active" : ""}`} onClick={() => setDifficulty(d.id)}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <button className="btn btn-ghost" onClick={() => setSplitView(v => !v)} style={{ fontSize: "0.68rem", padding: "0.3rem 0.65rem", borderColor: splitView ? "#555" : "#2a2a2a", color: splitView ? "#ccc" : "#666" }}>
                  {splitView ? "⊟ split" : "⊞ split"}
                </button>
              </div>
            </div>
          </div>

          {/* Code Input */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">INPUT // PASTE OR UPLOAD YOUR CODE</span>
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="// paste your code here, or upload a file below..."
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
            <div className="footer-bar">
              <span className="char-count">{charCount.toLocaleString()} chars</span>
              <div className="btn-row">
                <input ref={fileInputRef} type="file" accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.cc,.c,.rs,.go,.sql,.html,.css" onChange={handleFileUpload} />
                <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>↑ upload file</button>
                <button className="btn btn-ghost" onClick={loadSample}>load sample</button>
                <button className="btn btn-ghost" onClick={clearAll}>clear</button>
                <button className="btn btn-primary" onClick={explainCode} disabled={anyLoading}>
                  {anyLoading ? "analyzing..." : "→ explain all"}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && <div className="error-box">⚠ {error}</div>}

          {/* Output */}
          {anyResult || anyLoading ? (
            <div ref={outputRef} className="fade-up">
              {splitView ? (
                /* Split view — all 3 side by side */
                <div className="split-view">
                  {MODES.map(m => <OutputPanel key={m.id} modeId={m.id} compact />)}
                </div>
              ) : (
                /* Tabbed view */
                <div className="card">
                  <div className="output-tabs">
                    {MODES.map(m => (
                      <button
                        key={m.id}
                        className={`tab ${activeTab === m.id ? "active" : ""} ${results[m.id] ? "done" : ""}`}
                        onClick={() => setActiveTab(m.id)}
                      >
                        {loading[m.id] ? `${m.label} …` : results[m.id] ? `✓ ${m.label}` : m.label}
                      </button>
                    ))}
                  </div>
                  {loading[activeTab] ? (
                    <div style={{ padding: "2.5rem 1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: 28, height: 28, border: "2px solid #2a2a2a", borderTopColor: "#f0c040", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#555" }}>reading your code...</span>
                    </div>
                  ) : results[activeTab] ? (
                    <>
                      <div style={{ padding: "1.5rem 1.5rem 1rem" }}>{renderMarkdown(results[activeTab])}</div>
                      <div style={{ padding: "0 1.25rem 1.25rem", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(results[activeTab])}>copy</button>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: "2rem 1.5rem", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#444" }}>
                      waiting for result...
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}

        </div>
      </div>
    </>
  );
}
