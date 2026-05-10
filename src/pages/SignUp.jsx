import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../services/api';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
`;

const Box = styled.div`
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: #3e3b47;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 28px;
  color: #ff9000;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: #666360;
  margin-bottom: 32px;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  padding: 16px;
  background: #232129;
  border: 2px solid #232129;
  border-radius: 10px;
  color: #f4ede8;
  margin-bottom: 8px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #ff9000;
  }

  &::placeholder { color: #666360; }
`;

const Button = styled.button`
  width: 100%;
  padding: 16px;
  background: #ff9000;
  border: none;
  border-radius: 10px;
  color: #312e38;
  font-size: 16px;
  font-weight: bold;
  margin-top: 16px;
  transition: background 0.2s;

  &:hover { background: #e08000; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const Error = styled.p`
  color: #c53030;
  font-size: 14px;
  margin-bottom: 8px;
`;

const SignInLink = styled.p`
  margin-top: 24px;
  color: #666360;
  font-size: 14px;

  a { color: #ff9000; margin-left: 4px; }
`;

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/users', { name, email, password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <Box>
        <Title>GoBarber</Title>
        <Subtitle>Crea tu cuenta</Subtitle>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {error && <Error>{error}</Error>}
          <Input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear cuenta'}
          </Button>
        </form>
        <SignInLink>
          ¿Ya tienes cuenta?
          <Link to="/">Iniciar sesión</Link>
        </SignInLink>
      </Box>
    </Container>
  );
}
