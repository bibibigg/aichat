# aichat

## cursor를 적극 이용한 채팅 기능 구현 토이프로젝트

- 목적 : ai툴을 활용하여 단기간에 기능 구현 및 gemini api를 활용한 채팅 기능 구현

## 기술 스택

### 백엔드

- Node.js
- Express
- Socket.IO (실시간 통신)
- MySQL (mysql2)
- dotenv (환경 변수 관리)
- CORS (교차 출처 리소스 공유)
- nodemon (개발용 자동 재시작, devDependency)

### 프론트엔드

- React
- React Router DOM (SPA 라우팅)
- TypeScript
- Vite (프론트엔드 빌드 도구)
- Tailwind CSS (유틸리티 퍼스트 CSS 프레임워크)
- Socket.IO Client (실시간 통신)
- ESLint (코드 린팅)
- @vitejs/plugin-react (Vite용 React 플러그인)

### DB

- MySql

### DB구조

```bash
CREATE TABLE users (
id INT PRIMARY KEY AUTO_INCREMENT,
username VARCHAR(50) UNIQUE NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 채팅방 테이블 (간단 버전)
CREATE TABLE chat_rooms (
id INT PRIMARY KEY AUTO_INCREMENT,
name VARCHAR(100) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 메시지 테이블 (간단 버전)
CREATE TABLE messages (
id INT PRIMARY KEY AUTO_INCREMENT,
room_id INT NOT NULL,
user_id INT NOT NULL,
content TEXT NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
INDEX idx_room_created (room_id, created_at)
);
```

## 기능

- 로그인: 이름 입력으로 로그인, 서버에 해당 이름이 없을 시 해당이름으로 회원가입되어 로그인
  <img src="https://raw.githubusercontent.com/bibibigg/aichat/main/docs/login.png" alt="로그인"/>

- 채팅방 선택 및 개설 : 로그인 후 개설되어 있는 채팅방을 선택하거나 채팅방 이름을 입력한 뒤 생성 버튼을 누를 시 채팅방이 개설
  <img src="https://raw.githubusercontent.com/bibibigg/aichat/main/docs/chatroom.png" alt="채팅방 선택 및 개설"/>

- 채팅 : 원하는 채팅방에 입장하면 소켓통신으로 실시간 채팅 가능, 모든 채팅방에는 ai유저가 들어가있어서 혼자있어도 채팅가능
  <img src="https://raw.githubusercontent.com/bibibigg/aichat/main/docs/chat.png" alt="채팅"/>
  민수 라는 계정을 AI유저로 사용하고 있습니다.

##사용방법

1. 백엔드와 프론트엔드 폴더에 .env파일을 생성 및 DB 연결

- 백엔드 env

```bash
DB_HOST=localhost
DB_USER=유저명
DB_PASSWORD=패스워드
DB_NAME=DB이름
PORT=4000
GEMINI_API_KEY=google AI Studio에서 발급받은 키
```

- 프론트엔드 env

```bash
 VITE_API_BASE=http://localhost:4000
```

2. 각 폴더(backend, frontend)에서 의존성 설치

```bash
cd backend
npm install

cd ../frontend
npm install
```

3. 서버 및 클라이언트 실행

- 백엔드:

```bash
npm run dev
```

- 프론트엔드:

```bash
 npm run dev
```
