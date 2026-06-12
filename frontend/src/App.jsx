import { useState, useRef, useEffect } from "react"
import axios from "axios"

const DEPARTMENTS = [
  { key: "hr", name: "HR Policies", abbr: "HR", color: "#4F6BED", description: "Leave, attendance & conduct" },
  { key: "it", name: "IT Security", abbr: "IT", color: "#0E9E6E", description: "Access, devices & data" },
  { key: "finance", name: "Finance", abbr: "FN", color: "#D97706", description: "Expenses, claims & budgets" },
  { key: "admin", name: "Administration", abbr: "AD", color: "#7C3AED", description: "Facilities & office ops" },
]

const SUGGESTED = {
  hr: [
    "What is the leave approval process?",
    "Can I work from home without prior approval?",
    "What happens if I miss attendance logging?",
    "How do I apply for maternity or paternity leave?",
  ],
  it: [
    "How do I request access to a new system?",
    "What is the password rotation policy?",
    "Can I use personal devices for work?",
    "How do I report a phishing email?",
  ],
  finance: [
    "What are the reimbursement limits per trip?",
    "How long does expense approval take?",
    "What receipts are required for claims?",
    "Can I claim for client entertainment?",
  ],
  admin: [
    "How do I book a meeting room?",
    "Who do I contact for facility repairs?",
    "What is the visitor entry process?",
    "How do I request office supplies?",
  ],
}

const TypingIndicator = () => (
  <div className="flex items-center gap-1 py-1">
    {[0, 1, 2].map(i => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
)

const renderInline = (text) => {
  const parts = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let last = 0, match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[2]) parts.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>)
    else if (match[3]) parts.push(<em key={match.index}>{match[3]}</em>)
    last = match.index + match[0].length
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts
}

const formatText = (text) => {
  const lines = text.split("\n")
  const elements = []
  let listItems = []

  const flushList = () => {
    if (listItems.length) {
      elements.push(
        <ol key={`list-${elements.length}`} className="list-decimal ml-5 my-2 space-y-1">
          {listItems}
        </ol>
      )
      listItems = []
    }
  }

  lines.forEach((line, i) => {
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/)
    const bulletMatch = line.match(/^[-•]\s+(.*)/)

    if (numberedMatch) {
      listItems.push(
        <li key={i} className="text-sm leading-6 text-slate-800">
          {renderInline(numberedMatch[2])}
        </li>
      )
    } else if (bulletMatch) {
      listItems.push(
        <li key={i} className="text-sm leading-6 text-slate-800 list-disc">
          {renderInline(bulletMatch[1])}
        </li>
      )
    } else {
      flushList()
      if (line.trim()) {
        elements.push(
          <p key={i} className="text-sm leading-6 mb-2 text-slate-800">
            {renderInline(line)}
          </p>
        )
      }
    }
  })

  flushList()
  return elements
}

export default function PolicyHub() {
  const [dept, setDept] = useState("hr")
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const activeDept = DEPARTMENTS.find(d => d.key === dept)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const switchDept = (key) => {
    setDept(key)
    setMessages([])
    setQuestion("")
  }

  const askQuestion = async () => {
    const q = question.trim()
    if (!q || loading) return

    setMessages(prev => [...prev, { role: "user", text: q }])
    setQuestion("")
    setLoading(true)

    try {
      const res = await axios.post("https://farham77-policyhubai.hf.space/ask", {
        qs: q,
        department: dept,
      })

      setMessages(prev => [...prev, { role: "bot", text: res.data.answer }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "bot", text: "Unable to reach the PolicyHub server. Please try again." },
      ])
    }

    setLoading(false)
    inputRef.current?.focus()
  }

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      askQuestion()
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden">

        {/* SIDEBAR */}
        <aside className="w-full md:w-[248px] bg-white border-r border-slate-200 flex flex-col">

          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center text-white text-xs font-bold">
                P
              </div>
              <div className="font-semibold text-sm">PolicyHubAI</div>
            </div>
            <div className="text-xs text-slate-400 ml-10">Internal Knowledge Base</div>
          </div>

          <div className="p-3 space-y-1">
            {DEPARTMENTS.map(d => {
              const active = dept === d.key
              return (
                <button
                  key={d.key}
                  onClick={() => switchDept(d.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition ${
                    active ? "bg-slate-100" : ""
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: active ? d.color : "#E2E8F0" }}
                  >
                    {d.abbr}
                  </div>

                  <div>
                    <div className="text-sm font-medium">{d.name}</div>
                    <div className="text-xs text-slate-400">{d.description}</div>
                  </div>

                  {active && (
                    <div className="ml-auto w-1 h-6 rounded" style={{ background: d.color }} />
                  )}
                </button>
              )
            })}
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* HEADER */}
          <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: activeDept.color }} />
              <div className="font-semibold text-sm">{activeDept.name}</div>
              <div className="hidden sm:block text-xs text-slate-400">
                {activeDept.description}
              </div>
            </div>
          </header>

          {/* CHAT */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 space-y-4">

            {messages.length === 0 && (
              <div className="max-w-xl mx-auto w-full">

                {/* intro card */}
                <div
                  className="bg-white p-5 border border-slate-200 rounded-lg border-l-4 mb-5"
                  style={{ borderLeftColor: activeDept.color }}
                >
                  <div className="text-sm font-semibold mb-1">
                    {activeDept.name} Assistant
                  </div>
                  <div className="text-sm text-slate-500">
                    Ask me anything about {activeDept.name.toLowerCase()} policies.
                  </div>
                </div>

                {/* suggested */}
                <div className="text-xs font-semibold text-slate-400 uppercase mb-2 tracking-wider">
                  Common questions
                </div>

                <div className="space-y-2">
                  {(SUGGESTED[dept] || []).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setQuestion(s)}
                      className="w-full text-left p-3 rounded-lg border border-slate-200 bg-white text-sm flex justify-between items-center hover:bg-slate-50"
                    >
                      {s}
                      <span className="text-slate-300">›</span>
                    </button>
                  ))}
                </div>

              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-3 rounded-lg border text-sm leading-6 max-w-[85%] md:max-w-[70%] ${
                    m.role === "user"
                      ? "bg-slate-900 text-white"
                      : "bg-white border-slate-200"
                  }`}
                  style={{
                    borderLeft:
                      m.role === "bot" ? `3px solid ${activeDept.color}` : undefined,
                  }}
                >
                  {m.role === "bot" ? formatText(m.text) : m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="bg-white border border-slate-200 p-3 rounded-lg w-fit">
                <TypingIndicator />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div className="p-3 md:p-4 border-t border-slate-200 bg-white flex gap-2 items-end">

            <input
              ref={inputRef}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Ask about ${activeDept.name.toLowerCase()}...`}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ outlineColor: activeDept.color }}
            />

            <button
              onClick={askQuestion}
              disabled={!question.trim() || loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:bg-slate-200"
              style={{
                background: question.trim() && !loading ? activeDept.color : "#CBD5E1",
              }}
            >
              Send
            </button>

          </div>

        </main>
      </div>
    </>
  )
}