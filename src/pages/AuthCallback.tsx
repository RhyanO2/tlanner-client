// src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setToken } from '../lib/auth';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      console.log('✅ Token recebido do GitHub OAuth');

      // Salvar token no localStorage
      setToken(token);

      // Redirecionar para dashboard
      navigate('/dashboard', { replace: true });
    } else {
      // Se não tem token, algo deu errado
      console.error('❌ Token não encontrado na URL');
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div
      className="container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <div
        className="card"
        style={{
          textAlign: 'center',
          padding: '3rem',
          maxWidth: '400px',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>Autenticando...</h2>
        <p className="muted">
          Aguarde enquanto finalizamos seu login com GitHub.
        </p>
        <div
          style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div className="spinner"></div>
        </div>
      </div>
    </div>
  );
}
