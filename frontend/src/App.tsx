import React, { useState } from "react";
import ChatRoomList from "./components/ChatRoomList";
import ChatRoom from "./components/ChatRoom";
import Login from "./components/Login";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams,
  Navigate,
  useLocation,
} from "react-router-dom";

function App() {
  const [user, setUser] = useState<{ id: number; username: string } | null>(
    null
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginWithNav onLogin={setUser} />} />
        <Route
          path="/*"
          element={
            <RequireAuth user={user}>
              <AppRoutes user={user!} />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

function RequireAuth({
  user,
  children,
}: {
  user: any;
  children: React.ReactNode;
}) {
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoginWithNav({
  onLogin,
}: {
  onLogin: (user: { id: number; username: string }) => void;
}) {
  const navigate = useNavigate();
  return (
    <Login
      onLogin={(user) => {
        onLogin(user);
        navigate("/");
      }}
    />
  );
}

function AppRoutes({ user }: { user: { id: number; username: string } }) {
  return (
    <Routes>
      <Route path="/" element={<ChatRoomListWithNav />} />
      <Route
        path="/room/:roomId"
        element={<ChatRoomWithParams user={user} />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function ChatRoomListWithNav() {
  const navigate = useNavigate();
  return (
    <div>
      <ChatRoomList
        onSelectRoom={(id, name) =>
          navigate(`/room/${id}?name=${encodeURIComponent(name)}`)
        }
      />
    </div>
  );
}

function ChatRoomWithParams({
  user,
}: {
  user: { id: number; username: string };
}) {
  const { roomId } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const roomName = params.get("name") || "";
  const id = Number(roomId);
  if (!id || !roomName) return <Navigate to="/" />;
  return (
    <ChatRoom
      roomId={id}
      roomName={roomName}
      user={user}
      onBack={() => window.history.back()}
    />
  );
}

export default App;
