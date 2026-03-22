import { useState, useEffect, useRef, useCallback } from "react";

const MARIO_THEME = {
  bg: "#5c94fc",
  brick: "#c84c0c",
  brickLight: "#e09050",
  ground: "#68a040",
  groundDark: "#306828",
  pipe: "#30b818",
  pipeDark: "#1c8010",
  coin: "#f8d830",
  coinDark: "#c89820",
  text: "#ffffff",
  textShadow: "#000000",
  block: "#f8b800",
  blockDark: "#a87000",
  starYellow: "#f8d830",
  mushRed: "#e04040",
  cloudWhite: "#f8f8f8",
};

const PEACH_THEME = {
  bg: "#f8a0c8",
  brick: "#d05898",
  brickLight: "#f080b0",
  ground: "#f0c8e0",
  groundDark: "#d098b8",
  pipe: "#e878a8",
  pipeDark: "#c06090",
  coin: "#f8d830",
  coinDark: "#c89820",
  text: "#ffffff",
  textShadow: "#88305c",
  block: "#f8c0d8",
  blockDark: "#d098b0",
  starYellow: "#f8d830",
  mushRed: "#f06098",
  cloudWhite: "#fff0f8",
};

function getTheme(gender) {
  return gender === "female" ? PEACH_THEME : MARIO_THEME;
}

function getAge(birthday) {
  const b = new Date(birthday);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

// ─── Calculate streak (consecutive days played) ───
function calculateStreak(responses, kidId) {
  if (!responses || responses.length === 0) return 0;
  const kidResponses = kidId ? responses.filter(r => r.kidId === kidId) : responses;
  if (kidResponses.length === 0) return 0;
  const days = [...new Set(kidResponses.map(r => new Date(r.timestamp).toDateString()))];
  days.sort((a, b) => new Date(b) - new Date(a));
  
  let streak = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);
  
  for (const dayStr of days) {
    const day = new Date(dayStr);
    day.setHours(0, 0, 0, 0);
    const diff = Math.floor((checkDate - day) / (1000 * 60 * 60 * 24));
    if (diff <= 1) {
      streak++;
      checkDate = day;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Confetti Celebration Component ───
function Confetti({ active, theme }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (active) {
      const colors = [theme.coin, theme.pipe, theme.brick, theme.starYellow, "#fff", theme.mushRed];
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        duration: 1 + Math.random() * 1,
      }));
      setParticles(newParticles);
      const timer = setTimeout(() => setParticles([]), 2500);
      return () => clearTimeout(timer);
    }
  }, [active, theme]);

  if (particles.length === 0) return null;

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1000, overflow: "hidden" }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: "-20px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animation: `confettiFall ${p.duration}s ease-out ${p.delay}s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Streak Badge ───
function StreakBadge({ streak, theme }) {
  if (streak < 2) return null;
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "4px 10px",
      backgroundColor: "rgba(248, 216, 48, 0.2)",
      border: `2px solid ${theme.coin}`,
      borderRadius: 20,
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 9,
      color: theme.coin,
    }}>
      🔥 {streak} day streak!
    </div>
  );
}

// ─── pixel font via google ───
const FONT_LINK = "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Quicksand:wght@400;600;700&display=swap";

// ─── Question Types ───
const Q_TYPES = ["multiple_choice", "free_text", "creative", "drawing", "scale", "this_or_that"];

// ─── Starter Questions (seeded) ───
const STARTER_QUESTIONS = [
  // Free text
  { id: "s1", type: "free_text", text: "If you could have any superpower, what would it be and why?", minAge: 4, maxAge: 14 },
  { id: "s7", type: "free_text", text: "If you could talk to any animal, which one would you pick and what would you ask?", minAge: 4, maxAge: 14 },
  { id: "s10", type: "free_text", text: "If you were the President for one day, what's the first rule you'd make?", minAge: 6, maxAge: 14 },
  { id: "s15", type: "free_text", text: "What's one thing that grown-ups just don't understand?", minAge: 5, maxAge: 14 },
  { id: "s19", type: "free_text", text: "What's the funniest thing that ever happened to you?", minAge: 5, maxAge: 14 },
  { id: "s21", type: "free_text", text: "If you could invent anything, what would it be?", minAge: 5, maxAge: 14 },
  { id: "s22", type: "free_text", text: "What do you think is inside a rainbow?", minAge: 4, maxAge: 10 },
  { id: "s23", type: "free_text", text: "If your toys came alive at night, what do you think they'd do?", minAge: 4, maxAge: 10 },
  
  // Multiple choice
  { id: "s2", type: "multiple_choice", text: "Which would you rather be?", options: ["A dinosaur", "A dragon", "A giant robot", "A wizard"], minAge: 4, maxAge: 14 },
  { id: "s8", type: "multiple_choice", text: "What's the best thing about being a kid?", options: ["Playing all day", "No boring meetings", "Everything is an adventure", "Endless imagination"], minAge: 4, maxAge: 14 },
  { id: "s14", type: "multiple_choice", text: "If your pet could talk, what would they complain about?", options: ["Not enough treats", "Too many baths", "You hog the couch", "Bedtime is too early"], minAge: 4, maxAge: 14 },
  { id: "s24", type: "multiple_choice", text: "What's the best pizza topping?", options: ["Pepperoni", "Extra cheese", "Pineapple (yes, really!)", "Everything!"], minAge: 4, maxAge: 14 },
  { id: "s25", type: "multiple_choice", text: "If you had to eat one food forever, what would it be?", options: ["Mac and cheese", "Tacos", "Ice cream", "Chicken nuggets"], minAge: 4, maxAge: 14 },
  
  // This or that
  { id: "s3", type: "this_or_that", text: "Would you rather...", optionA: "Fly like a bird", optionB: "Breathe underwater", minAge: 4, maxAge: 14 },
  { id: "s9", type: "this_or_that", text: "Pick one!", optionA: "Be invisible for a day", optionB: "Be able to fly for a day", minAge: 4, maxAge: 14 },
  { id: "s16", type: "this_or_that", text: "Would you rather...", optionA: "Live in a castle", optionB: "Live on a spaceship", minAge: 4, maxAge: 14 },
  { id: "s26", type: "this_or_that", text: "Would you rather...", optionA: "Have a pet dinosaur", optionB: "Have a pet dragon", minAge: 4, maxAge: 14 },
  { id: "s27", type: "this_or_that", text: "Pick one!", optionA: "Never have homework again", optionB: "Never have bedtime again", minAge: 5, maxAge: 14 },
  { id: "s28", type: "this_or_that", text: "Would you rather...", optionA: "Be the funniest person ever", optionB: "Be the smartest person ever", minAge: 6, maxAge: 14 },
  
  // Scale
  { id: "s4", type: "scale", text: "How brave are you feeling today?", scaleMin: 1, scaleMax: 10, scaleMinLabel: "A little scared", scaleMaxLabel: "SUPER BRAVE!", minAge: 4, maxAge: 14 },
  { id: "s13", type: "scale", text: "How silly are you feeling right now?", scaleMin: 1, scaleMax: 10, scaleMinLabel: "Very serious", scaleMaxLabel: "MAXIMUM SILLY!", minAge: 4, maxAge: 14 },
  { id: "s20", type: "scale", text: "How much do you love pizza?", scaleMin: 1, scaleMax: 10, scaleMinLabel: "It's okay", scaleMaxLabel: "PIZZA IS LIFE!", minAge: 4, maxAge: 14 },
  { id: "s29", type: "scale", text: "How adventurous are you?", scaleMin: 1, scaleMax: 10, scaleMinLabel: "I like staying home", scaleMaxLabel: "EXPLORER MODE!", minAge: 4, maxAge: 14 },
  { id: "s30", type: "scale", text: "How creative are you feeling?", scaleMin: 1, scaleMax: 10, scaleMinLabel: "Not very", scaleMaxLabel: "SUPER CREATIVE!", minAge: 4, maxAge: 14 },
  
  // Creative
  { id: "s5", type: "creative", text: "Describe your dream treehouse. What rooms does it have? What's the coolest feature?", minAge: 6, maxAge: 14 },
  { id: "s12", type: "creative", text: "Make up a new holiday! What's it called, when is it, and how do people celebrate?", minAge: 6, maxAge: 14 },
  { id: "s17", type: "creative", text: "Invent a new ice cream flavor! What's in it and what's it called?", minAge: 4, maxAge: 14 },
  { id: "s31", type: "creative", text: "If you could design your own video game, what would it be about?", minAge: 6, maxAge: 14 },
  { id: "s32", type: "creative", text: "Imagine you're a famous chef. What's your signature dish and why?", minAge: 6, maxAge: 14 },
  
  // Drawing
  { id: "s6", type: "drawing", text: "Draw your favorite animal doing something funny!", minAge: 4, maxAge: 14 },
  { id: "s11", type: "drawing", text: "Draw what you think you'll look like when you're 100 years old!", minAge: 4, maxAge: 14 },
  { id: "s18", type: "drawing", text: "Draw your family as superheroes!", minAge: 4, maxAge: 14 },
  { id: "s33", type: "drawing", text: "Draw your dream house!", minAge: 4, maxAge: 14 },
  { id: "s34", type: "drawing", text: "Draw yourself on an adventure!", minAge: 4, maxAge: 14 },
  { id: "s35", type: "drawing", text: "Draw a new animal that's never existed before!", minAge: 4, maxAge: 14 },
];

