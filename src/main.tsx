import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Login from './components/Login.tsx'

function Root() {
  // sessionStorage에 auth 값이 있으면 이미 로그인된 상태
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('auth') === 'ok');

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
