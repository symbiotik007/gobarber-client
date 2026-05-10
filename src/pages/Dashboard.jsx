import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiScissors, FiCalendar, FiClock, FiCheck, FiAlertCircle, FiX, FiChevronRight } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/* ─── Styles ─────────────────────────────────────────────── */
const shimmer = keyframes`
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

const Page = styled.div`
  min-height: 100vh;
  background: #1a1720;
  color: #f4ede8;
  font-family: 'Segoe UI', sans-serif;
`;

const TopBar = styled.header`
  width: 100%;
  background: #232129;
  border-bottom: 1px solid #2d2b35;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #ff9000;
  letter-spacing: 1px;
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  span { font-size: 13px; color: #999591; }
`;

const SignOutBtn = styled.button`
  background: none;
  border: 1px solid #3e3b47;
  color: #999591;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: #ff9000; color: #ff9000; }
`;

const Container = styled.div`
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 20px 80px;
  @media (max-width: 640px) { padding: 24px 16px 80px; }
`;

const NewBookingBtn = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #ff9000, #e08000);
  border: none;
  border-radius: 14px;
  color: #1a1720;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 40px;
  transition: all 0.2s;
  &:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(255,144,0,0.3); }
`;

const Section = styled.div`
  margin-bottom: 36px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #f4ede8;
`;

const Badge = styled.span`
  background: ${p => p.$color || '#2d2b35'};
  color: ${p => p.$text || '#999591'};
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
`;

const Dot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${p => p.$color};
  flex-shrink: 0;
`;

const BookingCard = styled.div`
  background: #232129;
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: ${p => p.$clickable ? 'pointer' : 'default'};
  transition: all 0.2s;
  border: 1px solid transparent;
  &:hover { border-color: ${p => p.$clickable ? 'rgba(255,144,0,0.3)' : 'transparent'}; }
`;

const BookingIcon = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: ${p => p.$bg};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const BookingInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const BookingService = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #f4ede8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BookingMeta = styled.div`
  font-size: 13px;
  color: #666360;
  margin-top: 3px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  svg { flex-shrink: 0; }
`;

const StatusChip = styled.span`
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  flex-shrink: 0;
  background: ${p => p.$bg};
  color: ${p => p.$color};
`;

const Empty = styled.div`
  text-align: center;
  padding: 28px;
  color: #4a4757;
  font-size: 14px;
  background: #1e1c26;
  border-radius: 14px;
`;

const SkeletonCard = styled.div`
  background: linear-gradient(90deg, #232129 25%, #2a2730 50%, #232129 75%);
  background-size: 800px 100%;
  animation: ${shimmer} 1.4s ease infinite;
  border-radius: 14px;
  height: 80px;
  margin-bottom: 10px;
`;

/* ─── Helpers ─────────────────────────────────────────────── */
const STATUS_META = {
  PENDING_PAYMENT: { label: 'Pendiente de pago', bg: 'rgba(255,144,0,0.12)', color: '#ff9000', dot: '#ff9000', icon: FiClock, iconBg: 'rgba(255,144,0,0.12)' },
  CONFIRMED:       { label: 'Confirmada',        bg: 'rgba(76,175,80,0.12)',  color: '#4caf50', dot: '#4caf50', icon: FiCheck, iconBg: 'rgba(76,175,80,0.12)' },
  COMPLETED:       { label: 'Completada',        bg: 'rgba(99,102,241,0.12)', color: '#818cf8', dot: '#818cf8', icon: FiCheck, iconBg: 'rgba(99,102,241,0.12)' },
  CANCELLED:       { label: 'Cancelada',         bg: 'rgba(224,85,85,0.12)', color: '#e05555', dot: '#e05555', icon: FiX,    iconBg: 'rgba(224,85,85,0.12)' },
  EXPIRED:         { label: 'Expirada',          bg: '#2d2b35',              color: '#666360', dot: '#666360', icon: FiAlertCircle, iconBg: '#2d2b35' },
  NO_SHOW:         { label: 'No asistió',        bg: 'rgba(224,85,85,0.12)', color: '#e05555', dot: '#e05555', icon: FiX,    iconBg: 'rgba(224,85,85,0.12)' },
};

function fmt(n) {
  return `$${Number(n).toLocaleString('es-CO')}`;
}

function BookingItem({ booking, clickable = true }) {
  const navigate = useNavigate();
  const meta = STATUS_META[booking.status] || STATUS_META.EXPIRED;
  const Icon = meta.icon;
  const bookingDate = new Date(booking.date);

  return (
    <BookingCard
      $clickable={clickable}
      onClick={clickable ? () => navigate(`/booking/status/${booking.reference}`) : undefined}
    >
      <BookingIcon $bg={meta.iconBg}>
        <Icon size={18} color={meta.color} />
      </BookingIcon>
      <BookingInfo>
        <BookingService>{booking.service?.name || '—'}</BookingService>
        <BookingMeta>
          <MetaItem><FiScissors size={11} />{booking.barber?.name || '—'}</MetaItem>
          <MetaItem><FiCalendar size={11} />{format(bookingDate, "d 'de' MMM yyyy", { locale: es })}</MetaItem>
          <MetaItem><FiClock size={11} />{format(bookingDate, 'HH:mm')}h</MetaItem>
        </BookingMeta>
      </BookingInfo>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <StatusChip $bg={meta.bg} $color={meta.color}>{meta.label}</StatusChip>
        <span style={{ fontSize: 13, color: '#999591' }}>{fmt(booking.deposit_amount)}</span>
      </div>
      {clickable && <FiChevronRight size={16} color="#3e3b47" style={{ flexShrink: 0 }} />}
    </BookingCard>
  );
}

/* ─── Main ────────────────────────────────────────────────── */
export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/my-bookings')
      .then(r => setBookings(r.data))
      .finally(() => setLoading(false));
  }, []);

  const pending   = bookings.filter(b => b.status === 'PENDING_PAYMENT');
  const confirmed = bookings.filter(b => b.status === 'CONFIRMED');
  const past      = bookings.filter(b => ['COMPLETED', 'CANCELLED', 'EXPIRED', 'NO_SHOW'].includes(b.status));

  return (
    <Page>
      <TopBar>
        <Logo>TROYA</Logo>
        <UserRow>
          <span>Hola, {user?.name?.split(' ')[0]}</span>
          <SignOutBtn onClick={signOut}>Salir</SignOutBtn>
        </UserRow>
      </TopBar>

      <Container>
        <NewBookingBtn onClick={() => navigate('/book')}>
          <FiScissors size={18} /> Nueva reserva
        </NewBookingBtn>

        {/* Pendientes de pago */}
        <Section>
          <SectionHeader>
            <Dot $color="#ff9000" />
            <SectionTitle>Reservas pendientes</SectionTitle>
            {pending.length > 0 && <Badge $color="rgba(255,144,0,0.15)" $text="#ff9000">{pending.length}</Badge>}
          </SectionHeader>
          {loading
            ? <><SkeletonCard /><SkeletonCard /></>
            : pending.length === 0
              ? <Empty>No tienes reservas pendientes de pago.</Empty>
              : pending.map(b => <BookingItem key={b.id} booking={b} />)
          }
        </Section>

        {/* Confirmadas */}
        <Section>
          <SectionHeader>
            <Dot $color="#4caf50" />
            <SectionTitle>Reservas confirmadas</SectionTitle>
            {confirmed.length > 0 && <Badge $color="rgba(76,175,80,0.15)" $text="#4caf50">{confirmed.length}</Badge>}
          </SectionHeader>
          {loading
            ? <><SkeletonCard /><SkeletonCard /></>
            : confirmed.length === 0
              ? <Empty>No tienes reservas confirmadas por el momento.</Empty>
              : confirmed.map(b => <BookingItem key={b.id} booking={b} />)
          }
        </Section>

        {/* Anteriores */}
        <Section>
          <SectionHeader>
            <Dot $color="#4a4757" />
            <SectionTitle>Reservas anteriores</SectionTitle>
            {past.length > 0 && <Badge>{past.length}</Badge>}
          </SectionHeader>
          {loading
            ? <SkeletonCard />
            : past.length === 0
              ? <Empty>Aquí aparecerán tus visitas pasadas.</Empty>
              : past.map(b => <BookingItem key={b.id} booking={b} />)
          }
        </Section>
      </Container>
    </Page>
  );
}
