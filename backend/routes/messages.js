const express = require("express");
const router = express.Router({ mergeParams: true });
const supabase = require("../db"); // pool 대신 supabase 클라이언트

// 특정 채팅방의 메시지 목록 조회 (최근 50개, 최신순)
router.get("/", async (req, res) => {
  const { roomId } = req.params;

  try {
    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        id,
        user_id,
        content,
        created_at,
        users:user_id (username)
      `
      )
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    // 중첩된 users 객체를 평면화하여 기존 구조와 동일하게 만들기
    const messages = data.map((message) => ({
      id: message.id,
      user_id: message.user_id,
      content: message.content,
      created_at: message.created_at,
      username: message.users.username,
    }));

    res.json(messages);
  } catch (err) {
    console.error("메시지 목록 조회 오류:", err);
    res.status(500).json({ error: err.message });
  }
});

// 메시지 전송
router.post("/", async (req, res) => {
  const { roomId } = req.params;
  const { user_id, content } = req.body;

  if (!user_id || !content) {
    return res.status(400).json({ error: "user_id와 content가 필요합니다." });
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          room_id: parseInt(roomId), // roomId를 정수로 변환
          user_id: parseInt(user_id), // user_id도 정수로 변환
          content: content,
        },
      ])
      .select("id, room_id, user_id, content, created_at")
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("메시지 전송 오류:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
