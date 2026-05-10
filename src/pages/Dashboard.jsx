import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
`;

const Logo = styled.h1`
  color: #ff9000;
  font-size: 24px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  span { color: #f4ede8; font-size: 14px; }
`;

const SignOutButton = styled.button`
  background: transparent;
  border: 1px solid #666360;
  color: #666360;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;

  &:hover { border-color: #ff9000; color: #ff9000; }
`;

const Title = styled.h2`
  font-size: 20px;
  margin-bottom: 24px;
  color: #f4ede8;
`;

const ProvidersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const ProviderCard = styled.button`
  background: #3e3b47;
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
  color: #f4ede8;

  &:hover {
    border-color: #ff9000;
    transform: translateY(-2px);
  }
`;

const Avatar = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
`;

const ProviderName = styled.span`
  font-size: 16px;
  font-weight: bold;
`;

const Loading = styled.p`
  color: #666360;
  text-align: center;
  margin-top: 40px;
`;

export default function Dashboard() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/providers')
      .then(res => setProviders(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container>
      <Header>
        <Logo>GoBarber</Logo>
        <UserInfo>
          <span>Hola, {user?.name}</span>
          <SignOutButton onClick={signOut}>Salir</SignOutButton>
        </UserInfo>
      </Header>

      <Title>Elige tu barbero</Title>

      {loading ? (
        <Loading>Cargando barberos...</Loading>
      ) : providers.length === 0 ? (
        <Loading>No hay barberos disponibles.</Loading>
      ) : (
        <ProvidersGrid>
          {providers.map(provider => (
            <ProviderCard
              key={provider.id}
              onClick={() => navigate(`/booking/${provider.id}`)}
            >
              <Avatar
                src={
                  provider.avatar?.url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=ff9000&color=312e38`
                }
                alt={provider.name}
              />
              <ProviderName>{provider.name}</ProviderName>
            </ProviderCard>
          ))}
        </ProvidersGrid>
      )}
    </Container>
  );
}
