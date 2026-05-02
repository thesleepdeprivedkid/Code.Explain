import OpenAI from "openai";
import { useState, useRef, useEffect } from "react";

const LANGUAGES = ["Auto-detect", "JavaScript", "Python", "Java", "C++", "C", "TypeScript", "Rust", "Go", "SQL", "HTML/CSS"];

const SAMPLES = {
  "JavaScript": [
    { label: "Quick Sort", code: `function quickSort(arr) {\n  if (arr.length <= 1) return arr;\n  const pivot = arr[Math.floor(arr.length / 2)];\n  const left = arr.filter(x => x < pivot);\n  const middle = arr.filter(x => x === pivot);\n  const right = arr.filter(x => x > pivot);\n  return [...quickSort(left), ...middle, ...quickSort(right)];\n}` },
    { label: "Debounce", code: `function debounce(fn, delay) {\n  let timer;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}` },
    { label: "Flatten Array", code: `function flatten(arr) {\n  return arr.reduce((flat, item) =>\n    flat.concat(Array.isArray(item) ? flatten(item) : item), []);\n}` },
  ],
  "Python": [
    { label: "Binary Search", code: `def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1` },
    { label: "Fibonacci DP", code: `def fib(n, memo={}):\n    if n in memo:\n        return memo[n]\n    if n <= 1:\n        return n\n    memo[n] = fib(n-1, memo) + fib(n-2, memo)\n    return memo[n]` },
    { label: "Decorator", code: `def timer(func):\n    import time\n    def wrapper(*args, **kwargs):\n        start = time.time()\n        result = func(*args, **kwargs)\n        print(f\"{func.__name__} took {time.time()-start:.4f}s\")\n        return result\n    return wrapper` },
  ],
  "Java": [
    { label: "Linked List", code: `class Node {\n    int data; Node next;\n    Node(int data) { this.data = data; this.next = null; }\n}\nclass LinkedList {\n    Node head;\n    void insert(int data) {\n        Node node = new Node(data);\n        if (head == null) { head = node; return; }\n        Node curr = head;\n        while (curr.next != null) curr = curr.next;\n        curr.next = node;\n    }\n}` },
    { label: "Bubble Sort", code: `void bubbleSort(int[] arr) {\n    int n = arr.length;\n    for (int i = 0; i < n-1; i++)\n        for (int j = 0; j < n-i-1; j++)\n            if (arr[j] > arr[j+1]) {\n                int temp = arr[j];\n                arr[j] = arr[j+1];\n                arr[j+1] = temp;\n            }\n}` },
    { label: "Stack", code: `class Stack {\n    private int[] arr;\n    private int top;\n    Stack(int size) { arr = new int[size]; top = -1; }\n    void push(int x) { arr[++top] = x; }\n    int pop() { return arr[top--]; }\n    int peek() { return arr[top]; }\n    boolean isEmpty() { return top == -1; }\n}` },
  ],
  "C++": [
    { label: "Merge Sort", code: `void merge(vector<int>& arr, int l, int m, int r) {\n    vector<int> left(arr.begin()+l, arr.begin()+m+1);\n    vector<int> right(arr.begin()+m+1, arr.begin()+r+1);\n    int i=0,j=0,k=l;\n    while(i<left.size()&&j<right.size())\n        arr[k++] = left[i]<=right[j] ? left[i++] : right[j++];\n    while(i<left.size()) arr[k++]=left[i++];\n    while(j<right.size()) arr[k++]=right[j++];\n}` },
    { label: "Binary Tree", code: `struct Node {\n    int val;\n    Node *left, *right;\n    Node(int v): val(v), left(nullptr), right(nullptr){}\n};\nvoid inorder(Node* root) {\n    if (!root) return;\n    inorder(root->left);\n    cout << root->val << " ";\n    inorder(root->right);\n}` },
    { label: "Smart Ptr", code: `template<typename T>\nclass UniquePtr {\n    T* ptr;\npublic:\n    UniquePtr(T* p): ptr(p) {}\n    ~UniquePtr() { delete ptr; }\n    T& operator*() { return *ptr; }\n    T* operator->() { return ptr; }\n    UniquePtr(const UniquePtr&) = delete;\n};` },
  ],
  "C": [
    { label: "Linked List", code: `struct Node {\n    int data;\n    struct Node* next;\n};\nstruct Node* insert(struct Node* head, int data) {\n    struct Node* node = malloc(sizeof(struct Node));\n    node->data = data;\n    node->next = head;\n    return node;\n}` },
    { label: "String Reverse", code: `void reverse(char* str) {\n    int n = strlen(str);\n    for (int i = 0; i < n/2; i++) {\n        char tmp = str[i];\n        str[i] = str[n-1-i];\n        str[n-1-i] = tmp;\n    }\n}` },
    { label: "Matrix Mul", code: `#define N 3\nvoid matMul(int A[][N], int B[][N], int C[][N]) {\n    for (int i=0;i<N;i++)\n        for (int j=0;j<N;j++) {\n            C[i][j] = 0;\n            for (int k=0;k<N;k++)\n                C[i][j] += A[i][k]*B[k][j];\n        }\n}` },
  ],
  "TypeScript": [
    { label: "Generic Stack", code: `class Stack<T> {\n  private items: T[] = [];\n  push(item: T): void { this.items.push(item); }\n  pop(): T | undefined { return this.items.pop(); }\n  peek(): T | undefined { return this.items[this.items.length - 1]; }\n  isEmpty(): boolean { return this.items.length === 0; }\n}` },
    { label: "Deep Readonly", code: `type DeepReadonly<T> = {\n  readonly [K in keyof T]: T[K] extends object\n    ? DeepReadonly<T[K]>\n    : T[K];\n};` },
    { label: "Async Retry", code: `async function retry<T>(fn: () => Promise<T>, attempts: number): Promise<T> {\n  for (let i = 0; i < attempts; i++) {\n    try { return await fn(); }\n    catch (e) {\n      if (i === attempts - 1) throw e;\n      await new Promise(r => setTimeout(r, 1000 * 2 ** i));\n    }\n  }\n  throw new Error("unreachable");\n}` },
  ],
  "Rust": [
    { label: "Fibonacci", code: `fn fibonacci(n: u64) -> u64 {\n    match n {\n        0 => 0,\n        1 => 1,\n        _ => {\n            let mut a = 0u64;\n            let mut b = 1u64;\n            for _ in 2..=n { let c = a + b; a = b; b = c; }\n            b\n        }\n    }\n}` },
    { label: "Lifetimes", code: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {\n    if x.len() > y.len() { x } else { y }\n}\nfn main() {\n    let s1 = String::from("long string");\n    let s2 = String::from("xyz");\n    let result = longest(s1.as_str(), s2.as_str());\n    println!("Longest: {}", result);\n}` },
    { label: "Iterator", code: `struct Counter { count: u32 }\nimpl Counter {\n    fn new() -> Self { Counter { count: 0 } }\n}\nimpl Iterator for Counter {\n    type Item = u32;\n    fn next(&mut self) -> Option<u32> {\n        self.count += 1;\n        if self.count < 6 { Some(self.count) } else { None }\n    }\n}` },
  ],
  "Go": [
    { label: "Goroutine", code: `func producer(ch chan<- int) {\n    for i := 0; i < 5; i++ { ch <- i }\n    close(ch)\n}\nfunc main() {\n    ch := make(chan int)\n    go producer(ch)\n    for v := range ch { fmt.Println(v) }\n}` },
    { label: "HTTP Server", code: `func handler(w http.ResponseWriter, r *http.Request) {\n    name := r.URL.Query().Get("name")\n    if name == "" { name = "World" }\n    fmt.Fprintf(w, "Hello, %s!", name)\n}\nfunc main() {\n    http.HandleFunc("/", handler)\n    http.ListenAndServe(":8080", nil)\n}` },
    { label: "Binary Search", code: `func binarySearch(arr []int, target int) int {\n    left, right := 0, len(arr)-1\n    for left <= right {\n        mid := (left + right) / 2\n        if arr[mid] == target { return mid }\n        else if arr[mid] < target { left = mid + 1 }\n        else { right = mid - 1 }\n    }\n    return -1\n}` },
  ],
  "SQL": [
    { label: "Window Fn", code: `SELECT\n  employee_id, department, salary,\n  RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank,\n  AVG(salary) OVER (PARTITION BY department) AS dept_avg\nFROM employees;` },
    { label: "Recursive CTE", code: `WITH RECURSIVE hierarchy AS (\n  SELECT id, name, manager_id, 0 AS level\n  FROM employees WHERE manager_id IS NULL\n  UNION ALL\n  SELECT e.id, e.name, e.manager_id, h.level + 1\n  FROM employees e JOIN hierarchy h ON e.manager_id = h.id\n)\nSELECT * FROM hierarchy ORDER BY level;` },
    { label: "Pivot", code: `SELECT product,\n  SUM(CASE WHEN month='Jan' THEN sales END) AS Jan,\n  SUM(CASE WHEN month='Feb' THEN sales END) AS Feb,\n  SUM(CASE WHEN month='Mar' THEN sales END) AS Mar\nFROM monthly_sales GROUP BY product;` },
  ],
  "HTML/CSS": [
    { label: "CSS Grid", code: `.container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n  gap: 1rem;\n}\n.header { grid-column: 1 / -1; }\n.sidebar { grid-row: 2 / 4; }\n.main { grid-column: 2 / -1; }` },
    { label: "Animation", code: `@keyframes pulse {\n  0%, 100% { transform: scale(1); opacity: 1; }\n  50% { transform: scale(1.05); opacity: 0.8; }\n}\n.btn {\n  animation: pulse 2s ease-in-out infinite;\n  transition: all 0.3s ease;\n}\n.btn:hover { animation-play-state: paused; }` },
    { label: "Flexbox Card", code: `.card {\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  min-height: 200px;\n  padding: 1.5rem;\n  border-radius: 12px;\n  box-shadow: 0 4px 24px rgba(0,0,0,0.1);\n}\n.card-footer { margin-top: auto; }` },
  ],
};

const MODES = [
  { id: "explain",   label: "Explain",   title: "EXPLANATION" },
  { id: "breakdown", label: "Breakdown", title: "STRUCTURED BREAKDOWN" },
  { id: "eli5",      label: "ELI5",      title: "SIMPLIFIED" },
];

const EXT_TO_LANG = {
  js:"JavaScript",jsx:"JavaScript",ts:"TypeScript",tsx:"TypeScript",
  py:"Python",java:"Java",cpp:"C++",cc:"C++",c:"C",
  rs:"Rust",go:"Go",sql:"SQL",html:"HTML/CSS",css:"HTML/CSS",
};

export default function CodeExplainer() {
  const [code, setCode]             = useState("");
  const [language, setLanguage]     = useState("Auto-detect");
  const [activeTab, setActiveTab]   = useState("explain");
  const [results, setResults]       = useState({ explain:null, breakdown:null, eli5:null });
  const [loading, setLoading]       = useState({ explain:false, breakdown:false, eli5:false });
  const [complexity, setComplexity] = useState(null);
  const [compLoading, setCompLoading] = useState(false);
  const [corrections, setCorrections] = useState(null);
  const [corrLoading, setCorrLoading] = useState(false);
  const [error, setError]           = useState("");
  const [charCount, setCharCount]   = useState(0);
  const [splitView, setSplitView]   = useState(false);
  const [sampleLang, setSampleLang] = useState("JavaScript");
  const outputRef  = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { setCharCount(code.length); }, [code]);
  useEffect(() => {
    if (Object.values(results).some(r=>r!==null) && outputRef.current)
      outputRef.current.scrollIntoView({ behavior:"smooth", block:"start" });
  }, [results]);

  const getClient = () => new OpenAI({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
    dangerouslyAllowBrowser: true,
  });

  const getPrompt = (mode) => {
    const lh = language !== "Auto-detect" ? ` The code is written in ${language}.` : "";
    switch(mode) {
      case "breakdown": return `Analyze this code and give a structured breakdown.${lh} Use these sections:\n\n**What it does**\n\n**Line-by-line breakdown**\n\n**Key concepts used**\n\n**Potential gotchas**`;
      case "eli5": return `Explain this code like I'm a complete beginner.${lh} Use simple analogies, avoid jargon.`;
      default: return `Explain what this code does clearly.${lh} Cover: purpose, how it works step by step, and key techniques.`;
    }
  };

  const explainCode = async () => {
    if (!code.trim()) { setError("Paste some code first!"); return; }
    if (code.length > 8000) { setError("Code is too long. Keep it under 8000 characters."); return; }
    setError("");
    setResults({ explain:null, breakdown:null, eli5:null });
    setComplexity(null);
    setCorrections(null);
    const client = getClient();

    MODES.forEach(async ({ id }) => {
      setLoading(prev => ({ ...prev, [id]:true }));
      try {
        const r = await client.chat.completions.create({
          model: "llama-3.3-70b-versatile", max_tokens: 1000,
          messages: [
            { role:"system", content:"You are an expert programming tutor. Use markdown formatting." },
            { role:"user",   content:`${getPrompt(id)}\n\n\`\`\`\n${code}\n\`\`\`` },
          ],
        });
        setResults(prev => ({ ...prev, [id]: r.choices[0]?.message?.content || "" }));
      } catch(e) {
        setResults(prev => ({ ...prev, [id]: `Error: ${e.message}` }));
      } finally {
        setLoading(prev => ({ ...prev, [id]:false }));
      }
    });

    setCompLoading(true);
    try {
      const lh = language !== "Auto-detect" ? ` The code is in ${language}.` : "";
      const r = await client.chat.completions.create({
        model:"llama-3.3-70b-versatile", max_tokens:300,
        messages:[
          { role:"system", content:"You are a CS expert. Respond ONLY in raw JSON, no markdown, no backticks." },
          { role:"user", content:`Analyze this code.${lh} Return ONLY a JSON object with keys: "time", "space", "time_reason", "space_reason".\n\n${code}` },
        ],
      });
      setComplexity(JSON.parse(r.choices[0]?.message?.content?.replace(/```json|```/g,"").trim() || "{}"));
    } catch { setComplexity({ time:"N/A", space:"N/A", time_reason:"Could not analyze.", space_reason:"Could not analyze." }); }
    finally { setCompLoading(false); }

    setCorrLoading(true);
    try {
      const lh = language !== "Auto-detect" ? ` The code is in ${language}.` : "";
      const r = await client.chat.completions.create({
        model:"llama-3.3-70b-versatile", max_tokens:700,
        messages:[
          { role:"system", content:"You are a senior code reviewer. Respond ONLY in raw JSON, no markdown, no backticks." },
          { role:"user", content:`Review this code.${lh} Return ONLY a JSON object with keys:\n- "errors": array of {line, issue}\n- "optimizations": array of strings\n- "improved_code": string or null\n\nCode:\n${code}` },
        ],
      });
      setCorrections(JSON.parse(r.choices[0]?.message?.content?.replace(/```json|```/g,"").trim() || "{}"));
    } catch { setCorrections({ errors:[], optimizations:["Could not analyze."], improved_code:null }); }
    finally { setCorrLoading(false); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (EXT_TO_LANG[ext]) setLanguage(EXT_TO_LANG[ext]);
    const reader = new FileReader();
    reader.onload = (ev) => { setCode(ev.target.result); setResults({explain:null,breakdown:null,eli5:null}); setComplexity(null); setCorrections(null); setError(""); };
    reader.readAsText(file);
    e.target.value = "";
  };

  const clearAll = () => { setCode(""); setResults({explain:null,breakdown:null,eli5:null}); setComplexity(null); setCorrections(null); setError(""); setLanguage("Auto-detect"); textareaRef.current?.focus(); };

  const anyLoading = Object.values(loading).some(Boolean) || compLoading || corrLoading;
  const anyResult  = Object.values(results).some(r=>r!==null);

  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split("\n"); const els = []; let i = 0;
    const ri = (s) => s.split(/\*\*(.+?)\*\*/g).map((p,j) => j%2===1 ? <strong key={j} style={{color:"#f5f0e8",fontWeight:600}}>{p}</strong> : p);
    while (i < lines.length) {
      const t = lines[i].trim();
      if (t.startsWith("# ")) els.push(<h2 key={i} style={{color:"#f0c040",fontFamily:"'DM Mono',monospace",fontSize:"1rem",fontWeight:700,marginTop:"1.4rem",marginBottom:"0.5rem",textTransform:"uppercase"}}>{t.slice(2)}</h2>);
      else if (t.startsWith("## ")) els.push(<h3 key={i} style={{color:"#f0c040",fontFamily:"'DM Mono',monospace",fontSize:"0.85rem",fontWeight:600,marginTop:"1.2rem",marginBottom:"0.4rem",textTransform:"uppercase"}}>{t.slice(3)}</h3>);
      else if (t.startsWith("### ")) els.push(<h4 key={i} style={{color:"#d4b840",fontFamily:"'DM Mono',monospace",fontSize:"0.8rem",fontWeight:600,marginTop:"1rem",marginBottom:"0.3rem"}}>{t.slice(4)}</h4>);
      else if (t.startsWith("**")&&t.endsWith("**")&&t.length>4&&!t.slice(2,-2).includes("**")) els.push(<h3 key={i} style={{color:"#f0c040",fontFamily:"'DM Mono',monospace",fontSize:"0.85rem",fontWeight:600,marginTop:"1.2rem",marginBottom:"0.4rem",textTransform:"uppercase"}}>{t.slice(2,-2)}</h3>);
      else if (t.startsWith("- ")||t.startsWith("* ")) els.push(<div key={i} style={{display:"flex",gap:"0.5rem",marginBottom:"0.25rem",paddingLeft:"0.5rem"}}><span style={{color:"#f0c040",flexShrink:0}}>▸</span><span style={{color:"#e0ddd5"}}>{ri(t.slice(2))}</span></div>);
      else if (/^\d+\.\s/.test(t)) { const n=t.match(/^(\d+\.\s)/)[0]; els.push(<div key={i} style={{display:"flex",gap:"0.5rem",marginBottom:"0.25rem",paddingLeft:"0.5rem"}}><span style={{color:"#f0c040",flexShrink:0,fontFamily:"'DM Mono',monospace",fontSize:"0.8rem"}}>{n}</span><span style={{color:"#e0ddd5"}}>{ri(t.slice(n.length))}</span></div>); }
      else if (t.startsWith("```")) { const cl=[]; i++; while(i<lines.length&&!lines[i].trim().startsWith("```")){cl.push(lines[i]);i++;} els.push(<pre key={i} style={{background:"#0d0d0d",border:"1px solid #2a2a2a",borderRadius:"6px",padding:"0.75rem 1rem",margin:"0.5rem 0",fontSize:"0.78rem",overflowX:"auto",color:"#a8d8a8",fontFamily:"'DM Mono',monospace"}}>{cl.join("\n")}</pre>); }
      else if (t==="---"||t==="***") els.push(<hr key={i} style={{border:"none",borderTop:"1px solid #2a2a2a",margin:"0.8rem 0"}}/>);
      else if (t==="") els.push(<div key={i} style={{height:"0.4rem"}}/>);
      else els.push(<p key={i} style={{color:"#d6d3ca",lineHeight:1.7,marginBottom:"0.2rem",fontSize:"0.9rem"}}>{ri(t)}</p>);
      i++;
    }
    return els;
  };

  const availableSamples = SAMPLES[sampleLang] || SAMPLES["JavaScript"];

  const OutputTabs = () => (
    <div style={{display:"flex",gap:"0.25rem",flexWrap:"wrap"}}>
      {MODES.map(m => (
        <button key={m.id} className={`tab ${activeTab===m.id?"active":""} ${results[m.id]?"done":""}`} onClick={()=>setActiveTab(m.id)}>
          {loading[m.id]?`${m.label}…`:results[m.id]?`✓ ${m.label}`:m.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0a0a0a;}
        .app{min-height:100vh;background:#0f0f0f;color:#e0ddd5;font-family:'Syne',sans-serif;padding:2rem 1rem 0;display:flex;flex-direction:column;}
        .grid-bg{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(240,192,64,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(240,192,64,0.03) 1px,transparent 1px);background-size:40px 40px;}
        .container{max-width:1100px;margin:0 auto;position:relative;z-index:1;width:100%;flex:1;}
        .header{margin-bottom:2rem;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem;}
        .title{font-size:clamp(2rem,5vw,3rem);font-weight:800;line-height:1;letter-spacing:-0.03em;}
        .title-accent{color:#f0c040;}
        .subtitle{font-family:'DM Mono',monospace;font-size:0.75rem;color:#666;margin-top:0.5rem;letter-spacing:0.05em;}
        .badge{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:4px;padding:0.4rem 0.8rem;font-family:'DM Mono',monospace;font-size:0.7rem;color:#888;letter-spacing:0.05em;}
        .card{background:#141414;border:1px solid #222;border-radius:12px;overflow:hidden;margin-bottom:1.25rem;}
        .card-header{padding:0.75rem 1.25rem;border-bottom:1px solid #1e1e1e;display:flex;align-items:center;justify-content:space-between;background:#111;flex-wrap:wrap;gap:0.5rem;}
        .card-title{font-family:'DM Mono',monospace;font-size:0.7rem;color:#555;letter-spacing:0.1em;text-transform:uppercase;}
        .controls-row{display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;}
        select{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:6px;color:#ccc;font-family:'DM Mono',monospace;font-size:0.75rem;padding:0.4rem 0.75rem;cursor:pointer;outline:none;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 0.5rem center;padding-right:1.75rem;transition:border-color 0.2s;}
        select:hover{border-color:#444;}
        .tab{background:transparent;border:1px solid transparent;border-radius:6px;color:#555;font-family:'DM Mono',monospace;font-size:0.7rem;padding:0.35rem 0.7rem;cursor:pointer;transition:all 0.15s;letter-spacing:0.04em;text-transform:uppercase;}
        .tab:hover{color:#999;border-color:#333;}
        .tab.active{background:#f0c040;color:#0f0f0f;font-weight:600;border-color:#f0c040;}
        .tab.done{border-color:#2a4a2a;color:#7ec88a;}
        .tab.done.active{background:#f0c040;color:#0f0f0f;border-color:#f0c040;}
        textarea{width:100%;min-height:240px;background:#141414;border:none;color:#c8ffa0;font-family:'DM Mono',monospace;font-size:0.82rem;line-height:1.7;padding:1.25rem;resize:vertical;outline:none;tab-size:2;}
        textarea::placeholder{color:#333;}
        .footer-bar{padding:0.6rem 1.25rem;border-top:1px solid #1e1e1e;display:flex;align-items:center;justify-content:space-between;background:#111;flex-wrap:wrap;gap:0.5rem;}
        .char-count{font-family:'DM Mono',monospace;font-size:0.68rem;color:#444;}
        .btn-row{display:flex;gap:0.5rem;flex-wrap:wrap;}
        .btn{border-radius:7px;font-family:'DM Mono',monospace;font-size:0.75rem;padding:0.5rem 1rem;cursor:pointer;transition:all 0.15s;border:1px solid transparent;letter-spacing:0.04em;font-weight:500;}
        .btn-ghost{background:transparent;border-color:#2a2a2a;color:#666;}
        .btn-ghost:hover{border-color:#444;color:#999;}
        .btn-primary{background:#f0c040;color:#0a0a0a;border-color:#f0c040;font-weight:700;font-size:0.8rem;padding:0.55rem 1.4rem;}
        .btn-primary:hover:not(:disabled){background:#f5d060;transform:translateY(-1px);box-shadow:0 4px 16px rgba(240,192,64,0.25);}
        .btn-primary:disabled{opacity:0.4;cursor:not-allowed;}
        .error-box{background:#1a0808;border:1px solid #4a1818;border-radius:8px;padding:0.75rem 1.25rem;font-family:'DM Mono',monospace;font-size:0.78rem;color:#f08080;margin-bottom:1.25rem;}
        .output-tabs{display:flex;gap:0.25rem;padding:0.75rem 1.25rem;border-bottom:1px solid #1e1e1e;background:#111;flex-wrap:wrap;}
        .complexity-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;padding:1.25rem;}
        .complexity-box{background:#0f0f0f;border:1px solid #222;border-radius:8px;padding:1rem;}
        .complexity-label{font-family:'DM Mono',monospace;font-size:0.65rem;color:#555;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.4rem;}
        .complexity-value{font-family:'DM Mono',monospace;font-size:1.4rem;font-weight:700;color:#f0c040;margin-bottom:0.4rem;}
        .complexity-reason{font-size:0.78rem;color:#666;line-height:1.5;}
        .corrections-body{padding:1.25rem 1.5rem;}
        .error-item{display:flex;gap:0.75rem;margin-bottom:0.75rem;padding:0.75rem;background:#1a0a0a;border:1px solid #3a1818;border-radius:8px;}
        .error-line{font-family:'DM Mono',monospace;font-size:0.7rem;color:#f08080;flex-shrink:0;}
        .error-issue{font-size:0.82rem;color:#d6d3ca;}
        .opt-item{display:flex;gap:0.5rem;margin-bottom:0.5rem;}
        .improved-code{background:#0d0d0d;border:1px solid #2a3a2a;border-radius:8px;padding:1rem;margin-top:0.75rem;font-family:'DM Mono',monospace;font-size:0.78rem;color:#a8d8a8;overflow-x:auto;white-space:pre;}
        .section-label{font-family:'DM Mono',monospace;font-size:0.7rem;color:#555;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.75rem;}
        .samples-row{display:flex;gap:0.5rem;flex-wrap:wrap;padding:0.75rem 1.25rem;border-top:1px solid #1e1e1e;background:#0f0f0f;align-items:center;}
        .sample-pill{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:6px;padding:0.3rem 0.7rem;font-family:'DM Mono',monospace;font-size:0.68rem;color:#777;cursor:pointer;transition:all 0.15s;}
        .sample-pill:hover{border-color:#f0c040;color:#f0c040;}
        .spinner{width:20px;height:20px;border:2px solid #2a2a2a;border-top-color:#f0c040;border-radius:50%;animation:spin 0.7s linear infinite;flex-shrink:0;}
        .footer-credits{text-align:center;padding:2.5rem 1rem 2rem;margin-top:3rem;border-top:1px solid #1a1a1a;}
        .footer-credits-name{font-family:'DM Mono',monospace;font-size:0.8rem;color:#555;letter-spacing:0.06em;margin-bottom:0.4rem;}
        .footer-credits-powered{font-family:'DM Mono',monospace;font-size:0.65rem;color:#333;letter-spacing:0.08em;}
        .footer-accent{color:#f0c040;}
        input[type="file"]{display:none;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        .fade-up{animation:fadeUp 0.35s ease;}
        @media(max-width:700px){.complexity-grid{grid-template-columns:1fr;}}
      `}</style>

      <div className="app">
        <div className="grid-bg"/>
        <div className="container">

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
                <select value={language} onChange={e=>setLanguage(e.target.value)}>
                  {LANGUAGES.map(l=><option key={l}>{l}</option>)}
                </select>
                <button className="btn btn-ghost" onClick={()=>setSplitView(v=>!v)} style={{fontSize:"0.68rem",padding:"0.3rem 0.65rem",borderColor:splitView?"#555":"#2a2a2a",color:splitView?"#ccc":"#666"}}>
                  {splitView?"⊟ split":"⊞ split"}
                </button>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">INPUT // PASTE OR UPLOAD YOUR CODE</span>
            </div>
            <textarea ref={textareaRef} value={code} onChange={e=>setCode(e.target.value)} placeholder="// paste your code here, or upload a file..." spellCheck={false} autoCorrect="off" autoCapitalize="off"/>
            <div className="samples-row">
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:"0.65rem",color:"#444",marginRight:"0.25rem"}}>SAMPLES:</span>
              <select value={sampleLang} onChange={e=>setSampleLang(e.target.value)} style={{fontSize:"0.65rem",padding:"0.25rem 1.5rem 0.25rem 0.5rem"}}>
                {Object.keys(SAMPLES).map(l=><option key={l}>{l}</option>)}
              </select>
              {availableSamples.map(s=>(
                <button key={s.label} className="sample-pill" onClick={()=>{setCode(s.code);setLanguage(sampleLang);setResults({explain:null,breakdown:null,eli5:null});setComplexity(null);setCorrections(null);}}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="footer-bar">
              <span className="char-count">{charCount.toLocaleString()} chars</span>
              <div className="btn-row">
                <input ref={fileInputRef} type="file" accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.cc,.c,.rs,.go,.sql,.html,.css" onChange={handleFileUpload}/>
                <button className="btn btn-ghost" onClick={()=>fileInputRef.current?.click()}>↑ upload file</button>
                <button className="btn btn-ghost" onClick={clearAll}>clear</button>
                <button className="btn btn-primary" onClick={explainCode} disabled={anyLoading}>
                  {anyLoading?"analyzing...":"→ explain"}
                </button>
              </div>
            </div>
          </div>

          {error && <div className="error-box">⚠ {error}</div>}

          {(anyResult||anyLoading) && (
            <div ref={outputRef} className="fade-up">

              {/* Explanation output */}
              {splitView ? (
                <div style={{display:"flex",gap:"1rem",marginBottom:"1.25rem"}}>
                  {/* Left: code */}
                  <div style={{flex:1,background:"#141414",border:"1px solid #222",borderRadius:"12px",overflow:"hidden",minWidth:0}}>
                    <div style={{padding:"0.75rem 1.25rem",borderBottom:"1px solid #1e1e1e",background:"#111",fontFamily:"'DM Mono',monospace",fontSize:"0.7rem",color:"#555",letterSpacing:"0.1em",textTransform:"uppercase"}}>CODE</div>
                    <pre style={{padding:"1.25rem",color:"#c8ffa0",fontFamily:"'DM Mono',monospace",fontSize:"0.82rem",lineHeight:1.7,overflowX:"auto",margin:0,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{code}</pre>
                  </div>
                  {/* Right: explanations */}
                  <div style={{flex:1,background:"#141414",border:"1px solid #222",borderRadius:"12px",overflow:"hidden",minWidth:0}}>
                    <div style={{padding:"0.6rem 1rem",borderBottom:"1px solid #1e1e1e",background:"#111",display:"flex",gap:"0.25rem",flexWrap:"wrap"}}>
                      <OutputTabs/>
                    </div>
                    {loading[activeTab] ? (
                      <div style={{padding:"2rem",display:"flex",alignItems:"center",gap:"0.75rem"}}>
                        <div className="spinner"/><span style={{fontFamily:"'DM Mono',monospace",fontSize:"0.75rem",color:"#555"}}>analyzing...</span>
                      </div>
                    ) : results[activeTab] ? (
                      <>
                        <div style={{padding:"1.25rem 1.5rem",overflowY:"auto",maxHeight:"60vh"}}>{renderMarkdown(results[activeTab])}</div>
                        <div style={{padding:"0 1.25rem 1rem",display:"flex",justifyContent:"flex-end"}}>
                          <button className="btn btn-ghost" onClick={()=>navigator.clipboard.writeText(results[activeTab])}>copy</button>
                        </div>
                      </>
                    ) : (
                      <div style={{padding:"2rem",fontFamily:"'DM Mono',monospace",fontSize:"0.75rem",color:"#333"}}>waiting...</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card">
                  <div className="output-tabs"><OutputTabs/></div>
                  {loading[activeTab] ? (
                    <div style={{padding:"2.5rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem"}}>
                      <div className="spinner" style={{width:28,height:28}}/>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:"0.75rem",color:"#555"}}>reading your code...</span>
                    </div>
                  ) : results[activeTab] ? (
                    <>
                      <div style={{padding:"1.5rem 1.5rem 1rem"}}>{renderMarkdown(results[activeTab])}</div>
                      <div style={{padding:"0 1.25rem 1.25rem",display:"flex",justifyContent:"flex-end"}}>
                        <button className="btn btn-ghost" onClick={()=>navigator.clipboard.writeText(results[activeTab])}>copy</button>
                      </div>
                    </>
                  ) : (
                    <div style={{padding:"2rem 1.5rem",fontFamily:"'DM Mono',monospace",fontSize:"0.75rem",color:"#444"}}>waiting for result...</div>
                  )}
                </div>
              )}

              {/* Complexity */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">COMPLEXITY ANALYSIS</span>
                  {compLoading && <div className="spinner"/>}
                </div>
                {compLoading ? (
                  <div style={{padding:"1.5rem",fontFamily:"'DM Mono',monospace",fontSize:"0.75rem",color:"#444"}}>calculating...</div>
                ) : complexity && (
                  <div className="complexity-grid">
                    <div className="complexity-box">
                      <div className="complexity-label">Time Complexity</div>
                      <div className="complexity-value">{complexity.time}</div>
                      <div className="complexity-reason">{complexity.time_reason}</div>
                    </div>
                    <div className="complexity-box">
                      <div className="complexity-label">Space Complexity</div>
                      <div className="complexity-value">{complexity.space}</div>
                      <div className="complexity-reason">{complexity.space_reason}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Corrections */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">CODE REVIEW & OPTIMIZATIONS</span>
                  {corrLoading && <div className="spinner"/>}
                </div>
                {corrLoading ? (
                  <div style={{padding:"1.5rem",fontFamily:"'DM Mono',monospace",fontSize:"0.75rem",color:"#444"}}>reviewing...</div>
                ) : corrections && (
                  <div className="corrections-body">
                    <div className="section-label">
                      {corrections.errors?.length>0 ? `⚠ ${corrections.errors.length} issue(s) found` : "✓ No errors found"}
                    </div>
                    {corrections.errors?.map((e,i)=>(
                      <div key={i} className="error-item">
                        <span className="error-line">{e.line}</span>
                        <span className="error-issue">{e.issue}</span>
                      </div>
                    ))}
                    {corrections.optimizations?.length>0 && (<>
                      <div className="section-label" style={{marginTop:"1rem"}}>OPTIMIZATION SUGGESTIONS</div>
                      {corrections.optimizations.map((opt,i)=>(
                        <div key={i} className="opt-item">
                          <span style={{color:"#f0c040",flexShrink:0}}>▸</span>
                          <span style={{color:"#d6d3ca",fontSize:"0.85rem"}}>{opt}</span>
                        </div>
                      ))}
                    </>)}
                    {corrections.improved_code && (<>
                      <div className="section-label" style={{marginTop:"1.25rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span>IMPROVED CODE</span>
                        <button className="btn btn-ghost" style={{fontSize:"0.65rem",padding:"0.2rem 0.6rem"}} onClick={()=>navigator.clipboard.writeText(corrections.improved_code)}>copy</button>
                      </div>
                      <div className="improved-code">{corrections.improved_code}</div>
                    </>)}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        <footer className="footer-credits">
          <div className="footer-credits-name">
            Developed by <span className="footer-accent">Havish Nadella</span> and <span className="footer-accent">Vihaan Johann Ajay</span>
          </div>
          <div className="footer-credits-powered">
            Powered by <span className="footer-accent">Groq API</span> and <span className="footer-accent">Llama 3.3</span>
          </div>
        </footer>
      </div>
    </>
  );
}
