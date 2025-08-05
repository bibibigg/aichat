const express = require("express");
const router = express.Router();
const supabase = require("../db"); // pool 대신 supabase 클라이언트

// 채팅방 목록 조회
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("chat_rooms")
      .select("id, name")
      .order("created_at", { ascending: false }); // 최신순으로 정렬 (선택사항)

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("채팅방 목록 조회 오류:", err);
    res.status(500).json({ error: err.message });
  }
});

// 채팅방 생성
router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "채팅방 이름이 필요합니다." });
  }

  try {
    const { data, error } = await supabase
      .from("chat_rooms")
      .insert([{ name }])
      .select("id, name")
      .single(); // 단일 객체 반환

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("채팅방 생성 오류:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
