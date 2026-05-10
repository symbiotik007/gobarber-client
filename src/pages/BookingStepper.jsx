import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, addDays, startOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowLeft, FiCheck, FiCopy, FiClock, FiUser, FiMail, FiPhone, FiCalendar, FiScissors, FiAlertCircle, FiShare2 } from 'react-icons/fi';
import api from '../services/api';
import track, { EVENTS } from '../services/analytics';
import { haptic, shareBooking } from '../services/mobile';

/* ─── Global ─────────────────────────────────────────────── */
const Global = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #1a1720; color: #f4ede8; font-family: 'Segoe UI', sans-serif; }
`;

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const STEPS = ['Servicio', 'Horario', 'Tus datos', 'Pago', 'Confirmación'];

/* ─── Animations ─────────────────────────────────────────── */
const fadeIn = keyframes`from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); }`;
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const pulse = keyframes`0%,100% { opacity: 1; } 50% { opacity: 0.4; }`;

/* ─── Layout ─────────────────────────────────────────────── */
const Page = styled.div`
  min-height: 100vh;
  background: #1a1720;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0 80px;
`;

const TopBar = styled.div`
  width: 100%;
  max-width: 640px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px 0;
  @media (max-width: 640px) { padding: 16px 16px 0; }
`;

const BackBtn = styled.button`
  background: none;
  border: none;
  color: #999591;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  padding: 8px;
  border-radius: 8px;
  transition: color 0.2s;
  &:hover { color: #ff9000; }
`;

const Logo = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #ff9000;
  letter-spacing: 1px;
  flex: 1;
  text-align: center;
`;

/* ─── Progress bar ───────────────────────────────────────── */
const ProgressWrap = styled.div`
  width: 100%;
  max-width: 640px;
  padding: 24px 24px 0;
  @media (max-width: 640px) { padding: 20px 16px 0; }
`;

const ProgressTrack = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
`;

const StepDot = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.3s;
  background: ${p => p.$done ? '#ff9000' : p.$active ? '#ff9000' : '#2d2b35'};
  color: ${p => (p.$done || p.$active) ? '#1a1720' : '#666360'};
  border: 2px solid ${p => p.$done ? '#ff9000' : p.$active ? '#ff9000' : '#3e3b47'};
`;

const StepLine = styled.div`
  flex: 1;
  height: 2px;
  background: ${p => p.$done ? '#ff9000' : '#2d2b35'};
  transition: background 0.3s;
`;

const StepLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
`;

const StepLabel = styled.span`
  font-size: 10px;
  color: ${p => p.$active ? '#ff9000' : p.$done ? '#999591' : '#4a4757'};
  font-weight: ${p => p.$active ? '600' : '400'};
  text-align: center;
  width: 64px;
  margin-left: -16px;
  &:first-child { margin-left: 0; }
`;

/* ─── Card ───────────────────────────────────────────────── */
const Card = styled.div`
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 32px 24px;
  animation: ${fadeIn} 0.3s ease;
  @media (max-width: 640px) { padding: 24px 16px; }
`;

const StepTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 6px;
`;

const StepSub = styled.p`
  font-size: 14px;
  color: #666360;
  margin-bottom: 28px;
  line-height: 1.5;
`;

/* ─── Services ───────────────────────────────────────────── */
const ServiceGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ServiceCard = styled.button`
  background: ${p => p.$active ? 'rgba(255,144,0,0.12)' : '#232129'};
  border: 2px solid ${p => p.$active ? '#ff9000' : 'transparent'};
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  &:hover { border-color: rgba(255,144,0,0.4); background: #2a2730; }
`;

const ServiceInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ServiceName = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #f4ede8;
`;

const ServiceMeta = styled.span`
  font-size: 13px;
  color: #666360;
`;

const ServicePrice = styled.div`
  text-align: right;
`;

const PriceTotal = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #ff9000;
`;

const PriceDeposit = styled.div`
  font-size: 12px;
  color: #666360;
  margin-top: 2px;
`;

/* ─── Skeleton ───────────────────────────────────────────── */
const shimmer = keyframes`
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

const Skeleton = styled.div`
  background: linear-gradient(90deg, #2a2730 25%, #332f3c 50%, #2a2730 75%);
  background-size: 800px 100%;
  animation: ${shimmer} 1.4s ease infinite;
  border-radius: 14px;
  height: ${p => p.$h || '72px'};
  width: ${p => p.$w || '100%'};
  margin-bottom: 12px;
`;

/* ─── Barbers ─────────────────────────────────────────────── */
const BarberGrid = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 28px;
`;

const BarberBtn = styled.button`
  background: ${p => p.$active ? 'rgba(255,144,0,0.15)' : '#232129'};
  border: 2px solid ${p => p.$active ? '#ff9000' : 'transparent'};
  border-radius: 12px;
  padding: 12px 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
  color: #f4ede8;
  font-size: 14px;
  font-weight: ${p => p.$active ? '600' : '400'};
  &:hover { border-color: rgba(255,144,0,0.4); }
`;

const BarberAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ff9000;
  color: #1a1720;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

/* ─── Days ───────────────────────────────────────────────── */
const DaysRow = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 24px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const DayBtn = styled.button`
  background: ${p => p.$active ? '#ff9000' : '#232129'};
  color: ${p => p.$active ? '#1a1720' : '#f4ede8'};
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  min-width: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  &:hover { background: ${p => p.$active ? '#e08000' : '#2d2b35'}; }
  strong { font-size: 22px; font-weight: 700; }
  span { font-size: 11px; text-transform: capitalize; }
`;

/* ─── Hours ──────────────────────────────────────────────── */
const HoursGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  @media (max-width: 400px) { grid-template-columns: repeat(3, 1fr); }
`;

const HourBtn = styled.button`
  background: ${p => p.$active ? '#ff9000' : p.$disabled ? '#1e1c26' : '#232129'};
  color: ${p => p.$active ? '#1a1720' : p.$disabled ? '#3e3b47' : '#f4ede8'};
  border: 2px solid ${p => p.$active ? '#ff9000' : 'transparent'};
  border-radius: 10px;
  padding: 12px 8px;
  font-size: 14px;
  font-weight: ${p => p.$active ? '700' : '400'};
  cursor: ${p => p.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  &:hover:not(:disabled) { border-color: rgba(255,144,0,0.4); }
`;

/* ─── Form ───────────────────────────────────────────────── */
const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #999591;
  margin-bottom: 8px;
  font-weight: 500;
  svg { color: #ff9000; }
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  background: #232129;
  border: 2px solid ${p => p.$error ? '#e05555' : 'rgba(255,144,0,0.15)'};
  border-radius: 10px;
  color: #f4ede8;
  font-size: 15px;
  transition: border-color 0.2s;
  &:focus { outline: none; border-color: #ff9000; }
  &::placeholder { color: #4a4757; }
`;

const FieldError = styled.span`
  font-size: 12px;
  color: #e05555;
  margin-top: 4px;
  display: block;
`;

/* ─── Summary box ────────────────────────────────────────── */
const SummaryBox = styled.div`
  background: #232129;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: ${p => p.$highlight ? '#ff9000' : '#f4ede8'};
  font-weight: ${p => p.$highlight ? '700' : '400'};
  span:first-child { color: #666360; }
`;

/* ─── Payment box ────────────────────────────────────────── */
const PaymentBox = styled.div`
  background: linear-gradient(135deg, #1e1b28, #252230);
  border: 1px solid rgba(255,144,0,0.25);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
`;

const PaymentTitle = styled.div`
  font-size: 13px;
  color: #999591;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
`;

const PaymentRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  &:last-child { margin-bottom: 0; }
`;

const PaymentLabel = styled.span`color: #666360;`;

const PaymentValue = styled.span`
  color: #f4ede8;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AmountBig = styled.div`
  font-size: 36px;
  font-weight: 700;
  color: #ff9000;
  margin: 16px 0 4px;
`;

const CopyBtn = styled.button`
  background: none;
  border: 1px solid rgba(255,144,0,0.3);
  border-radius: 6px;
  color: #ff9000;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  &:hover { background: rgba(255,144,0,0.1); }
`;

const CountdownWrap = styled.div`
  background: rgba(255,144,0,0.08);
  border: 1px solid rgba(255,144,0,0.2);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const CountdownTime = styled.span`
  font-size: 22px;
  font-weight: 700;
  color: ${p => p.$urgent ? '#e05555' : '#ff9000'};
  font-variant-numeric: tabular-nums;
  animation: ${p => p.$urgent ? pulse : 'none'} 1s ease infinite;
`;

const AlertBox = styled.div`
  background: rgba(224,85,85,0.1);
  border: 1px solid rgba(224,85,85,0.3);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 20px;
  font-size: 13px;
  color: #e05555;
  line-height: 1.5;
  svg { flex-shrink: 0; margin-top: 2px; }
`;

/* ─── Confirmation ───────────────────────────────────────── */
const ConfirmWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 12px 0;
`;

const StatusIcon = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: ${p => p.$confirmed ? 'rgba(76,175,80,0.15)' : 'rgba(255,144,0,0.1)'};
  border: 2px solid ${p => p.$confirmed ? '#4caf50' : '#ff9000'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  font-size: 28px;
`;

const Spinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255,144,0,0.2);
  border-top-color: #ff9000;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const StatusTitle = styled.h3`
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
  color: ${p => p.$confirmed ? '#4caf50' : '#f4ede8'};
`;

const StatusText = styled.p`
  font-size: 14px;
  color: #666360;
  line-height: 1.6;
  max-width: 360px;
  margin-bottom: 8px;
`;

const RefCode = styled.div`
  background: #232129;
  border-radius: 10px;
  padding: 12px 20px;
  font-family: monospace;
  font-size: 15px;
  color: #ff9000;
  letter-spacing: 1px;
  margin: 16px 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

/* ─── CTA ────────────────────────────────────────────────── */
const CTABtn = styled.button`
  width: 100%;
  padding: 16px;
  background: ${p => p.$ghost ? 'transparent' : 'linear-gradient(135deg, #ff9000, #e08000)'};
  border: ${p => p.$ghost ? '2px solid rgba(255,144,0,0.3)' : 'none'};
  border-radius: 14px;
  color: ${p => p.$ghost ? '#ff9000' : '#1a1720'};
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
  &:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(255,144,0,0.3); }
  &:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
`;

const StickyFooter = styled.div`
  position: sticky;
  bottom: 0;
  background: linear-gradient(to top, #1a1720 70%, transparent);
  padding: 16px 0 8px;
  margin-top: 8px;
  @media (min-width: 640px) { position: static; background: none; padding: 0; }
`;

const Divider = styled.div`height: 12px;`;

/* ─── Helpers ────────────────────────────────────────────── */
function fmt(n) {
  return `$${Number(n).toLocaleString('es-CO')}`;
}

function useCountdown(seconds) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');
  return { display: `${mins}:${secs}`, expired: remaining <= 0, urgent: remaining < 120 };
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {});
}