// ─── Drawing Canvas Component ───
function DrawingCanvas({ onSave, theme }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPoint = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.min(rect.width - 16, 500);
    canvas.height = Math.min(300, window.innerHeight * 0.35);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawn(true);
    const pos = getPos(e);
    lastPoint.current = pos;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPoint.current = pos;
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const saveDrawing = () => {
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSave(dataUrl);
  };

  const colors = ["#000000", "#e04040", "#3070e0", "#30a030", "#f8d830", "#f080b0", "#8040c0", "#f08030", "#ffffff"];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <canvas
        ref={canvasRef}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
        style={{
          border: `3px solid ${theme.brick}`,
          borderRadius: 8,
          cursor: "crosshair",
          touchAction: "none",
          maxWidth: "100%",
        }}
      />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: c,
              border: color === c ? `3px solid ${theme.coin}` : "2px solid #666",
              cursor: "pointer",
              boxShadow: color === c ? `0 0 8px ${theme.coin}` : "none",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 13, color: theme.text }}>Size:</span>
        <input
          type="range"
          min={2}
          max={20}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          style={{ width: 100 }}
        />
        <button onClick={clearCanvas} style={smallBtnStyle(theme)}>
          🗑️ Clear
        </button>
      </div>
      {hasDrawn && (
        <button onClick={saveDrawing} style={bigBtnStyle(theme)}>
          ✅ Save Drawing
        </button>
      )}
    </div>
  );
}

function smallBtnStyle(theme) {
  return {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 10,
    padding: "8px 14px",
    backgroundColor: theme.brick,
    color: "#fff",
    border: `2px solid ${theme.brickLight}`,
    borderRadius: 6,
    cursor: "pointer",
  };
}

function bigBtnStyle(theme) {
  return {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 11,
    padding: "12px 24px",
    backgroundColor: theme.pipe,
    color: "#fff",
    border: `3px solid ${theme.pipeDark}`,
    borderRadius: 8,
    cursor: "pointer",
    textShadow: `1px 1px 0 ${theme.textShadow}`,
    boxShadow: `0 4px 0 ${theme.pipeDark}`,
  };
}

// ─── Generate Questions via Claude API ───
async function generateQuestions(kids) {
  const kidDescriptions = kids
    .map((k) => `${k.name} (age ${getAge(k.birthday)}, ${k.gender})`)
    .join(", ");
  const ages = kids.map((k) => getAge(k.birthday));
  const minAge = Math.min(...ages);
  const maxAge = Math.max(...ages);

  const prompt = `Generate 10 fun, clever, and insightful questions for kids. The kids are: ${kidDescriptions}.

Questions should be age-appropriate for ages ${minAge}-${maxAge}. Mix the types:
- 2 "multiple_choice" (provide 4 fun options)
- 2 "free_text" (open-ended, thought-provoking)
- 2 "creative" (longer creative prompts)
- 2 "this_or_that" (would you rather style, 2 options)
- 1 "scale" (rate something 1-10)
- 1 "drawing" (something fun to draw)

Respond ONLY with valid JSON array, no markdown, no backticks. Each question object:
{"id":"g_<random>","type":"<type>","text":"<question>","minAge":${minAge},"maxAge":${maxAge}${minAge < 7 ? ',"options":["a","b","c","d"] for multiple_choice, "optionA":"..." and "optionB":"..." for this_or_that, "scaleMin":1,"scaleMax":10,"scaleMinLabel":"...","scaleMaxLabel":"..." for scale' : ""}}

For multiple_choice include "options" array of 4 strings.
For this_or_that include "optionA" and "optionB".
For scale include "scaleMin", "scaleMax", "scaleMinLabel", "scaleMaxLabel".
Make questions fun, surprising, and memorable - not generic!`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    const text = data.content.map((i) => i.text || "").join("\n");
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Failed to generate questions:", err);
    return [];
  }
}

