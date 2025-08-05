# aichat

## cursor를 적극 이용한 채팅 기능 구현 토이프로젝트

- 목적 : ai툴을 활용하여 단기간에 기능 구현 및 gemini api를 활용한 채팅 기능 구현

## 기술 스택

### 백엔드

- Node.js
- Express
- Socket.IO (실시간 통신)
- supabase.js
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

25.08.25 mysql에서 supabase로 전환

## 기능

- 로그인: 이름 입력으로 로그인, 서버에 해당 이름이 없을 시 해당이름으로 회원가입되어 로그인
  <img src="https://raw.githubusercontent.com/bibibigg/aichat/main/docs/login.png" alt="로그인"/>

- 채팅방 선택 및 개설 : 로그인 후 개설되어 있는 채팅방을 선택하거나 채팅방 이름을 입력한 뒤 생성 버튼을 누를 시 채팅방이 개설
  <img src="https://raw.githubusercontent.com/bibibigg/aichat/main/docs/chatroom.png" alt="채팅방 선택 및 개설"/>

- 채팅 : 원하는 채팅방에 입장하면 소켓통신으로 실시간 채팅 가능, 모든 채팅방에는 ai유저가 들어가있어서 혼자있어도 채팅가능
  <img src="https://raw.githubusercontent.com/bibibigg/aichat/main/docs/chat.png" alt="채팅"/>
  민수 라는 계정을 AI유저로 사용하고 있습니다.
