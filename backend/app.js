const express = require("express");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const pool = require("./db");
const roomsRouter = require("./routes/rooms");
const messagesRouter = require("./routes/messages");
const { GoogleGenAI } = require("@google/genai");

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("Chat App Backend Running!");
});

app.use("/rooms", roomsRouter);
app.use("/rooms/:roomId/messages", messagesRouter);

// 간단 로그인/회원가입 API
app.post("/login", async (req, res) => {
  const { username } = req.body;
  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "username이 필요합니다." });
  }
  try {
    // username이 이미 있는지 확인
    const [users] = await pool.query(
      "SELECT id, username FROM users WHERE username = ?",
      [username]
    );
    if (users.length > 0) {
      // 이미 있으면 해당 유저 반환
      return res.json(users[0]);
    }
    // 없으면 새로 생성
    const [result] = await pool.query(
      "INSERT INTO users (username) VALUES (?)",
      [username]
    );
    return res.status(201).json({ id: result.insertId, username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI 유저 이름 상수
const AI_USERNAME = "민수";

// AI 유저 ID를 가져오거나 없으면 생성하는 함수
async function getOrCreateAIUserId() {
  const [rows] = await pool.query("SELECT id FROM users WHERE username = ?", [
    AI_USERNAME,
  ]);
  if (rows.length > 0) return rows[0].id;
  const [result] = await pool.query("INSERT INTO users (username) VALUES (?)", [
    AI_USERNAME,
  ]);
  return result.insertId;
}

const ai = new GoogleGenAI({});

// Gemini API로 자연스러운 사람 답변 생성 함수 (공식 SDK 사용)
async function getGeminiReply(userMessage) {
  const prompt = `너는 AI가 아니라 평범한 사람이다. 절대 AI임을 밝히지 말고, 자연스럽고 인간적인 말투로 대답해라.\n상대방: ${userMessage}\n너:`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      // config: { thinkingConfig: { thinkingBudget: 0 } } // 필요시 사고 비활성화
    });
    return response.text.trim();
  } catch (err) {
    console.error("Gemini API 오류:", err);
    return "...";
  }
}

// --- socket.io 연동 ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  // 채팅방 입장
  socket.on("joinRoom", (roomId) => {
    socket.join(`room_${roomId}`);
  });

  // 메시지 전송
  socket.on("chatMessage", async ({ roomId, userId, content }) => {
    if (!roomId || !userId || !content) return;
    try {
      // DB에 메시지 저장
      const [result] = await pool.query(
        "INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)",
        [roomId, userId, content]
      );
      // 저장된 메시지 정보 조회 (username 포함)
      const [rows] = await pool.query(
        `SELECT m.id, m.content, m.created_at, u.username
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.id = ?`,
        [result.insertId]
      );
      const message = rows[0];
      // 같은 방의 모든 클라이언트에게 메시지 전송
      io.to(`room_${roomId}`).emit("chatMessage", message);

      // --- AI 유저가 해당 채팅방에 없으면 자동으로 참여(메시지 전송 준비) ---
      const aiUserId = await getOrCreateAIUserId();
      // 실제 Gemini API 호출로 자연스러운 답변 생성
      const aiReply = await getGeminiReply(content);
      const [aiResult] = await pool.query(
        "INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)",
        [roomId, aiUserId, aiReply]
      );
      const [aiRows] = await pool.query(
        `SELECT m.id, m.content, m.created_at, u.username
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.id = ?`,
        [aiResult.insertId]
      );
      const aiMessage = aiRows[0];
      io.to(`room_${roomId}`).emit("chatMessage", aiMessage);
    } catch (err) {
      console.error("메시지 저장/전송 오류:", err.message);
    }
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