// ─── Animated Clouds ───
function Clouds({ theme }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 200, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 20 + i * 35,
            left: `${-10 + i * 28}%`,
            width: 90 + i * 20,
            height: 40 + i * 8,
            backgroundColor: theme.cloudWhite,
            borderRadius: "50px",
            opacity: 0.7,
            animation: `cloudFloat ${18 + i * 5}s linear infinite`,
            animationDelay: `${i * -4}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Brick Pattern ───
function BrickBar({ theme, height = 32 }) {
  return (
    <div
      style={{
        width: "100%",
        height,
        background: `repeating-linear-gradient(
          90deg,
          ${theme.brick} 0px,
          ${theme.brick} 30px,
          ${theme.brickLight} 30px,
          ${theme.brickLight} 32px
        )`,
        backgroundSize: `64px ${height}px`,
        borderTop: `2px solid ${theme.brickLight}`,
        borderBottom: `2px solid ${theme.blockDark || "#704000"}`,
      }}
    />
  );
}

// ─── Question Block ───
function QuestionBlock({ theme, size = 40, animate = false }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: theme.block,
        border: `3px solid ${theme.blockDark}`,
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Press Start 2P', monospace",
        fontSize: size * 0.45,
        color: theme.blockDark,
        textShadow: "1px 1px 0 rgba(0,0,0,0.3)",
        animation: animate ? "blockBounce 0.6s ease infinite" : "none",
        flexShrink: 0,
      }}
    >
      ?
    </div>
  );
}

// ─── Coin Counter ───
function CoinCounter({ count, max, theme }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: theme.coin }}>
      <span style={{ fontSize: 18 }}>🪙</span>
      <span style={{ textShadow: `1px 1px 0 ${theme.textShadow}` }}>
        x {count}/{max}
      </span>
    </div>
  );
}

// ─── Setup Screen ───
function SetupScreen({ onComplete, theme }) {
  const [kids, setKids] = useState([{ name: "", gender: "male", birthday: "" }]);

  const addKid = () => setKids([...kids, { name: "", gender: "male", birthday: "" }]);
  const removeKid = (i) => setKids(kids.filter((_, idx) => idx !== i));
  const updateKid = (i, field, val) => {
    const copy = [...kids];
    copy[i] = { ...copy[i], [field]: val };
    setKids(copy);
  };

  const allValid = kids.every((k) => k.name.trim() && k.birthday);

  return (
    <div style={screenStyle(theme)}>
      <Clouds theme={theme} />
      <div style={cardStyle(theme)}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <QuestionBlock theme={theme} size={50} animate />
          <h1 style={titleStyle(theme)}>QUESTION QUEST</h1>
          <p style={subtitleStyle(theme)}>Set up your players!</p>
        </div>

        {kids.map((kid, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              border: `2px solid ${kid.gender === "female" ? PEACH_THEME.brick : MARIO_THEME.pipe}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: theme.text }}>
                {kid.gender === "female" ? "👸" : "🍄"} Player {i + 1}
              </span>
              {kids.length > 1 && (
                <button onClick={() => removeKid(i)} style={{ ...smallBtnStyle(theme), backgroundColor: "#c04040" }}>
                  ✕
                </button>
              )}
            </div>
            <input
              placeholder="Name"
              value={kid.name}
              onChange={(e) => updateKid(i, "name", e.target.value)}
              style={inputStyle(theme)}
            />
            <div style={{ display: "flex", gap: 8, margin: "8px 0" }}>
              <button
                onClick={() => updateKid(i, "gender", "male")}
                style={{
                  ...genderBtnStyle(theme),
                  backgroundColor: kid.gender === "male" ? MARIO_THEME.pipe : "rgba(255,255,255,0.1)",
                  border: kid.gender === "male" ? `2px solid ${MARIO_THEME.pipeDark}` : "2px solid rgba(255,255,255,0.2)",
                }}
              >
                🍄 Boy
              </button>
              <button
                onClick={() => updateKid(i, "gender", "female")}
                style={{
                  ...genderBtnStyle(theme),
                  backgroundColor: kid.gender === "female" ? PEACH_THEME.brick : "rgba(255,255,255,0.1)",
                  border: kid.gender === "female" ? `2px solid ${PEACH_THEME.pipeDark}` : "2px solid rgba(255,255,255,0.2)",
                }}
              >
                👸 Girl
              </button>
            </div>
            <label style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 12, color: theme.text, marginBottom: 4, display: "block" }}>
              Birthday
            </label>
            <input
              type="date"
              value={kid.birthday}
              onChange={(e) => updateKid(i, "birthday", e.target.value)}
              style={inputStyle(theme)}
            />
          </div>
        ))}

        <button onClick={addKid} style={{ ...bigBtnStyle(theme), width: "100%", marginBottom: 12, backgroundColor: theme.coin, color: theme.textShadow }}>
          ➕ Add Player
        </button>

        {allValid && (
          <button
            onClick={() => onComplete(kids.map((k, i) => ({ ...k, id: `kid_${Date.now()}_${i}` })))}
            style={{ ...bigBtnStyle(theme), width: "100%", fontSize: 14 }}
          >
            🎮 START GAME!
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Kid Select Screen ───
function KidSelectScreen({ kids, onSelect, onParentMode, theme }) {
  return (
    <div style={screenStyle(theme)}>
      <Clouds theme={theme} />
      <div style={cardStyle(theme)}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h1 style={titleStyle(theme)}>QUESTION QUEST</h1>
          <p style={subtitleStyle(theme)}>Who's playing?</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {kids.map((kid) => {
            const kt = getTheme(kid.gender);
            return (
              <button
                key={kid.id}
                onClick={() => onSelect(kid)}
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 14,
                  padding: "20px 16px",
                  backgroundColor: kt.bg,
                  color: "#fff",
                  border: `3px solid ${kt.brick}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  textShadow: `2px 2px 0 ${kt.textShadow}`,
                  boxShadow: `0 4px 0 ${kt.brickLight}, 0 6px 12px rgba(0,0,0,0.2)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "transform 0.1s",
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(2px)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <span style={{ fontSize: 28 }}>{kid.gender === "female" ? "👸" : "🍄"}</span>
                <div style={{ textAlign: "left" }}>
                  <div>{kid.name}</div>
                  <div style={{ fontSize: 9, opacity: 0.8, marginTop: 4 }}>Age {getAge(kid.birthday)}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ borderTop: `2px solid rgba(255,255,255,0.2)`, marginTop: 20, paddingTop: 16 }}>
          <button onClick={onParentMode} style={{ ...smallBtnStyle(theme), width: "100%", padding: "12px 12px" }}>
            🔑 Parent Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Single Question Card (rendered inside the slide container) ───
function QuestionCard({ question, answer, setAnswer, onInstantPick, scaleVal, setScaleVal, textVal, setTextVal, theme, style, frozen }) {
  if (!question) return null;
  return (
    <div style={style}>
      {/* Question */}
      <div style={{ textAlign: "center", margin: "16px 0" }}>
        <QuestionBlock theme={theme} size={36} animate={!frozen} />
        <h2
          style={{
            fontFamily: "'Quicksand', sans-serif",
            fontWeight: 700,
            fontSize: question.text.length > 60 ? 16 : 20,
            color: theme.text,
            textShadow: `1px 1px 0 ${theme.textShadow}`,
            marginTop: 12,
            lineHeight: 1.4,
          }}
        >
          {question.text}
        </h2>
      </div>

      {/* Answer Area */}
      <div style={{ marginTop: 12 }}>
        {question.type === "multiple_choice" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(question.options || []).map((opt, i) => (
              <button
                key={i}
                onClick={() => { if (!frozen) { setAnswer(opt); onInstantPick && onInstantPick(opt); } }}
                style={{
                  fontFamily: "'Quicksand', sans-serif",
                  fontWeight: 600,
                  fontSize: 15,
                  padding: "14px 16px",
                  backgroundColor: answer === opt ? theme.pipe : "rgba(255,255,255,0.15)",
                  color: "#fff",
                  border: answer === opt ? `3px solid ${theme.pipeDark}` : "2px solid rgba(255,255,255,0.3)",
                  borderRadius: 8,
                  cursor: frozen ? "default" : "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                {["A", "B", "C", "D"][i]}. {opt}
              </button>
            ))}
          </div>
        )}

        {question.type === "this_or_that" && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[question.optionA, question.optionB].map((opt, i) => (
              <button
                key={i}
                onClick={() => { if (!frozen) { setAnswer(opt); onInstantPick && onInstantPick(opt); } }}
                style={{
                  flex: "1 1 45%",
                  minWidth: 120,
                  fontFamily: "'Quicksand', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  padding: "20px 12px",
                  backgroundColor: answer === opt ? theme.pipe : "rgba(255,255,255,0.15)",
                  color: "#fff",
                  border: answer === opt ? `3px solid ${theme.pipeDark}` : "2px solid rgba(255,255,255,0.3)",
                  borderRadius: 12,
                  cursor: frozen ? "default" : "pointer",
                  textAlign: "center",
                  transition: "all 0.15s",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {(question.type === "free_text" || question.type === "creative") && (
          <textarea
            value={textVal}
            onChange={(e) => !frozen && setTextVal(e.target.value)}
            placeholder={question.type === "creative" ? "Let your imagination run wild..." : "Type your answer..."}
            rows={question.type === "creative" ? 5 : 3}
            readOnly={frozen}
            style={{
              ...inputStyle(theme),
              minHeight: question.type === "creative" ? 120 : 70,
              resize: "vertical",
              fontFamily: "'Quicksand', sans-serif",
              fontSize: 15,
              lineHeight: 1.5,
            }}
          />
        )}

        {question.type === "scale" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 32, color: theme.coin, margin: "8px 0" }}>
              {scaleVal}
            </div>
            <input
              type="range"
              min={question.scaleMin || 1}
              max={question.scaleMax || 10}
              value={scaleVal}
              onChange={(e) => !frozen && setScaleVal(Number(e.target.value))}
              disabled={frozen}
              style={{ width: "100%", margin: "8px 0" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Quicksand', sans-serif", fontSize: 11, color: theme.text, opacity: 0.8 }}>
              <span>{question.scaleMinLabel || "Low"}</span>
              <span>{question.scaleMaxLabel || "High"}</span>
            </div>
          </div>
        )}

        {question.type === "drawing" && (
          <DrawingCanvas onSave={(data) => !frozen && setAnswer(data)} theme={theme} />
        )}
      </div>
    </div>
  );
}

// ─── Past Card Ghost (stacked behind the card's left edge) ───
function PastCardGhost({ question, index, total, theme }) {
  const depth = total - 1 - index; // 0 = most recent, 1 = older, etc.
  if (depth > 2) return null;

  const offsets = [
    { x: -18, scale: 0.94, opacity: 0.35, rotate: -5 },
    { x: -32, scale: 0.88, opacity: 0.2, rotate: -9 },
    { x: -42, scale: 0.82, opacity: 0.1, rotate: -12 },
  ];
  const o = offsets[depth];

  return (
    <div
      style={{
        position: "absolute",
        top: 20 + depth * 6,
        left: 0,
        right: 0,
        bottom: 20,
        transform: `translateX(${o.x}px) scale(${o.scale}) rotate(${o.rotate}deg)`,
        opacity: o.opacity,
        zIndex: 1 - depth,
        pointerEvents: "none",
        backgroundColor: "rgba(0,0,0,0.4)",
        border: `3px solid ${theme.brick}`,
        borderRadius: 16,
        transformOrigin: "left center",
        transition: "all 0.4s ease",
      }}
    />
  );
}

// ─── Question Screen with Cartridge Slide Transition ───
function QuestionScreen({ kid, questions, todayCount, onAnswer, onSkip, onBack, onDone, responses = [] }) {
  const theme = getTheme(kid.gender);
  const age = getAge(kid.birthday);
  const MAX_DAILY = 10;

  // Capture the initial todayCount at mount so background saves don't cause double-counting
  const initialCountRef = useRef(todayCount);

  const [currentQ, setCurrentQ] = useState(null);
  const [prevQ, setPrevQ] = useState(null);
  const [pastCards, setPastCards] = useState([]); // history of answered questions
  const [answer, setAnswer] = useState(null);
  const [scaleVal, setScaleVal] = useState(5);
  const [textVal, setTextVal] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [slidePhase, setSlidePhase] = useState("idle");
  const [questionKey, setQuestionKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const slidingRef = useRef(false); // guard against double-taps

  const streak = calculateStreak(responses, kid.id);

  const eligible = questions.filter((q) => age >= (q.minAge || 0) && age <= (q.maxAge || 99));
  const eligibleRef = useRef(eligible);
  eligibleRef.current = eligible;

  // Derived local count: initial (from storage at mount) + session answers
  const localCount = initialCountRef.current + pastCards.length;

  // Initial load
  useEffect(() => {
    if (localCount >= MAX_DAILY) {
      setShowDone(true);
      return;
    }
    if (!currentQ && eligible.length > 0) {
      const rand = eligible[Math.floor(Math.random() * eligible.length)];
      setCurrentQ(rand);
      setSlidePhase("idle");
    } else if (!currentQ && eligible.length === 0) {
      setShowDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ, eligible.length, localCount]);

  // Core advance function — fires save in background, instantly slides
  const advanceToNext = useCallback((finalAnswer, isSkip = false) => {
    if (!currentQ || slidingRef.current) return;
    slidingRef.current = true;

    // Fire-and-forget save (unless skipping)
    if (!isSkip) {
      onAnswer(kid.id, currentQ, finalAnswer);
      // Trigger confetti celebration!
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100);
    } else {
      onSkip && onSkip(currentQ.id);
    }

    // +1 because this answer is about to be added to pastCards
    const countAfterThis = initialCountRef.current + pastCards.length + (isSkip ? 0 : 1);
    if (countAfterThis >= MAX_DAILY && !isSkip) {
      setPastCards((prev) => [...prev, currentQ]);
      setShowDone(true);
      slidingRef.current = false;
      return;
    }

    // Push current to past stack (only if not skipping)
    if (!isSkip) {
      setPastCards((prev) => [...prev, currentQ]);
    }
    setPrevQ(currentQ);
    setSlidePhase("sliding");

    setTimeout(() => {
      const freshEligible = eligibleRef.current;
      const remaining = freshEligible.filter((q) => q.id !== currentQ.id);
      const next = remaining.length > 0
        ? remaining[Math.floor(Math.random() * remaining.length)]
        : null;

      if (!next) {
        setShowDone(true);
        slidingRef.current = false;
        return;
      }

      setCurrentQ(next);
      setAnswer(null);
      setTextVal("");
      setScaleVal(5);
      setQuestionKey((k) => k + 1);
      setSlidePhase("entering");

      setTimeout(() => {
        setPrevQ(null);
        setSlidePhase("idle");
        slidingRef.current = false;
      }, 450);
    }, 350);
  }, [currentQ, kid.id, onAnswer, onSkip, pastCards.length]);

  // For multiple choice / this-or-that — instant advance on tap
  const handleInstantPick = useCallback((picked) => {
    advanceToNext(picked);
  }, [advanceToNext]);

  // For other types — manual submit button
  const submitAnswer = () => {
    if (!currentQ) return;
    let finalAnswer = answer;
    if (currentQ.type === "free_text" || currentQ.type === "creative") finalAnswer = textVal;
    if (currentQ.type === "scale") finalAnswer = scaleVal;
    advanceToNext(finalAnswer);
  };

  // Skip current question
  const handleSkip = () => {
    advanceToNext(null, true);
  };

  if (showDone) {
    return (
      <div style={screenStyle(theme)}>
        <Confetti active={true} theme={theme} />
        <Clouds theme={theme} />
        <div style={cardStyle(theme)}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 60, marginBottom: 12, animation: "pulse 1s ease infinite" }}>⭐</div>
            <h2 style={titleStyle(theme)}>GREAT JOB, {kid.name.toUpperCase()}!</h2>
            <p style={subtitleStyle(theme)}>
              {localCount >= MAX_DAILY
                ? "You answered all 10 questions today! Come back tomorrow for more!"
                : "No more questions right now! Check back soon!"}
            </p>
            {streak >= 2 && (
              <div style={{ marginTop: 12 }}>
                <StreakBadge streak={streak} theme={theme} />
              </div>
            )}
            <button onClick={onDone} style={{ ...bigBtnStyle(theme), marginTop: 16 }}>
              🏠 Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div style={screenStyle(theme)}>
        <Clouds theme={theme} />
        <div style={cardStyle(theme)}>
          <p style={subtitleStyle(theme)}>Loading question...</p>
        </div>
      </div>
    );
  }

  const needsSubmitBtn =
    slidePhase === "idle" && (
      ((currentQ.type === "free_text" || currentQ.type === "creative") && textVal.trim().length > 0) ||
      currentQ.type === "scale" ||
      (currentQ.type === "drawing" && answer !== null)
    );

  // Slide styles
  const prevCardAnimStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    animation: "cartridgeExit 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards",
    zIndex: 1,
    pointerEvents: "none",
  };

  const currentCardAnimStyle = slidePhase === "entering"
    ? { position: "relative", animation: "cartridgeEnter 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) forwards", zIndex: 2 }
    : slidePhase === "sliding"
    ? { position: "relative", opacity: 0, transform: "translateX(110%)", zIndex: 2, pointerEvents: "none" }
    : { position: "relative", zIndex: 2 };

  return (
    <div style={screenStyle(theme)}>
      <Confetti active={showConfetti} theme={theme} />
      <Clouds theme={theme} />
      {/* Outer wrapper for card + ghosts */}
      <div style={{ position: "relative", width: "100%", maxWidth: 520, display: "flex", justifyContent: "center" }}>
        {/* Past card ghosts — positioned outside and behind the main card */}
        {pastCards.slice(-3).map((q, i, arr) => (
          <PastCardGhost key={q.id + i} question={q} index={i} total={arr.length} theme={theme} />
        ))}

        <div style={{ ...cardStyle(theme), maxWidth: 520, overflow: "hidden", position: "relative", zIndex: 2 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, position: "relative", zIndex: 10 }}>
            <button onClick={onBack} style={smallBtnStyle(theme)}>
              ← Back
            </button>
            <CoinCounter count={localCount} max={MAX_DAILY} theme={theme} />
          </div>

          {/* Personalized greeting */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14, color: theme.text, opacity: 0.8 }}>
              {kid.gender === "female" ? "👸" : "🍄"} {kid.name}'s turn!
            </span>
            {streak >= 2 && <span style={{ marginLeft: 8 }}><StreakBadge streak={streak} theme={theme} /></span>}
          </div>

          <BrickBar theme={theme} height={8} />

          {/* Slide Container */}
          <div style={{ position: "relative", minHeight: 280, perspective: "800px" }}>
            {/* Previous question card - animating out */}
            {prevQ && slidePhase === "sliding" && (
              <QuestionCard
                question={prevQ}
                answer={null}
                setAnswer={() => {}}
                onInstantPick={null}
                scaleVal={5}
                setScaleVal={() => {}}
                textVal=""
                setTextVal={() => {}}
                theme={theme}
                style={prevCardAnimStyle}
                frozen
              />
            )}

            {/* Current question card */}
            <QuestionCard
              key={questionKey}
              question={currentQ}
              answer={answer}
              setAnswer={setAnswer}
              onInstantPick={handleInstantPick}
              scaleVal={scaleVal}
              setScaleVal={setScaleVal}
              textVal={textVal}
              setTextVal={setTextVal}
              theme={theme}
              style={currentCardAnimStyle}
              frozen={slidePhase !== "idle"}
            />
          </div>

        {/* Submit button — only for free_text, creative, scale, drawing */}
        {needsSubmitBtn && (
          <button
            onClick={submitAnswer}
            style={{
              ...bigBtnStyle(theme),
              width: "100%",
              marginTop: 16,
              fontSize: 13,
              position: "relative",
              zIndex: 10,
            }}
          >
            ⭐ SUBMIT!
          </button>
        )}
      </div>
      </div>
    </div>
  );
}

// ─── Type Badge ───
function TypeBadge({ type, theme }) {
  const badges = {
    multiple_choice: { label: "MC", emoji: "🎯" },
    free_text: { label: "TEXT", emoji: "✏️" },
    creative: { label: "CREATE", emoji: "🎨" },
    drawing: { label: "DRAW", emoji: "🖌️" },
    scale: { label: "SCALE", emoji: "📊" },
    this_or_that: { label: "PICK", emoji: "⚖️" },
  };
  const b = badges[type] || { label: type, emoji: "❓" };
  return (
    <span style={{
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 8,
      padding: "4px 8px",
      backgroundColor: theme.brick,
      color: "#fff",
      borderRadius: 4,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      whiteSpace: "nowrap",
      letterSpacing: "0.5px",
    }}>
      {b.emoji} {b.label}
    </span>
  );
}

// ─── Stat Card ───
function StatCard({ label, value, emoji, theme }) {
  return (
    <div style={{
      flex: "1 1 45%",
      minWidth: 100,
      backgroundColor: "rgba(255,255,255,0.08)",
      border: `2px solid ${theme.brick}`,
      borderRadius: 10,
      padding: "14px 10px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 26, marginBottom: 6 }}>{emoji}</div>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 18, color: theme.coin, textShadow: `1px 1px 0 ${theme.textShadow}` }}>
        {value}
      </div>
      <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 13, color: theme.text, opacity: 0.8, marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}

// ─── Response Card (expanded) ───
function ResponseCard({ response, question, kid, theme, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isDrawing = response.type === "drawing" && typeof response.answer === "string" && response.answer.startsWith("data:");

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        backgroundColor: expanded ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        cursor: "pointer",
        border: expanded ? `2px solid ${theme.brick}` : "1px solid rgba(255,255,255,0.12)",
        transition: "all 0.2s ease",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{kid?.gender === "female" ? "👸" : "🍄"}</span>
          <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 16, color: theme.text, flexShrink: 0 }}>
            {kid?.name || "?"}
          </span>
          <TypeBadge type={response.type} theme={theme} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 13, color: theme.text, opacity: 0.6 }}>
            age {response.kidAge}
          </span>
          <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 13, color: theme.text, opacity: 0.6 }}>
            {new Date(response.timestamp).toLocaleDateString()}
          </span>
          <span style={{ fontSize: 14, opacity: 0.5, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
        </div>
      </div>

      {/* Question text */}
      <div style={{
        fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 15, color: theme.coin, marginTop: 8, lineHeight: 1.4,
        overflow: expanded ? "visible" : "hidden",
        textOverflow: expanded ? "unset" : "ellipsis",
        whiteSpace: expanded ? "normal" : "nowrap",
      }}>
        {question?.text || response.questionText || response.questionId}
      </div>

      {/* Answer (expanded) */}
      {expanded && (
        <div style={{
          marginTop: 12,
          padding: 14,
          backgroundColor: "rgba(0,0,0,0.25)",
          borderRadius: 10,
          border: `1px solid rgba(255,255,255,0.08)`,
          animation: "fadeInUp 0.2s ease",
        }}>
          {isDrawing ? (
            <img src={response.answer} alt="Drawing" style={{ maxWidth: "100%", borderRadius: 6, display: "block" }} />
          ) : response.type === "scale" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 32, color: theme.coin }}>{response.answer}</div>
              <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 14, color: theme.text, opacity: 0.6, marginTop: 4 }}>out of 10</div>
            </div>
          ) : (
            <p style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 17, color: "#fff", margin: 0, lineHeight: 1.7 }}>
              {String(response.answer)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Compare View: side-by-side answers to the same question ───
function CompareView({ kids, responses, questions, theme }) {
  // Group responses by questionId, only keep questions answered by 2+ kids
  const byQuestion = {};
  responses.forEach((r) => {
    if (!byQuestion[r.questionId]) byQuestion[r.questionId] = [];
    byQuestion[r.questionId].push(r);
  });

  const sharedQuestions = Object.entries(byQuestion)
    .filter(([_, rs]) => {
      const uniqueKids = new Set(rs.map((r) => r.kidId));
      return uniqueKids.size >= 2;
    })
    .sort((a, b) => new Date(b[1][0].timestamp) - new Date(a[1][0].timestamp));

  if (sharedQuestions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "32px 16px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
        <p style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 16, color: theme.text, opacity: 0.7 }}>
          No shared questions yet! Once both kids answer the same question, you'll see their answers side by side here.
        </p>
      </div>
    );
  }

  const getKid = (kId) => kids.find((k) => k.id === kId);
  const getQ = (qId) => questions.find((q) => q.id === qId);

  return (
    <div>
      {sharedQuestions.map(([qId, rs]) => {
        const q = getQ(qId);
        return (
          <div key={qId} style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 12,
            border: `1px solid rgba(255,255,255,0.1)`,
          }}>
            {/* Question */}
            <div style={{
              fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 17,
              color: theme.coin, marginBottom: 12, lineHeight: 1.4,
              textAlign: "center",
              paddingBottom: 10,
              borderBottom: `1px solid rgba(255,255,255,0.1)`,
            }}>
              {q?.text || rs[0]?.questionText || qId}
            </div>

            {/* Side by side answers */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {rs.map((r, i) => {
                const kid = getKid(r.kidId);
                const kt = getTheme(kid?.gender);
                const isDrawing = r.type === "drawing" && typeof r.answer === "string" && r.answer.startsWith("data:");
                return (
                  <div key={r.kidId + i} style={{
                    flex: "1 1 45%",
                    minWidth: 140,
                    backgroundColor: "rgba(0,0,0,0.2)",
                    borderRadius: 10,
                    padding: 14,
                    border: `2px solid ${kt.brick}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>{kid?.gender === "female" ? "👸" : "🍄"}</span>
                      <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, color: kt.coin }}>{kid?.name}</span>
                      <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 12, color: theme.text, opacity: 0.6, marginLeft: "auto" }}>age {r.kidAge}</span>
                    </div>
                    {isDrawing ? (
                      <img src={r.answer} alt="Drawing" style={{ maxWidth: "100%", borderRadius: 6 }} />
                    ) : r.type === "scale" ? (
                      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 24, color: kt.coin, textAlign: "center" }}>
                        {r.answer}<span style={{ fontSize: 11, opacity: 0.5 }}>/10</span>
                      </div>
                    ) : (
                      <p style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 16, color: "#fff", margin: 0, lineHeight: 1.6 }}>
                        {String(r.answer)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Gallery View: drawings only ───
function GalleryView({ kids, responses, questions, theme }) {
  const drawings = responses
    .filter((r) => r.type === "drawing" && typeof r.answer === "string" && r.answer.startsWith("data:"))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const getKid = (kId) => kids.find((k) => k.id === kId);
  const getQ = (qId) => questions.find((q) => q.id === qId);

  if (drawings.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "32px 16px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🖌️</div>
        <p style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 16, color: theme.text, opacity: 0.7 }}>
          No drawings yet! Drawing questions will show up for the kids soon.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
      {drawings.map((r, i) => {
        const kid = getKid(r.kidId);
        const kt = getTheme(kid?.gender);
        const q = getQ(r.questionId);
        return (
          <div key={i} style={{
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: 12,
            overflow: "hidden",
            border: `2px solid ${kt.brick}`,
          }}>
            <img src={r.answer} alt="Drawing" style={{ width: "100%", display: "block", aspectRatio: "5/3", objectFit: "cover" }} />
            <div style={{ padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>{kid?.gender === "female" ? "👸" : "🍄"}</span>
                <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14, color: kt.coin }}>{kid?.name}</span>
                <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 12, color: theme.text, opacity: 0.6, marginLeft: "auto" }}>
                  age {r.kidAge}
                </span>
              </div>
              <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 13, color: theme.text, opacity: 0.8, lineHeight: 1.4 }}>
                {q?.text || r.questionText || "Drawing prompt"}
              </div>
              <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 11, color: theme.text, opacity: 0.5, marginTop: 4 }}>
                {new Date(r.timestamp).toLocaleDateString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Parent Dashboard ───
function ParentDashboard({ kids, responses, questions, onBack, onReset, theme }) {
  const [tab, setTab] = useState("timeline");
  const [selectedKid, setSelectedKid] = useState(null);

  const getKid = (kId) => kids.find((k) => k.id === kId);
  const getQ = (qId) => questions.find((q) => q.id === qId);

  const filteredResponses = selectedKid ? responses.filter((r) => r.kidId === selectedKid) : responses;
  const sorted = [...filteredResponses].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Stats
  const totalResponses = responses.length;
  const totalDrawings = responses.filter((r) => r.type === "drawing").length;
  const uniqueDays = new Set(responses.map((r) => new Date(r.timestamp).toDateString())).size;
  const sharedCount = (() => {
    const byQ = {};
    responses.forEach((r) => { byQ[r.questionId] = byQ[r.questionId] || new Set(); byQ[r.questionId].add(r.kidId); });
    return Object.values(byQ).filter((s) => s.size >= 2).length;
  })();

  const tabs = [
    { id: "timeline", label: "📋 Timeline", shortLabel: "📋" },
    { id: "compare", label: "🤝 Compare", shortLabel: "🤝" },
    { id: "gallery", label: "🖼️ Gallery", shortLabel: "🖼️" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
      padding: "16px",
      position: "relative",
    }}>
      {/* Header card */}
      <div style={{
        maxWidth: 680,
        margin: "0 auto 16px",
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 16,
        border: `3px solid ${theme.brick}`,
        padding: "16px 20px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={onBack} style={smallBtnStyle(theme)}>
            ← Back
          </button>
          <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: theme.coin, textShadow: `1px 1px 0 ${theme.textShadow}` }}>
            🔑 Parent Dashboard
          </h2>
        </div>

        <BrickBar theme={theme} height={4} />

        {/* Stats row */}
        <div style={{ display: "flex", gap: 8, margin: "14px 0", flexWrap: "wrap" }}>
          <StatCard label="Total Answers" value={totalResponses} emoji="⭐" theme={theme} />
          <StatCard label="Days Active" value={uniqueDays} emoji="📅" theme={theme} />
          <StatCard label="Drawings" value={totalDrawings} emoji="🖌️" theme={theme} />
          <StatCard label="Shared Qs" value={sharedCount} emoji="🤝" theme={theme} />
        </div>

        {/* Kid filter chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setSelectedKid(null)}
            style={{
              fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15,
              padding: "10px 18px",
              backgroundColor: !selectedKid ? theme.pipe : "rgba(255,255,255,0.08)",
              color: "#fff",
              border: !selectedKid ? `2px solid ${theme.pipeDark}` : "1px solid rgba(255,255,255,0.15)",
              borderRadius: 20,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            All Kids ({responses.length})
          </button>
          {kids.map((kid) => {
            const kt = getTheme(kid.gender);
            const count = responses.filter((r) => r.kidId === kid.id).length;
            const active = selectedKid === kid.id;
            return (
              <button
                key={kid.id}
                onClick={() => setSelectedKid(active ? null : kid.id)}
                style={{
                  fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15,
                  padding: "10px 18px",
                  backgroundColor: active ? kt.brick : "rgba(255,255,255,0.08)",
                  color: "#fff",
                  border: active ? `2px solid ${kt.brickLight}` : "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 20,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  transition: "all 0.15s",
                }}
              >
                {kid.gender === "female" ? "👸" : "🍄"} {kid.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        maxWidth: 680,
        margin: "0 auto 12px",
        display: "flex",
        gap: 4,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: 10,
        padding: 4,
      }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 10,
              padding: "14px 8px",
              backgroundColor: tab === t.id ? theme.brick : "transparent",
              color: tab === t.id ? "#fff" : "rgba(255,255,255,0.5)",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              transition: "all 0.15s",
              textShadow: tab === t.id ? `1px 1px 0 ${theme.textShadow}` : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{
        maxWidth: 680,
        margin: "0 auto",
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "20px",
        minHeight: 300,
        maxHeight: "60vh",
        overflowY: "auto",
      }}>
        {tab === "timeline" && (
          <>
            {sorted.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎮</div>
                <p style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 16, color: theme.text, opacity: 0.7 }}>
                  {selectedKid
                    ? `No responses from ${getKid(selectedKid)?.name} yet!`
                    : "No responses yet! Time to play!"}
                </p>
              </div>
            ) : (
              sorted.map((r, i) => (
                <ResponseCard
                  key={r.timestamp + i}
                  response={r}
                  question={getQ(r.questionId)}
                  kid={getKid(r.kidId)}
                  theme={theme}
                />
              ))
            )}
          </>
        )}

        {tab === "compare" && (
          <CompareView kids={kids} responses={filteredResponses} questions={questions} theme={theme} />
        )}

        {tab === "gallery" && (
          <GalleryView kids={kids} responses={filteredResponses} questions={questions} theme={theme} />
        )}
      </div>

      {/* Footer with reset */}
      <div style={{ maxWidth: 680, margin: "16px auto 0", textAlign: "center" }}>
        <button onClick={onReset} style={{
          ...smallBtnStyle(theme),
          backgroundColor: "rgba(160,48,48,0.6)",
          fontSize: 10,
          padding: "10px 20px",
          border: "1px solid rgba(160,48,48,0.8)",
        }}>
          🔄 Reset All Data
        </button>
      </div>
    </div>
  );
}

// ─── Styles ───
function screenStyle(theme) {
  return {
    minHeight: "100vh",
    background: `linear-gradient(180deg, ${theme.bg} 0%, ${theme.bg} 70%, ${theme.ground} 70%, ${theme.groundDark} 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    position: "relative",
    overflow: "hidden",
  };
}

function cardStyle(theme) {
  return {
    backgroundColor: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(8px)",
    borderRadius: 16,
    border: `3px solid ${theme.brick}`,
    padding: "20px",
    width: "100%",
    maxWidth: 440,
    position: "relative",
    zIndex: 1,
    boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`,
  };
}

function titleStyle(theme) {
  return {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 18,
    color: theme.coin,
    textShadow: `2px 2px 0 ${theme.textShadow}, -1px -1px 0 ${theme.blockDark}`,
    margin: "12px 0 4px",
    lineHeight: 1.4,
  };
}

function subtitleStyle(theme) {
  return {
    fontFamily: "'Quicksand', sans-serif",
    fontWeight: 600,
    fontSize: 14,
    color: theme.text,
    opacity: 0.85,
    margin: 0,
  };
}

function inputStyle(theme) {
  return {
    width: "100%",
    padding: "10px 12px",
    backgroundColor: "rgba(255,255,255,0.12)",
    border: `2px solid rgba(255,255,255,0.25)`,
    borderRadius: 8,
    color: "#fff",
    fontFamily: "'Quicksand', sans-serif",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 4,
  };
}

function genderBtnStyle(theme) {
  return {
    flex: 1,
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 9,
    padding: "10px 8px",
    color: "#fff",
    borderRadius: 8,
    cursor: "pointer",
    textAlign: "center",
  };
}

// ─── Global Styles ───
function GlobalStyles() {
  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }
        @keyframes cloudFloat {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(calc(100vw + 120%)); }
        }
        @keyframes blockBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cartridgeEnter {
          0% { transform: translateX(110%) scale(0.9); opacity: 0; }
          60% { transform: translateX(-3%) scale(1.02); opacity: 1; }
          80% { transform: translateX(1%) scale(1); }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes cartridgeExit {
          0% { transform: translateX(0) scale(1); opacity: 1; }
          100% { transform: translateX(-85%) scale(0.88) rotateY(8deg); opacity: 0.35; filter: brightness(0.5); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        input[type="range"] {
          -webkit-appearance: none;
          height: 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.3);
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #f8d830;
          border: 3px solid #a87000;
          cursor: pointer;
        }
        textarea:focus, input:focus {
          border-color: rgba(255,255,255,0.5) !important;
          background-color: rgba(255,255,255,0.18) !important;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
      `}</style>
    </>
  );
}

// ─── Main App ───
export default function App() {
  const [screen, setScreen] = useState("loading");
  const [kids, setKids] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [dailyCounts, setDailyCounts] = useState({});
  const [activeKid, setActiveKid] = useState(null);
  const [generating, setGenerating] = useState(false);
  const defaultTheme = MARIO_THEME;

  // ─── Load from storage ───
  useEffect(() => {
    (async () => {
      try {
        const kidsData = await window.storage.get("qq-kids");
        const qData = await window.storage.get("qq-questions");
        const rData = await window.storage.get("qq-responses");
        const dData = await window.storage.get("qq-daily");

        const loadedKids = kidsData ? JSON.parse(kidsData.value) : [];
        const loadedQ = qData ? JSON.parse(qData.value) : [];
        const loadedR = rData ? JSON.parse(rData.value) : [];
        const loadedD = dData ? JSON.parse(dData.value) : {};

        setKids(loadedKids);
        setQuestions(loadedQ.length > 0 ? loadedQ : STARTER_QUESTIONS);
        setResponses(loadedR);
        setDailyCounts(loadedD);
        setScreen(loadedKids.length > 0 ? "select" : "setup");
      } catch {
        setQuestions(STARTER_QUESTIONS);
        setScreen("setup");
      }
    })();
  }, []);

  // ─── Save helpers ───
  const saveKids = async (k) => {
    setKids(k);
    try { await window.storage.set("qq-kids", JSON.stringify(k)); } catch {}
  };
  const saveQuestions = async (q) => {
    setQuestions(q);
    try { await window.storage.set("qq-questions", JSON.stringify(q)); } catch {}
  };
  const saveResponses = async (r) => {
    setResponses(r);
    try { await window.storage.set("qq-responses", JSON.stringify(r)); } catch {}
  };
  const saveDailyCounts = async (d) => {
    setDailyCounts(d);
    try { await window.storage.set("qq-daily", JSON.stringify(d)); } catch {}
  };

  // ─── Setup complete ───
  const handleSetup = async (newKids) => {
    await saveKids(newKids);
    await saveQuestions(STARTER_QUESTIONS);
    setScreen("select");
  };

  // ─── Get today's count for a kid ───
  const getTodayCount = (kidId) => {
    const key = `${kidId}_${getTodayKey()}`;
    return dailyCounts[key] || 0;
  };

  // ─── Submit answer ───
  const handleAnswer = async (kidId, question, answer) => {
    const newResponse = {
      kidId,
      questionId: question.id,
      type: question.type,
      questionText: question.text,
      answer,
      timestamp: new Date().toISOString(),
      kidAge: getAge(kids.find((k) => k.id === kidId)?.birthday || "2015-01-01"),
    };

    const newResponses = [...responses, newResponse];
    await saveResponses(newResponses);

    const key = `${kidId}_${getTodayKey()}`;
    const newDaily = { ...dailyCounts, [key]: (dailyCounts[key] || 0) + 1 };
    await saveDailyCounts(newDaily);

    // Remove answered question from pool and check if we need more
    const remainingQs = questions.filter((q) => q.id !== question.id);
    await saveQuestions(remainingQs);

    if (remainingQs.length < 5 && !generating) {
      setGenerating(true);
      const newQs = await generateQuestions(kids);
      if (newQs.length > 0) {
        const merged = [...remainingQs, ...newQs];
        await saveQuestions(merged);
      }
      setGenerating(false);
    }
  };

  // ─── Reset ───
  const handleReset = async () => {
    if (!confirm("Reset ALL data? This cannot be undone!")) return;
    try {
      await window.storage.delete("qq-kids");
      await window.storage.delete("qq-questions");
      await window.storage.delete("qq-responses");
      await window.storage.delete("qq-daily");
    } catch {}
    setKids([]);
    setQuestions(STARTER_QUESTIONS);
    setResponses([]);
    setDailyCounts({});
    setScreen("setup");
  };

  const renderScreen = () => {
    if (screen === "loading") {
      return (
        <div style={screenStyle(defaultTheme)}>
          <div style={{ textAlign: "center" }}>
            <QuestionBlock theme={defaultTheme} size={50} animate />
            <p style={{ ...titleStyle(defaultTheme), marginTop: 16 }}>Loading...</p>
          </div>
        </div>
      );
    }

    if (screen === "setup") {
      return <SetupScreen onComplete={handleSetup} theme={defaultTheme} />;
    }

    if (screen === "select") {
      return (
        <KidSelectScreen
          kids={kids}
          onSelect={(kid) => {
            setActiveKid(kid);
            setScreen("play");
          }}
          onParentMode={() => setScreen("dashboard")}
          theme={defaultTheme}
        />
      );
    }

    if (screen === "play" && activeKid) {
      return (
        <QuestionScreen
          kid={activeKid}
          questions={questions}
          todayCount={getTodayCount(activeKid.id)}
          responses={responses}
          onAnswer={handleAnswer}
          onBack={() => setScreen("select")}
          onDone={() => {
            setActiveKid(null);
            setScreen("select");
          }}
        />
      );
    }

    if (screen === "dashboard") {
      return (
        <ParentDashboard
          kids={kids}
          responses={responses}
          questions={[...questions, ...STARTER_QUESTIONS]}
          onBack={() => setScreen("select")}
          onReset={handleReset}
          theme={defaultTheme}
        />
      );
    }

    return null;
  };

  return (
    <>
      <GlobalStyles />
      {renderScreen()}
    </>
  );
}
