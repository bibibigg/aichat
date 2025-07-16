const express = require("express");
const router = express.Router({ mergeParams: true });
const pool = require("../db");

// 특정 채팅방의 메시지 목록 조회 (최근 50개, 최신순)
router.get("/", async (req, res) => {
  const { roomId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.user_id, m.content, m.created_at, u.username
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.room_id = ?
       ORDER BY m.created_at DESC
       LIMIT 50`,
      [roomId]
    );
    res.json(rows);
  } catch (err) {
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
    const [result] = await pool.query(
      "INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)",
      [roomId, user_id, content]
    );
    res
      .status(201)
      .json({ id: result.insertId, room_id: roomId, user_id, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