/* ═══════════════════════════════════════════════════════════
   STEPS
═══════════════════════════════════════════════════════════ */

/* ─── Step 1: Service ────────────────────────────────────── */
function StepService({ onNext }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/services')
      .then(r => setServices(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <StepTitle>¿Qué servicio necesitas?</StepTitle>
      <StepSub>Elige el servicio para tu próxima visita.</StepSub>
      <ServiceGrid>
        {loading
          ? [1, 2, 3].map(i => <Skeleton key={i} $h="80px" />)
          : services.map(s => (
            <ServiceCard
              key={s.id}
              $active={selected?.id === s.id}
              onClick={() => setSelected(s)}
            >
              <ServiceInfo>
                <ServiceName>{s.name}</ServiceName>
                <ServiceMeta>
                  <FiClock size={11} style={{ marginRight: 4 }} />
                  {s.duration_minutes} min
                </ServiceMeta>
              </ServiceInfo>
              <ServicePrice>
                <PriceTotal>{fmt(s.price)}</PriceTotal>
                <PriceDeposit>Anticipo desde {fmt(s.deposit_range.min)}</PriceDeposit>
              </ServicePrice>
            </ServiceCard>
          ))
        }
      </ServiceGrid>
      <StickyFooter>
        <CTABtn disabled={!selected} onClick={() => onNext(selected)}>
          Continuar
        </CTABtn>
      </StickyFooter>
    </Card>
  );
}

const ANY_BARBER_ID = 0;

/* ─── Step 2: Barber + Date + Hour ───────────────────────── */
function StepSchedule({ preselectedBarberId, onNext, onBack }) {
  const [barbers, setBarbers] = useState([]);
  const [barberId, setBarberId] = useState(preselectedBarberId ? Number(preselectedBarberId) : ANY_BARBER_ID);
  const [selectedDate, setSelectedDate] = useState(startOfDay(addDays(new Date(), 1)));
  const [selectedHour, setSelectedHour] = useState(null);
  const [occupied, setOccupied] = useState(new Set());
  const [availableHours, setAvailableHours] = useState(HOURS);
  const [dayClosed, setDayClosed] = useState(false);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const days = Array.from({ length: 10 }, (_, i) => addDays(startOfDay(new Date()), i + 1));

  useEffect(() => {
    api.get('/providers')
      .then(r => {
        setBarbers(r.data);
        if (preselectedBarberId && barberId === null) setBarberId(Number(preselectedBarberId));
      })
      .finally(() => setLoadingBarbers(false));
  }, []);

  useEffect(() => {
    setLoadingSlots(true);
    setSelectedHour(null);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const id = barberId === ANY_BARBER_ID ? 0 : barberId;
    api.get(`/bookings/availability/${id}`, { params: { date: dateStr } })
      .then(r => {
        setOccupied(new Set(r.data.occupied.map(d => new Date(d).getHours())));
        setAvailableHours(r.data.available_hours && r.data.available_hours.length ? r.data.available_hours : HOURS);
        setDayClosed(!!r.data.closed);
      })
      .catch(() => { setOccupied(new Set()); setAvailableHours(HOURS); setDayClosed(false); })
      .finally(() => setLoadingSlots(false));
  }, [barberId, selectedDate]);

  function isOccupied(hour) {
    return occupied.has(hour);
  }

  function handleNext() {
    if (selectedHour === null) return;
    const date = new Date(selectedDate);
    date.setHours(selectedHour, 0, 0, 0);
    const barberName = barberId === ANY_BARBER_ID
      ? 'Cualquier barbero disponible'
      : (barbers.find(b => b.id === barberId) || {}).name;
    onNext({ barberId, date: date.toISOString(), barberName });
  }

  return (
    <Card>
      <StepTitle>Elige tu horario</StepTitle>
      <StepSub>Selecciona el barbero, día y hora disponible.</StepSub>

      {/* Barbero */}
      <Label><FiScissors /> Barbero</Label>
      <BarberGrid>
        {loadingBarbers
          ? [1, 2, 3].map(i => <Skeleton key={i} $h="60px" $w="140px" style={{ display: 'inline-block' }} />)
          : (
            <>
              <BarberBtn
                $active={barberId === ANY_BARBER_ID}
                onClick={() => { setBarberId(ANY_BARBER_ID); setSelectedHour(null); }}
                style={{ fontStyle: 'italic' }}
              >
                <BarberAvatar>✦</BarberAvatar>
                Sin preferencia
              </BarberBtn>
              {barbers.map(b => (
                <BarberBtn key={b.id} $active={barberId === b.id} onClick={() => { setBarberId(b.id); setSelectedHour(null); }}>
                  <BarberAvatar>
                    {(b.avatar && b.avatar.url)
                      ? <img src={b.avatar.url} alt={b.name} />
                      : b.name[0].toUpperCase()
                    }
                  </BarberAvatar>
                  {b.name}
                </BarberBtn>
              ))}
            </>
          )
        }
      </BarberGrid>

      {/* Fecha */}
      <Label><FiCalendar /> Fecha</Label>
      <DaysRow>
        {days.map(day => (
          <DayBtn
            key={day.toISOString()}
            $active={day.toDateString() === selectedDate.toDateString()}
            onClick={() => { setSelectedDate(day); setSelectedHour(null); }}
          >
            <span>{format(day, 'EEE', { locale: es })}</span>
            <strong>{format(day, 'd')}</strong>
            <span>{format(day, 'MMM', { locale: es })}</span>
          </DayBtn>
        ))}
      </DaysRow>

      {/* Hora */}
      <>
        <Label style={{ marginTop: 8 }}><FiClock /> Hora disponible</Label>
          {loadingSlots
            ? <Skeleton $h="120px" />
            : dayClosed
              ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666360', background: '#232129', borderRadius: 12, fontSize: 14 }}>
                  <FiAlertCircle size={20} style={{ display: 'block', margin: '0 auto 8px', color: '#ff9000' }} />
                  El local está cerrado este día.
                </div>
              )
              : (
                <HoursGrid>
                  {availableHours.map(h => (
                    <HourBtn
                      key={h}
                      $active={selectedHour === h}
                      $disabled={isOccupied(h)}
                      disabled={isOccupied(h)}
                      onClick={() => setSelectedHour(h)}
                    >
                      {String(h).padStart(2, '0')}:00
                    </HourBtn>
                  ))}
                </HoursGrid>
              )
          }
      </>

      <StickyFooter>
        <CTABtn disabled={selectedHour === null || dayClosed} onClick={handleNext}>
          Continuar
        </CTABtn>
        <CTABtn $ghost onClick={onBack} style={{ marginTop: 8 }}>
          Atrás
        </CTABtn>
      </StickyFooter>
    </Card>
  );
}

