import { useState, useRef, useEffect } from "react"
import axios from "axios"

const DEPARTMENTS = [
  {
    key: "hr",
    name: "HR Policies",
    abbr: "HR",
    color: "#4F6BED",
    description: "Leave, attendance & conduct",
  },
  {
    key: "it",
    name: "IT Security",
    abbr: "IT",
    color: "#0E9E6E",
    description: "Access, devices & data",
  },
  {
    key: "finance",
    name: "Finance",
    abbr: "FN",
    color: "#D97706",
    description: "Expenses, claims & budgets",
  },
  {
    key: "admin",
    name: "Administration",
    abbr: "AD",
    color: "#7C3AED",
    description: "Facilities & office ops",
  },
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
  <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
    {[0, 1, 2].map(i => (
      <span
        key={i}
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#94A3B8",
          display: "inline-block",
          animation: `ph-bounce 1.3s ease-in-out ${i * 0.18}s infinite`,
        }}
      />
    ))}
  </div>
)

const renderInline = (text) => {
  // Handle **bold** and *italic*
  const parts = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let last = 0, match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[2]) parts.push(<strong key={match.index} style={{ fontWeight: 600 }}>{match[2]}</strong>)
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
        <ol key={`list-${elements.length}`} style={{ margin: "6px 0 8px 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 5 }}>
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
        <li key={i} style={{ fontSize: 13.5, lineHeight: 1.65, color: "#1E293B" }}>
          {renderInline(numberedMatch[2])}
        </li>
      )
    } else if (bulletMatch) {
      listItems.push(
        <li key={i} style={{ fontSize: 13.5, lineHeight: 1.65, color: "#1E293B", listStyleType: "disc" }}>
          {renderInline(bulletMatch[1])}
        </li>
      )
    } else {
      flushList()
      if (line.trim()) {
        elements.push(
          <p key={i} style={{ margin: "0 0 6px 0", lineHeight: 1.65 }}>
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

  const switchDept = key => {
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
      const res = await axios.post("http://127.0.0.1:8000/ask", {
        qs: q,
        department: dept,
      })
      setMessages(prev => [...prev, { role: "bot", text: res.data.answer }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "bot", text: "Unable to reach the PolicyHub server. Please try again or contact IT support." },
      ])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  const handleKey = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      askQuestion()
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', system-ui, sans-serif; background: #F1F5F9; color: #1E293B; }
        @keyframes ph-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.9; }
          50% { transform: translateY(-4px); opacity: 0.35; }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        textarea:focus, input:focus, button:focus-visible {
          outline: 2px solid #4F6BED;
          outline-offset: 2px;
        }
      `}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: 248,
          background: "#fff",
          borderRight: "1px solid #E2E8F0",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}>
          {/* Logo / Brand */}
          <div style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid #E2E8F0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 2 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: "#1E293B",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <span style={{ fontWeight: 600, fontSize: 14, color: "#0F172A", letterSpacing: "-0.01em" }}>
                PolicyHubAI
              </span>
            </div>
            <p style={{ fontSize: 11.5, color: "#94A3B8", marginLeft: 39 }}>Internal Knowledge Base</p>
          </div>

          {/* Department nav */}
          <div style={{ padding: "16px 12px 8px" }}>
            <p style={{
              fontSize: 10.5, fontWeight: 600, color: "#94A3B8",
              textTransform: "uppercase", letterSpacing: "0.07em",
              paddingLeft: 8, marginBottom: 8,
            }}>
              Departments
            </p>
            <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {DEPARTMENTS.map(d => {
                const active = dept === d.key
                return (
                  <button
                    key={d.key}
                    onClick={() => switchDept(d.key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 10px",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      background: active ? "#F8FAFC" : "transparent",
                      transition: "background 0.12s",
                      textAlign: "left",
                      width: "100%",
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                      background: active ? d.color : "#F1F5F9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.12s",
                    }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        color: active ? "#fff" : "#64748B",
                        letterSpacing: "0.03em",
                      }}>
                        {d.abbr}
                      </span>
                    </div>
                    <div>
                      <div style={{
                        fontSize: 13, fontWeight: active ? 600 : 500,
                        color: active ? "#0F172A" : "#475569",
                        lineHeight: 1.3,
                      }}>
                        {d.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>
                        {d.description}
                      </div>
                    </div>
                    {active && (
                      <div style={{
                        width: 3, height: 24, borderRadius: 2,
                        background: d.color, marginLeft: "auto", flexShrink: 0,
                      }} />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: "auto",
            padding: "16px 20px",
            borderTop: "1px solid #E2E8F0",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#22C55E", flexShrink: 0,
            }} />
            <span style={{ fontSize: 11.5, color: "#64748B" }}>Connected to policy store</span>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Header */}
          <header style={{
            height: 56, background: "#fff",
            borderBottom: "1px solid #E2E8F0",
            display: "flex", alignItems: "center",
            padding: "0 24px",
            gap: 12, flexShrink: 0,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: activeDept.color, flexShrink: 0,
            }} />
            <div>
              <span style={{ fontWeight: 600, fontSize: 14, color: "#0F172A" }}>
                {activeDept.name}
              </span>
              <span style={{
                marginLeft: 10, fontSize: 12, color: "#94A3B8",
                fontWeight: 400,
              }}>
                {activeDept.description}
              </span>
            </div>
            <div style={{
              marginLeft: "auto",
              fontSize: 11.5, color: "#CBD5E1",
              fontWeight: 500,
            }}>
              AI · Internal use only
            </div>
          </header>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "28px 32px",
            display: "flex", flexDirection: "column", gap: 20,
          }}>

            {messages.length === 0 && (
              <div style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>
                <div style={{
                  marginBottom: 24,
                  padding: "20px 24px",
                  background: "#fff",
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  borderLeft: `4px solid ${activeDept.color}`,
                }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
                    {activeDept.name} Assistant
                  </p>
                  <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
                    Ask me anything about {activeDept.name.toLowerCase()} — I'll reference the latest internal guidelines to give you an accurate answer.
                  </p>
                </div>

                <p style={{ fontSize: 11.5, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                  Common questions
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {(SUGGESTED[dept] || []).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setQuestion(s)}
                      style={{
                        textAlign: "left", padding: "11px 14px",
                        background: "#fff", border: "1px solid #E2E8F0",
                        borderRadius: 9, cursor: "pointer",
                        fontSize: 13, color: "#334155",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: 8,
                        transition: "border-color 0.12s, background 0.12s",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = activeDept.color
                        e.currentTarget.style.background = "#FAFBFF"
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = "#E2E8F0"
                        e.currentTarget.style.background = "#fff"
                      }}
                    >
                      <span>{s}</span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {m.role === "user" ? (
                  <div style={{
                    maxWidth: "62%",
                    background: "#1E293B",
                    color: "#F8FAFC",
                    borderRadius: "12px 12px 4px 12px",
                    padding: "10px 15px",
                    fontSize: 13.5, lineHeight: 1.6,
                  }}>
                    {m.text}
                  </div>
                ) : (
                  <div style={{
                    maxWidth: "70%",
                    background: "#fff",
                    border: "1px solid #E2E8F0",
                    borderRadius: "4px 12px 12px 12px",
                    borderLeft: `3px solid ${activeDept.color}`,
                    padding: "12px 16px",
                    fontSize: 13.5,
                    color: "#1E293B",
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 600, color: "#94A3B8",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      marginBottom: 8,
                    }}>
                      {activeDept.name}
                    </div>
                    {formatText(m.text)}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderLeft: `3px solid ${activeDept.color}`,
                borderRadius: "4px 12px 12px 12px",
                padding: "12px 16px",
                width: "fit-content",
              }}>
                <TypingIndicator />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{
            borderTop: "1px solid #E2E8F0",
            background: "#fff",
            padding: "14px 24px",
            display: "flex", gap: 10, alignItems: "flex-end",
          }}>
            <div style={{
              flex: 1,
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              background: "#F8FAFC",
              display: "flex", alignItems: "center",
              padding: "0 14px",
              transition: "border-color 0.15s",
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor = activeDept.color}
              onBlurCapture={e => e.currentTarget.style.borderColor = "#E2E8F0"}
            >
              <input
                ref={inputRef}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`Ask about ${activeDept.name.toLowerCase()}…`}
                style={{
                  flex: 1, border: "none", background: "transparent",
                  fontSize: 13.5, color: "#0F172A",
                  padding: "11px 0",
                  outline: "none",
                }}
              />
              {question && (
                <button
                  onClick={() => setQuestion("")}
                  style={{
                    border: "none", background: "none",
                    cursor: "pointer", color: "#CBD5E1",
                    padding: "4px", lineHeight: 1, flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>

            <button
              onClick={askQuestion}
              disabled={!question.trim() || loading}
              style={{
                background: question.trim() && !loading ? activeDept.color : "#E2E8F0",
                color: question.trim() && !loading ? "#fff" : "#94A3B8",
                border: "none", borderRadius: 10,
                padding: "10px 18px",
                fontSize: 13.5, fontWeight: 600,
                cursor: question.trim() && !loading ? "pointer" : "default",
                transition: "background 0.15s, color 0.15s",
                display: "flex", alignItems: "center", gap: 7,
                flexShrink: 0, height: 43,
              }}
            >
              {loading ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" style={{ animation: "ph-bounce 1s linear infinite" }}/>
                </svg>
              ) : (
                <>
                  Send
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </>
              )}
            </button>
          </div>

        </main>
      </div>
    </>
  )
}