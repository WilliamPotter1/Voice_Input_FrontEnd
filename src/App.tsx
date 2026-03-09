import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { VoiceInputPage } from './pages/VoiceInputPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { QuoteListPage } from './pages/QuoteListPage';
import { QuoteEditorPage } from './pages/QuoteEditorPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<VoiceInputPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="quotes"
          element={
            <ProtectedRoute>
              <QuoteListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="quotes/new"
          element={
            <ProtectedRoute>
              <QuoteEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="quotes/:id"
          element={
            <ProtectedRoute>
              <QuoteEditorPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
