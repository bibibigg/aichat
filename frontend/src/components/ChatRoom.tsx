import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  id: number;
  content: string;
  created_at: string;
  username: string;
  user_id: number;
}

interface User {
  id: number;
  username: string;
}

interface ChatRoomProps {
  roomId: number;
  roomName: string;
  user: User;
  onBack: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE;
let socket: Socket | null = null;

const ChatRoom: React.FC<ChatRoomProps> = ({
  roomId,
  roomName,
  user,
  onBack,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 최초 메시지 목록 불러오기
  const fetchMessages = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/rooms/${roomId}/messages`);
      if (!res.ok) throw new Error("메시지 목록을 불러오지 못했습니다.");
      const data = await res.json();
      setMessages(data.reverse()); // 최신순 → 오래된순
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // 소켓 연결 및 방 입장
    if (!socket) {
      socket = io(API_BASE);
    }
    socket.emit("joinRoom", roomId);

    // 서버에서 오는 실시간 메시지 처리
    const handleChatMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };
    socket.on("chatMessage", handleChatMessage);

    return () => {
      socket?.off("chatMessage", handleChatMessage);
      // socket 연결은 앱 전체에서 하나만 유지(여기선 disconnect하지 않음)
    };
    // eslint-disable-next-line
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 메시지 전송 (소켓 사용)
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setError("");
    try {
      socket?.emit("chatMessage", { roomId, userId: user.id, content: newMsg });
      setNewMsg("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-2">
      <section className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 mt-8">
        <button
          onClick={onBack}
          className="mb-4 text-indigo-600 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded px-2 py-1"
          aria-label="채팅방 목록으로 돌아가기"
        >
          &lt; 채팅방 목록으로
        </button>
        <h2 className="text-xl font-bold text-indigo-700 mb-4 text-center">
          {roomName}
        </h2>
        {loading && <p className="text-gray-500 text-center">불러오는 중...</p>}
        {error && <p className="text-red-500 text-center mb-2">{error}</p>}
        <div
          className="border border-indigo-200 rounded-lg h-72 overflow-y-auto p-3 mb-4 bg-indigo-50"
          role="log"
          aria-live="polite"
        >
          <ul className="space-y-2">
            {messages.map((msg) => {
              const isMine = msg.user_id === user.id;
              return (
                <li
                  key={msg.id}
                  className={`flex flex-col rounded-lg p-2 ${
                    isMine ? "bg-white" : "bg-blue-100"
                  }`}
                >
                  <span className="font-semibold text-indigo-800">
                    {msg.username}
                  </span>
                  <span className="text-gray-800 break-words">
                    {msg.content}
                  </span>
                  <span className="text-xs text-gray-400 self-end">
                    {msg.created_at}
                  </span>
                </li>
              );
            })}
          </ul>
          <div ref={messagesEndRef} />
        </div>
        <form
          onSubmit={handleSend}
          className="flex gap-2"
          aria-label="메시지 입력"
        >
          <label htmlFor="newMsg" className="sr-only">
            메시지 입력
          </label>
          <input
            id="newMsg"
            type="text"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="메시지 입력"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            autoComplete="off"
            aria-label="메시지 입력"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-300"
            disabled={loading}
            aria-label="메시지 전송"
          >
            전송
          </button>
        </form>
      </section>
    </main>
  );
};

export default ChatRoom;
