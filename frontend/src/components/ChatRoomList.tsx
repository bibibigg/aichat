import React, { useEffect, useState } from "react";

interface ChatRoom {
  id: number;
  name: string;
}

interface ChatRoomListProps {
  onSelectRoom: (roomId: number, roomName: string) => void;
}

const API_BASE = import.meta.env.VITE_API_BASE;

const ChatRoomList: React.FC<ChatRoomListProps> = ({ onSelectRoom }) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [newRoom, setNewRoom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 채팅방 목록 불러오기
  const fetchRooms = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/rooms`);
      if (!res.ok) throw new Error("채팅방 목록을 불러오지 못했습니다.");
      const data = await res.json();
      setRooms(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // 채팅방 생성
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.trim()) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoom }),
      });
      if (!res.ok) throw new Error("채팅방 생성 실패");
      setNewRoom("");
      fetchRooms();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-2">
      <section className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 mt-8">
        <h2 className="text-xl font-bold text-indigo-700 mb-4 text-center">
          채팅방 목록
        </h2>
        {loading && <p className="text-gray-500 text-center">불러오는 중...</p>}
        {error && <p className="text-red-500 text-center mb-2">{error}</p>}
        <ul className="space-y-2 mb-6" aria-label="채팅방 목록">
          {rooms.map((room) => (
            <li key={room.id}>
              <button
                type="button"
                onClick={() => onSelectRoom(room.id, room.name)}
                className="w-full text-left px-4 py-2 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition text-indigo-800 font-medium"
                aria-label={`채팅방 ${room.name} 입장`}
              >
                {room.name}
              </button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={handleCreateRoom}
          className="flex gap-2"
          aria-label="채팅방 생성"
        >
          <label htmlFor="newRoom" className="sr-only">
            새 채팅방 이름
          </label>
          <input
            id="newRoom"
            type="text"
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            placeholder="새 채팅방 이름"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            autoComplete="off"
            aria-label="새 채팅방 이름"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-300"
            disabled={loading}
            aria-label="채팅방 생성"
          >
            생성
          </button>
        </form>
      </section>
    </main>
  );
};

export default ChatRoomList;