/* ─── Step 3: Customer data ──────────────────────────────── */
function StepCustomer({ service, schedule, onNext, onBack }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Nombre demasiado corto.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido.';
    if (form.phone.replace(/\D/g, '').length < 7) e.phone = 'Teléfono inválido.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (validate()) onNext(form);
  }

  const bookingDate = new Date(schedule.date);

  return (
    <Card>
      <StepTitle>Tus datos</StepTitle>
      <StepSub>Para enviarte la confirmación y reagendamiento.</StepSub>

      <SummaryBox>
        <SummaryRow>
          <span>Servicio</span>
          <span>{service.name}</span>
        </SummaryRow>
        <SummaryRow>
          <span>Barbero</span>
          <span>{schedule.barberName}</span>
        </SummaryRow>
        <SummaryRow>
          <span>Fecha</span>
          <span>{format(bookingDate, "dd 'de' MMMM", { locale: es })}</span>
        </SummaryRow>
        <SummaryRow>
          <span>Hora</span>
          <span>{format(bookingDate, 'HH:mm')}h</span>
        </SummaryRow>
        <SummaryRow $highlight>
          <span>Anticipo a pagar</span>
          <span>{fmt(service.deposit_range.min)}</span>
        </SummaryRow>
      </SummaryBox>

      <FormGroup>
        <Label><FiUser /> Nombre completo</Label>
        <Input
          placeholder="Ej: Carlos Martínez"
          value={form.name}
          $error={!!errors.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
        {errors.name && <FieldError>{errors.name}</FieldError>}
      </FormGroup>

      <FormGroup>
        <Label><FiMail /> Correo electrónico</Label>
        <Input
          type="email"
          placeholder="correo@ejemplo.com"
          value={form.email}
          $error={!!errors.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        />
        {errors.email && <FieldError>{errors.email}</FieldError>}
      </FormGroup>

      <FormGroup>
        <Label><FiPhone /> Teléfono / WhatsApp</Label>
        <Input
          type="tel"
          placeholder="3001234567"
          value={form.phone}
          $error={!!errors.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        />
        {errors.phone && <FieldError>{errors.phone}</FieldError>}
      </FormGroup>

      <CTABtn onClick={handleNext}>Continuar</CTABtn>
      <CTABtn $ghost onClick={onBack} style={{ marginTop: 8 }}>Atrás</CTABtn>
    </Card>
  );
}

/* ─── Step 4: Payment ────────────────────────────────────── */
function StepPayment({ service, schedule, customer, onBookingCreated, onBack }) {
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState('');
  const createdRef = useRef(false);

  const { display, expired, urgent } = useCountdown(booking ? 10 * 60 : 600);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;

    api.post('/bookings', {
      barber_id: schedule.barberId,
      service_id: service.id,
      date: schedule.date,
      deposit_amount: service.deposit_range.min,
      customer,
    })
      .then(r => {
        setBooking(r.data.booking);
        setPayment(r.data.payment);
      })
      .catch(e => setError(e.response?.data?.error || 'No se pudo crear la reserva.'))
      .finally(() => setLoading(false));
  }, []);

  function handleCopy(text, key) {
    copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  if (loading) {
    return (
      <Card>
        <StepTitle>Preparando tu reserva...</StepTitle>
        <StepSub>Un momento.</StepSub>
        <Skeleton $h="200px" />
        <Skeleton $h="80px" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <ConfirmWrap>
          <StatusIcon><FiAlertCircle size={28} color="#e05555" /></StatusIcon>
          <StatusTitle>Horario no disponible</StatusTitle>
          <StatusText>{error}</StatusText>
          <CTABtn onClick={onBack} style={{ maxWidth: 320 }}>Elegir otro horario</CTABtn>
        </ConfirmWrap>
      </Card>
    );
  }

  const inst = payment?.instructions;

  return (
    <Card>
      <StepTitle>Realiza el pago</StepTitle>
      <StepSub>
        Tu horario está reservado por 10 minutos. Transfiere el anticipo y avísanos.
      </StepSub>

      {expired
        ? (
          <AlertBox>
            <FiAlertCircle size={16} />
            <span>El tiempo expiró. Tu reserva fue liberada. Vuelve a comenzar.</span>
          </AlertBox>
        )
        : (
          <CountdownWrap>
            <FiClock size={20} color={urgent ? '#e05555' : '#ff9000'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#666360', marginBottom: 2 }}>Tiempo para pagar</div>
              <CountdownTime $urgent={urgent}>{display}</CountdownTime>
            </div>
          </CountdownWrap>
        )
      }

      <AlertBox>
        <FiAlertCircle size={16} />
        <span>El anticipo <strong>NO es reembolsable</strong>. Si no asistes, perderás el valor pagado.</span>
      </AlertBox>

      <PaymentBox>
        <PaymentTitle>Instrucciones de pago</PaymentTitle>

        <AmountBig>{fmt(inst?.amount)}</AmountBig>
        <div style={{ fontSize: 13, color: '#666360', marginBottom: 20 }}>COP — anticipo mínimo</div>

        <PaymentRow>
          <PaymentLabel>Llave {inst?.bank}</PaymentLabel>
          <PaymentValue>
            {inst?.llave}
            <CopyBtn onClick={() => handleCopy(inst?.llave, 'llave')}>
              <FiCopy size={10} /> {copied === 'llave' ? '¡Copiado!' : 'Copiar'}
            </CopyBtn>
          </PaymentValue>
        </PaymentRow>

        <PaymentRow>
          <PaymentLabel>A nombre de</PaymentLabel>
          <PaymentValue>{inst?.owner}</PaymentValue>
        </PaymentRow>

        <PaymentRow>
          <PaymentLabel>Referencia (mensaje)</PaymentLabel>
          <PaymentValue>
            {inst?.reference}
            <CopyBtn onClick={() => handleCopy(inst?.reference, 'ref')}>
              <FiCopy size={10} /> {copied === 'ref' ? '¡Copiado!' : 'Copiar'}
            </CopyBtn>
          </PaymentValue>
        </PaymentRow>
      </PaymentBox>

      <div style={{ fontSize: 13, color: '#666360', lineHeight: 1.6, marginBottom: 24 }}>
        Abre tu app de {inst?.bank || 'banco'}, envía exactamente <strong style={{ color: '#ff9000' }}>{fmt(inst?.amount)}</strong> a la llave <strong style={{ color: '#f4ede8' }}>{inst?.llave}</strong> e incluye la referencia <strong style={{ color: '#f4ede8' }}>{inst?.reference}</strong> en el mensaje.
      </div>

      <CTABtn onClick={() => onBookingCreated(booking.reference)} disabled={expired}>
        Ya pagué — ver estado de mi reserva
      </CTABtn>
    </Card>
  );
}

/* ─── Step 5: Status ─────────────────────────────────────── */
function StepStatus({ reference }) {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  const fetch = useCallback(() => {
    api.get(`/bookings/${reference}`)
      .then(r => {
        setBooking(r.data);
        setLoading(false);
        if (r.data.status === 'CONFIRMED') {
          clearInterval(pollRef.current);
        }
      })
      .catch(() => setLoading(false));
  }, [reference]);

  useEffect(() => {
    fetch();
    pollRef.current = setInterval(fetch, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetch]);

  const isConfirmed = booking?.status === 'CONFIRMED';
  const isExpired = booking?.status === 'EXPIRED';
  const isCancelled = booking?.status === 'CANCELLED';

  return (
    <Card>
      <ConfirmWrap>
        <StatusIcon $confirmed={isConfirmed}>
          {loading
            ? <Spinner />
            : isConfirmed
              ? <FiCheck size={28} color="#4caf50" />
              : isExpired || isCancelled
                ? <FiAlertCircle size={28} color="#e05555" />
                : <Spinner />
          }
        </StatusIcon>

        {!loading && (
          <>
            <StatusTitle $confirmed={isConfirmed}>
              {isConfirmed
                ? '¡Reserva confirmada!'
                : isExpired
                  ? 'Reserva expirada'
                  : isCancelled
                    ? 'Reserva cancelada'
                    : 'Esperando confirmación'
              }
            </StatusTitle>

            <StatusText>
              {isConfirmed
                ? 'Tu pago fue recibido. Te esperamos en TROYA BARBER STUDIO.'
                : isExpired
                  ? 'No se recibió el pago a tiempo. El horario fue liberado.'
                  : isCancelled
                    ? 'Esta reserva fue cancelada.'
                    : 'En cuanto el barbero confirme tu pago, esta pantalla se actualizará automáticamente.'
              }
            </StatusText>

            <RefCode>
              {reference}
              <CopyBtn onClick={() => copyToClipboard(reference)}>
                <FiCopy size={10} /> Copiar
              </CopyBtn>
            </RefCode>

            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <a
                href={`/booking/status/${reference}`}
                style={{ fontSize: 12, color: '#666360', textDecoration: 'underline' }}
              >
                Ver página de estado
              </a>
            </div>

            {booking && (
              <SummaryBox style={{ width: '100%', textAlign: 'left' }}>
                <SummaryRow>
                  <span>Servicio</span>
                  <span>{booking.service?.name}</span>
                </SummaryRow>
                <SummaryRow>
                  <span>Barbero</span>
                  <span>{booking.barber?.name}</span>
                </SummaryRow>
                <SummaryRow>
                  <span>Fecha</span>
                  <span>{format(new Date(booking.date), "dd MMM yyyy", { locale: es })}</span>
                </SummaryRow>
                <SummaryRow>
                  <span>Hora</span>
                  <span>{format(new Date(booking.date), 'HH:mm')}h</span>
                </SummaryRow>
                <SummaryRow $highlight>
                  <span>Estado</span>
                  <span>{booking.status}</span>
                </SummaryRow>
              </SummaryBox>
            )}

            {isConfirmed && booking && (
              <CTABtn
                onClick={() => {
                  haptic([20, 30, 20]);
                  shareBooking({
                    reference,
                    date: format(new Date(booking.date), "d 'de' MMM, HH:mm'h'", { locale: es }),
                    service: booking.service?.name || '',
                  });
                }}
                $ghost
                style={{ maxWidth: 320, marginTop: 12 }}
              >
                <FiShare2 size={16} /> Compartir reserva
              </CTABtn>
            )}

            {(isExpired || isCancelled) && (
              <CTABtn onClick={() => navigate('/book')} style={{ maxWidth: 320 }}>
                Nueva reserva
              </CTABtn>
            )}

            {!isConfirmed && !isExpired && !isCancelled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666360', fontSize: 13, marginTop: 8 }}>
                <Spinner style={{ width: 14, height: 14, borderWidth: 2 }} />
                Actualizando cada 5 segundos...
              </div>
            )}
          </>
        )}
      </ConfirmWrap>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function BookingStepper() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedBarberId = searchParams.get('barber');

  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [bookingRef, setBookingRef] = useState(null);

  useEffect(() => {
    if (step === 0) track(EVENTS.BOOKING_STARTED);
    if (step === 3 && service && schedule) track(EVENTS.BOOKING_PAYMENT_SHOWN, {
      serviceId: service.id,
      serviceName: service.name,
      barberId: schedule.barberId,
      date: schedule.date,
    });
  }, [step]);

  function handleBack() {
    setStep(s => Math.max(0, s - 1));
  }

  return (
    <>
      <Global />
      <Page>
        <TopBar>
          <BackBtn onClick={() => step === 0 ? navigate('/') : handleBack()}>
            <FiArrowLeft size={16} />
          </BackBtn>
          <Logo>TROYA</Logo>
          <div style={{ width: 40 }} />
        </TopBar>

        <ProgressWrap>
          <ProgressTrack>
            {STEPS.map((s, i) => (
              <>
                <StepDot key={`dot-${i}`} $active={step === i} $done={step > i}>
                  {step > i ? <FiCheck size={14} /> : i + 1}
                </StepDot>
                {i < STEPS.length - 1 && <StepLine key={`line-${i}`} $done={step > i} />}
              </>
            ))}
          </ProgressTrack>
          <StepLabels>
            {STEPS.map((s, i) => (
              <StepLabel key={i} $active={step === i} $done={step > i}>{s}</StepLabel>
            ))}
          </StepLabels>
        </ProgressWrap>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ width: '100%' }}
          >
            {step === 0 && (
              <StepService
                onNext={s => {
                  haptic([20]);
                  track(EVENTS.BOOKING_SLOT_SELECTED, { serviceId: s.id, serviceName: s.name });
                  setService(s);
                  setStep(1);
                }}
              />
            )}
            {step === 1 && (
              <StepSchedule
                preselectedBarberId={preselectedBarberId}
                onNext={s => {
                  haptic([20]);
                  track(EVENTS.BOOKING_SLOT_SELECTED, { barberId: s.barberId, date: s.date });
                  setSchedule(s);
                  setStep(2);
                }}
                onBack={handleBack}
              />
            )}
            {step === 2 && (
              <StepCustomer
                service={service}
                schedule={schedule}
                onNext={c => {
                  haptic([20]);
                  track(EVENTS.BOOKING_CUSTOMER_FILLED);
                  setCustomer(c);
                  setStep(3);
                }}
                onBack={handleBack}
              />
            )}
            {step === 3 && (
              <StepPayment
                service={service}
                schedule={schedule}
                customer={customer}
                onBookingCreated={ref => {
                  haptic([30, 30, 60]);
                  track(EVENTS.BOOKING_CREATED, { reference: ref });
                  setBookingRef(ref);
                  setStep(4);
                }}
                onBack={() => setStep(1)}
              />
            )}
            {step === 4 && (
              <StepStatus reference={bookingRef} />
            )}
          </motion.div>
        </AnimatePresence>
      </Page>
    </>
  );
}
