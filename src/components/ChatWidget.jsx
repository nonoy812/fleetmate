import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown'

// ─── Change this one value to retheme the entire widget ───
const BRAND_COLOR = "#4ecca3";
// ─────────────────────────────────────────────────────────

/** Converts a hex color + alpha into rgba(...) string */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      text: "Hi there! I'm your FleetMate assistant. How can I help you today?",
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [chipsVisible, setChipsVisible] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setShowBadge(false);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setChipsVisible(false);
    const userMsg = { id: Date.now(), role: "user", text, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    try {
      const response = await fetch(
        'https://yyndculpweiqoezdafkr.supabase.co/functions/v1/chat',
        {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}',
          'Content-Type': 'application/json'},
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json()
    setIsTyping(false);
    const botMsg = {
      id: Date.now() + 1,
      role: "bot",
      text: data.reply,
      time: new Date(),
    };
    setMessages((prev) => [...prev, botMsg]);
      
    } catch (error) {
      setIsTyping(false);
      const botMsg = {
        id: Date.now() + 1,
        role: "bot",
        text: "Sorry, something went wrong. Please try again.",
        time: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    }
    
      

  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage(input);
  };

  const s = makeStyles(BRAND_COLOR);

  return (
    <>
      {isOpen && (
        <div style={s.panel}>
          <div style={s.header}>
            <div style={s.avatar}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(255,255,255,0.2)" stroke="none"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3"/>
                <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3"/>
              </svg>
            </div>
            <div>
              <div style={s.headerTitle}>FleetMate Assistant</div>
              <div style={s.headerSub}>Ask me anything about rentals</div>
            </div>
            <div style={s.onlineDot} />
          </div>

          <div style={s.messages}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ ...s.msgRow, alignSelf: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={msg.role === "user" ? s.bubbleUser : s.bubbleBot}>
                {msg.role === 'bot' 
                  ? <ReactMarkdown components={{
                      p: ({children}) => <span style={{display: 'block', margin: '4px 0'}}>{children}</span>,
                      strong: ({children}) => <span style={{fontWeight: 600, color: '#fff'}}>{children}</span>,
                      ul: ({children}) => <span style={{display: 'block', margin: '4px 0', paddingLeft: 12}}>{children}</span>,
                      ol: ({children}) => <span style={{display: 'block', margin: '4px 0', paddingLeft: 12}}>{children}</span>,
                      li: ({children}) => <span style={{display: 'block', margin: '2px 0'}}>• {children}</span>,
                      code: ({children}) => <span style={{background: 'rgba(255,255,255,0.1)', padding: '1px 4px', borderRadius: 3, fontSize: 12}}>{children}</span>,
                    }}>{msg.text}</ReactMarkdown>
                  : msg.text
                }
                </div>
                <div style={{ ...s.msgTime, textAlign: msg.role === "user" ? "right" : "left" }}>
                  {formatTime(msg.time)}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ ...s.msgRow, alignSelf: "flex-start" }}>
                <div style={s.bubbleBot}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {chipsVisible && (
            <div style={s.chips}>
              {["Available cars", "How to book", "Pricing"].map((chip) => (
                <button key={chip} style={s.chip} onClick={() => sendMessage(chip)}>
                  {chip}
                </button>
              ))}
            </div>
          )}

          <div style={s.inputArea}>
            <input
              style={s.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
            />
            <button style={s.sendBtn} onClick={() => sendMessage(input)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <button style={s.fab} onClick={() => setIsOpen((o) => !o)}>
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
        {showBadge && <div style={s.badge}>1</div>}
      </button>
    </>
  );
}

function TypingDots() {
  return (
    <span style={{ display: "flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "rgba(255,255,255,0.4)",
            display: "inline-block",
            animation: "bounce 1.2s infinite ease-in-out",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </span>
  );
}

function makeStyles(color) {
  return {
    fab: {
      position: "fixed",
      bottom: 24,
      right: 24,
      width: 52,
      height: 52,
      borderRadius: "50%",
      background: color,
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `0 4px 16px ${hexToRgba(color, 0.45)}`,
      zIndex: 1000,
      transition: "transform 0.2s, background 0.2s",
    },
    badge: {
      position: "absolute",
      top: -2, right: -2,
      width: 16, height: 16,
      borderRadius: "50%",
      background: "#e74c3c",
      fontSize: 10,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 500,
    },
    panel: {
      position: "fixed",
      bottom: 88,
      right: 24,
      width: 320,
      height: 420,
      background: "#0f1923",
      border: "0.5px solid rgba(255,255,255,0.12)",
      borderRadius: 16,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      zIndex: 999,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    },
    header: {
      background: "#1a2a3a",
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      borderBottom: "0.5px solid rgba(255,255,255,0.08)",
      flexShrink: 0,
    },
    avatar: {
      width: 32, height: 32,
      borderRadius: "50%",
      background: color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    headerTitle: { fontSize: 13, fontWeight: 500, color: "#fff" },
    headerSub: { fontSize: 11, color: "rgba(255,255,255,0.45)" },
    onlineDot: {
      width: 7, height: 7,
      borderRadius: "50%",
      background: "#4CAF50",
      marginLeft: "auto",
      flexShrink: 0,
    },
    messages: {
      flex: 1,
      overflowY: "auto",
      padding: "14px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    },
    msgRow: {
      display: "flex",
      flexDirection: "column",
      maxWidth: "80%",
      gap: 3,
    },
    bubbleBot: {
      padding: "9px 12px",
      borderRadius: "12px 12px 12px 4px",
      fontSize: 13,
      lineHeight: 1.5,
      background: "#1a2a3a",
      color: "rgba(255,255,255,0.85)",
    },
    bubbleUser: {
      padding: "9px 12px",
      borderRadius: "12px 12px 4px 12px",
      fontSize: 13,
      lineHeight: 1.5,
      background: color,
      color: "#fff",
    },
    msgTime: {
      fontSize: 10,
      color: "rgba(255,255,255,0.3)",
      padding: "0 4px",
    },
    chips: {
      display: "flex",
      gap: 6,
      padding: "0 14px 10px",
      overflowX: "auto",
      flexShrink: 0,
    },
    chip: {
      background: "transparent",
      border: `0.5px solid ${hexToRgba(color, 0.5)}`,
      color: color,
      fontSize: 11,
      padding: "4px 10px",
      borderRadius: 20,
      cursor: "pointer",
      whiteSpace: "nowrap",
      flexShrink: 0,
    },
    inputArea: {
      padding: "10px 12px",
      borderTop: "0.5px solid rgba(255,255,255,0.08)",
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexShrink: 0,
    },
    input: {
      flex: 1,
      background: "#1a2a3a",
      border: `0.5px solid ${hexToRgba(color, 0.3)}`,
      borderRadius: 20,
      padding: "8px 14px",
      color: "#fff",
      fontSize: 13,
      outline: "none",
    },
    sendBtn: {
      width: 34, height: 34,
      borderRadius: "50%",
      background: color,
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
  };
}
