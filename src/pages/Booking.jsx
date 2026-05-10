import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import styled from 'styled-components';
import api from '../services/api';

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const BackButton = styled.button`
  background: transparent;
  border: none;
  color: #ff9000;
  font-size: 14px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Title = styled.h2`
  font-size: 20px;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: #666360;
  margin-bottom: 32px;
  font-size: 14px;
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  color: #999591;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
`;

const DaysRow = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
`;

const DayButton = styled.button`
  background: ${p => p.$active ? '#ff9000' : '#3e3b47'};
  color: ${p => p.$active ? '#312e38' : '#f4ede8'};
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  min-width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  transition: all 0.2s;

  &:hover { background: ${p => p.$active ? '#e08000' : '#504d5a'}; }

  strong { font-size: 20px; }
`;

const HourSelect = styled.select`
  width: 100%;
  padding: 14px 16px;
  background: #232129;
  border: 2px solid rgba(255,144,0,0.2);
  border-radius: 10px;
  color: #f4ede8;
  font-size: 15px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ff9000' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;

  &:focus { outline: none; border-color: #ff9000; }

  option { background: #232129; }
  option:disabled { color: rgba(244,237,232,0.3); }
`;

const ConfirmButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #ff9000;
  border: none;
  border-radius: 10px;
  color: #312e38;
  font-size: 16px;
  font-weight: bold;
  transition: background 0.2s;

  &:hover { background: #e08000; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SuccessBox = styled.div`
  background: #3e3b47;
  border-radius: 10px;
  padding: 32px;
  text-align: center;
  margin-top: 24px;

  h3 { color: #ff9000; margin-bottom: 8px; }
  p { color: #666360; font-size: 14px; margin-bottom: 24px; }
`;

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

export default function Booking() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [selectedHour, setSelectedHour] = useState(null);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i));

  useEffect(() => {
    api.get('/providers').then(res => {
      setProvider(res.data.find(p => p.id === Number(providerId)));
    });
  }, [providerId]);

  useEffect(() => {
    setSelectedHour(null);
    api.get(`/providers/${providerId}/available`, {
      params: { date: selectedDate.getTime() },
    }).then(res => setAvailable(res.data));
  }, [providerId, selectedDate]);

  async function handleConfirm() {
    setLoading(true);
    try {
      const date = new Date(selectedDate);
      date.setHours(selectedHour, 0, 0, 0);
      await api.post('/appointments', {
        provider_id: Number(providerId),
        date: date.toISOString(),
      });
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al agendar.');
    } finally {
      setLoading(false);
    }
  }

  function isAvailable(hour) {
    const slot = available.find(a => a.time === `${String(hour).padStart(2, '0')}:00`);
    return slot?.available ?? false;
  }

  if (success) {
    return (
      <Container>
        <SuccessBox>
          <h3>¡Cita confirmada!</h3>
          <p>
            {provider?.name} — {format(selectedDate, "dd 'de' MMMM", { locale: es })} a las {String(selectedHour).padStart(2, '0')}:00h
          </p>
          <ConfirmButton onClick={() => navigate('/dashboard')}>
            Volver al inicio
          </ConfirmButton>
        </SuccessBox>
      </Container>
    );
  }

  return (
    <Container>
      <BackButton onClick={() => navigate('/dashboard')}>← Volver</BackButton>
      <Title>Agendar cita</Title>
      <Subtitle>{provider?.name}</Subtitle>

      <Section>
        <SectionTitle>Elige el día</SectionTitle>
        <DaysRow>
          {days.map(day => (
            <DayButton
              key={day.toISOString()}
              $active={day.toDateString() === selectedDate.toDateString()}
              onClick={() => setSelectedDate(day)}
            >
              <span>{format(day, 'EEE', { locale: es })}</span>
              <strong>{format(day, 'd')}</strong>
              <span>{format(day, 'MMM', { locale: es })}</span>
            </DayButton>
          ))}
        </DaysRow>
      </Section>

      <Section>
        <SectionTitle>Elige el horario</SectionTitle>
        <HourSelect
          value={selectedHour ?? ''}
          onChange={e => setSelectedHour(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="" disabled>-- Selecciona un horario --</option>
          {HOURS.map(hour => (
            <option key={hour} value={hour} disabled={!isAvailable(hour)}>
              {String(hour).padStart(2, '0')}:00h{!isAvailable(hour) ? ' — No disponible' : ''}
            </option>
          ))}
        </HourSelect>
      </Section>

      <ConfirmButton
        disabled={!selectedHour || loading}
        onClick={handleConfirm}
      >
        {loading ? 'Confirmando...' : 'Confirmar cita'}
      </ConfirmButton>
    </Container>
  );
}
