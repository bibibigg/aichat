const express = require("express");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const supabase = require("./db"); // 이제 supabase 클라이언트
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
    const { data: existingUsers, error: selectError } = await supabase
      .from("users")
      .select("id, username")
      .eq("username", username);

    if (selectError) throw selectError;

    if (existingUsers && existingUsers.length > 0) {
      // 이미 있으면 해당 유저 반환
      return res.json(existingUsers[0]);
    }

    // 없으면 새로 생성
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([{ username }])
      .select("id, username")
      .single();

    if (insertError) throw insertError;

    return res.status(201).json(newUser);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// AI 유저 이름 상수
const AI_USERNAME = "민수";

// AI 유저 ID를 가져오거나 없으면 생성하는 함수
async function getOrCreateAIUserId() {
  try {
    // 먼저 AI 유저가 있는지 확인
    const { data: existingAI, error: selectError } = await supabase
      .from("users")
      .select("id")
      .eq("username", AI_USERNAME)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116은 "not found" 에러
      throw selectError;
    }

    if (existingAI) {
      return existingAI.id;
    }

    // 없으면 새로 생성
    const { data: newAI, error: insertError } = await supabase
      .from("users")
      .insert([{ username: AI_USERNAME }])
      .select("id")
      .single();

    if (insertError) throw insertError;

    return newAI.id;
  } catch (err) {
    console.error("AI 유저 생성/조회 오류:", err);
    throw err;
  }
}

const ai = new GoogleGenAI({});

// Gemini API로 자연스러운 사람 답변 생성 함수 (공식 SDK 사용)
async function getGeminiReply(roomId) {
  try {
    // 채팅방 메세지 최근기준 20개 가져오기 (JOIN 쿼리를 Supabase 방식으로)
    const { data: messages, error } = await supabase
      .from("messages")
      .select(
        `
        content,
        users:user_id (username)
      `
      )
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    // 오래된 순으로 정렬
    const history = messages.reverse();

    const prompt =
      "너는 AI가 아니라 평범한 사람이다. 절대 AI임을 밝히지 말고, 자연스럽고 인간적인 말투로 대답해라.\n" +
      history.map((msg) => `${msg.users.username}: ${msg.content}`).join("\n") +
      "\n너:";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }, // 사고 비활성화
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
      const { data: newMessage, error: insertError } = await supabase
        .from("messages")
        .insert([
          {
            room_id: roomId,
            user_id: userId,
            content: content,
          },
        ])
        .select(
          `
          id,
          content,
          created_at,
          user_id,
          users:user_id (username)
        `
        )
        .single();

      if (insertError) throw insertError;

      // username을 평면화해서 기존 구조와 동일하게 만들기
      const message = {
        id: newMessage.id,
        content: newMessage.content,
        created_at: newMessage.created_at,
        user_id: newMessage.user_id,
        username: newMessage.users.username,
      };

      // 같은 방의 모든 클라이언트에게 메시지 전송
      io.to(`room_${roomId}`).emit("chatMessage", message);

      // --- AI 유저가 해당 채팅방에 없으면 자동으로 참여(메시지 전송 준비) ---
      const aiUserId = await getOrCreateAIUserId();

      // 실제 Gemini API 호출로 자연스러운 답변 생성
      const aiReply = await getGeminiReply(roomId);

      // AI 메시지 저장
      const { data: newAIMessage, error: aiInsertError } = await supabase
        .from("messages")
        .insert([
          {
            room_id: roomId,
            user_id: aiUserId,
            content: aiReply,
          },
        ])
        .select(
          `
          id,
          content,
          created_at,
          user_id,
          users:user_id (username)
        `
        )
        .single();

      if (aiInsertError) throw aiInsertError;

      // AI 메시지도 평면화
      const aiMessage = {
        id: newAIMessage.id,
        content: newAIMessage.content,
        created_at: newAIMessage.created_at,
        user_id: newAIMessage.user_id,
        username: newAIMessage.users.username,
      };

      // AI 메시지 전송
      io.to(`room_${roomId}`).emit("chatMessage", aiMessage);
    } catch (err) {
      console.error("메시지 저장/전송 오류:", err.message);
    }
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
