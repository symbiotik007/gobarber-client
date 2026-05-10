import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { colors } from '../styles/colors';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import {
  FiCalendar, FiClock, FiScissors, FiUser, FiCheck,
  FiAlertCircle, FiChevronRight, FiRefreshCw,
} from 'react-icons/fi';
import api from '../services/api';
import track, { EVENTS } from '../services/analytics';

/* ─── Global ─────────────────────────────────────────────────────── */
const Global = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${colors.bgPage}; color: ${colors.textPrimary}; font-family: 'Segoe UI', sans-serif; }
`;

const fadeIn = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;
const spin = keyframes`from{transform:rotate(0deg)}to{transform:rotate(360deg)}`;

/* ─── Layout ──────────────────────────────────────────────────────── */
const Page = styled.div`
  min-height: 100vh;
  background: ${colors.bgPage};
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
  justify-content: space-between;
  padding: 20px 24px 0;
`;

const Logo = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: ${colors.primary};
  letter-spacing: 1px;
`;

const HomeLink = styled(Link)`
  font-size: 13px;
  color: ${colors.textMuted};
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  &:hover { color: ${colors.primary}; }
`;

const Card = styled.div`
  width: 100%;
  max-width: 640px;
  padding: 32px 24px;
  animation: ${fadeIn} 0.3s ease;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 6px;
`;

const PageSub = styled.p`
  font-size: 14px;
  color: ${colors.textMuted};
  margin-bottom: 24px;
  line-height: 1.5;
`;

/* ─── Current booking summary ─────────────────────────────────────── */
const SummaryBox = styled.div`
  background: ${colors.bgSurface};
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SummaryRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const SummaryIcon = styled.div`color: ${colors.primary}; flex-shrink: 0; margin-top: 2px;`;
const SummaryLabel = styled.div`font-size: 11px; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 1px;`;
const SummaryValue = styled.div`font-size: 14px; color: ${colors.textPrimary}; font-weight: 500;`;

/* ─── Section label ────────────────────────────────────────────────── */
const Label = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.textSubtle};
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 20px 0 10px;
`;

/* ─── Days row ─────────────────────────────────────────────────────── */
const DaysRow = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const DayBtn = styled.button`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 2px solid ${p => p.$active ? colors.primary : colors.border};
  background: ${p => p.$active ? 'rgba(79,142,247,0.12)' : colors.bgSurface};
  color: ${p => p.$active ? colors.primary : colors.textPrimary};
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
  span:last-child { text-transform: capitalize; }
  strong { font-size: 16px; }
`;

/* ─── Hours grid ───────────────────────────────────────────────────── */
const HoursGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 4px;
`;

const HourBtn = styled.button`
  padding: 12px 0;
  border-radius: 10px;
  border: 2px solid ${p => p.$active ? colors.primary : p.$disabled ? colors.bgSurface : colors.border};
  background: ${p => p.$active ? 'rgba(79,142,247,0.12)' : p.$disabled ? colors.bgPage : colors.bgSurface};
  color: ${p => p.$active ? colors.primary : p.$disabled ? colors.textDisabled : colors.textPrimary};
  font-size: 14px;
  font-weight: 600;
  cursor: ${p => p.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  text-decoration: ${p => p.$disabled ? 'line-through' : 'none'};
  &:hover:not(:disabled) {
    border-color: ${p => p.$active ? colors.primary : colors.primary};
  }
`;

/* ─── Confirm step ─────────────────────────────────────────────────── */
const ConfirmBox = styled.div`
  background: ${colors.bgSurface};
  border: 1px solid rgba(79,142,247,0.2);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 20px;
`;

const ConfirmTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 14px;
`;

const ConfirmRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  font-size: 13px;
  &:last-child { border-bottom: none; }
`;

const Warning = styled.div`
  background: rgba(244,67,54,0.08);
  border: 1px solid rgba(244,67,54,0.25);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
  color: ${colors.errorMaterial};
  margin-bottom: 20px;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  line-height: 1.5;
`;

/* ─── Buttons ──────────────────────────────────────────────────────── */
const PrimaryBtn = styled.button`
  width: 100%;
  padding: 15px;
  background: ${colors.primary};
  color: ${colors.bgPage};
  font-size: 15px;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s;
  &:hover:not(:disabled) { background: ${colors.primaryDark}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const GhostBtn = styled.button`
  width: 100%;
  padding: 13px;
  background: transparent;
  border: 1px solid rgba(0,0,0,0.1);
  color: ${colors.textMuted};
  font-size: 14px;
  border-radius: 12px;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.2s;
  &:hover { color: ${colors.textPrimary}; border-color: rgba(0,0,0,0.15); }
`;

/* ─── Success screen ───────────────────────────────────────────────── */
const SuccessWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 0;
  animation: ${fadeIn} 0.4s ease;
`;

const SuccessCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(76,175,80,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

const SuccessTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 8px;
`;

const SuccessText = styled.p`
  font-size: 14px;
  color: ${colors.textMuted};
  margin-bottom: 28px;
  line-height: 1.6;
`;

const StatusLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: ${colors.primary};
  color: ${colors.bgPage};
  font-size: 15px;
  font-weight: 700;
  border-radius: 12px;
  text-decoration: none;
  &:hover { background: ${colors.primaryDark}; }
`;

/* ─── Spinner / Error ─────────────────────────────────────────────── */
const Spinner = styled.div`
  width: ${p => p.$sm ? '16px' : '36px'};
  height: ${p => p.$sm ? '16px' : '36px'};
  border: ${p => p.$sm ? '2px' : '3px'} solid rgba(79,142,247,0.2);
  border-top-color: ${colors.primary};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  ${p => !p.$sm && 'margin: 80px auto;'}
`;

const ErrorMsg = styled.div`
  text-align: center;
  padding: 60px 24px;
  color: ${colors.errorMaterial};
  font-size: 15px;
`;

/* ─── Constants ───────────────────────────────────────────────────── */
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

/* ─── Component ───────────────────────────────────────────────────── */
export default function ReschedulePage() {
  const { token } = useParams();

  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [tokenError, setTokenError] = useState(null);

  // Selector state
  const [selectedDate, setSelectedDate] = useState(startOfDay(addDays(new Date(), 1)));
  const [selectedHour, setSelectedHour] = useState(null);
  const [occupied, setOccupied] = useState(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Flow state
  const [step, setStep] = useState('select'); // select | confirm | success
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [newBooking, setNewBooking] = useState(null);

  const days = Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i + 1));

  // Load booking from token
  useEffect(() => {
    api.get(`/reschedule/${token}`)
      .then(r => {
        setBooking(r.data);
        track(EVENTS.RESCHEDULE_STARTED, { reference: r.data.reference });
      })
      .catch(() => setTokenError('El enlace de reagendamiento es inválido o ya expiró.'))
      .finally(() => setLoadingBooking(false));
  }, [token]);

  // Load availability when date changes
  useEffect(() => {
    if (!booking) return;
    setLoadingSlots(true);
    setSelectedHour(null);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    api.get(`/bookings/availability/${booking.barber.id}`, { params: { date: dateStr } })
      .then(r => setOccupied(new Set(r.data.occupied.map(d => new Date(d).getHours()))))
      .catch(() => setOccupied(new Set()))
      .finally(() => setLoadingSlots(false));
  }, [booking, selectedDate]);

  function buildNewDate() {
    const d = new Date(selectedDate);
    d.setHours(selectedHour, 0, 0, 0);
    return d;
  }

  async function handleConfirm() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const newDate = buildNewDate();
      const { data } = await api.patch(`/reschedule/${token}`, {
        new_date: newDate.toISOString(),
      });
      track(EVENTS.RESCHEDULE_CONFIRMED, { reference: data.reference, newDate: data.new_date });
      setNewBooking(data);
      setStep('success');
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo reagendar. Intenta con otro horario.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading / error screens ──
  if (loadingBooking) return (
    <>
      <Global />
      <Page><Spinner /></Page>
    </>
  );

  if (tokenError) return (
    <>
      <Global />
      <Page>
        <TopBar>
          <Logo>TROYA</Logo>
          <HomeLink to="/"><FiChevronRight size={14} />Inicio</HomeLink>
        </TopBar>
        <ErrorMsg>
          <FiAlertCircle size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
          {tokenError}
          <br /><br />
          <HomeLink to="/book" style={{ justifyContent: 'center' }}>Hacer nueva reserva</HomeLink>
        </ErrorMsg>
      </Page>
    </>
  );

  // ── Success screen ──
  if (step === 'success') {
    const nd = newBooking?.new_date ? parseISO(newBooking.new_date) : null;
    return (
      <>
        <Global />
        <Page>
          <TopBar>
            <Logo>TROYA</Logo>
          </TopBar>
          <Card>
            <SuccessWrap>
              <SuccessCircle>
                <FiCheck size={36} color={colors.success} />
              </SuccessCircle>
              <SuccessTitle>¡Reagendado!</SuccessTitle>
              <SuccessText>
                Tu cita fue movida exitosamente
                {nd && (
                  <> al <strong style={{ color: colors.primary }}>
                    {format(nd, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                  </strong></>
                )}.
                <br />Recibirás la misma notificación al email registrado.
              </SuccessText>
              <StatusLink to={`/booking/status/${newBooking?.reference}`}>
                Ver estado de la reserva <FiChevronRight size={16} />
              </StatusLink>
            </SuccessWrap>
          </Card>
        </Page>
      </>
    );
  }

  const currentDate = booking?.date ? parseISO(booking.date) : null;

  // ── Confirm step ──
  if (step === 'confirm') {
    const nd = buildNewDate();
    return (
      <>
        <Global />
        <Page>
          <TopBar>
            <Logo>TROYA</Logo>
            <HomeLink to="/"><FiChevronRight size={14} />Inicio</HomeLink>
          </TopBar>
          <Card>
            <PageTitle>Confirmar reagendamiento</PageTitle>
            <PageSub>Verifica el cambio antes de confirmar.</PageSub>

            <ConfirmBox>
              <ConfirmTitle>Resumen del cambio</ConfirmTitle>
              <ConfirmRow>
                <span style={{ color: colors.textMuted }}>Fecha actual</span>
                <span style={{ textDecoration: 'line-through', color: colors.textPlaceholder }}>
                  {currentDate
                    ? format(currentDate, "d MMM yyyy, HH:mm", { locale: es })
                    : '—'}
                </span>
              </ConfirmRow>
              <ConfirmRow>
                <span style={{ color: colors.textMuted }}>Nueva fecha</span>
                <span style={{ color: colors.primary, fontWeight: 700 }}>
                  {format(nd, "d MMM yyyy, HH:mm", { locale: es })}
                </span>
              </ConfirmRow>
              <ConfirmRow>
                <span style={{ color: colors.textMuted }}>Servicio</span>
                <span>{booking.service?.name}</span>
              </ConfirmRow>
              <ConfirmRow>
                <span style={{ color: colors.textMuted }}>Barbero</span>
                <span>{booking.barber?.name}</span>
              </ConfirmRow>
            </ConfirmBox>

            <Warning>
              <FiAlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                El anticipo pagado <strong>no es reembolsable</strong>. Este reagendamiento
                no afecta el monto ya pagado. Solo puedes reagendar una vez por reserva.
              </span>
            </Warning>

            {submitError && (
              <Warning style={{ marginBottom: 16 }}>
                <FiAlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                {submitError}
              </Warning>
            )}

            <PrimaryBtn onClick={handleConfirm} disabled={submitting}>
              {submitting
                ? <><Spinner $sm /> Reagendando...</>
                : <><FiCheck size={16} /> Confirmar reagendamiento</>
              }
            </PrimaryBtn>
            <GhostBtn onClick={() => setStep('select')} disabled={submitting}>
              Volver a elegir horario
            </GhostBtn>
          </Card>
        </Page>
      </>
    );
  }

  // ── Select step (default) ──
  const tokenExpiry = booking?.token_expires_at ? parseISO(booking.token_expires_at) : null;

  return (
    <>
      <Global />
      <Page>
        <TopBar>
          <Logo>TROYA</Logo>
          <HomeLink to="/"><FiChevronRight size={14} />Inicio</HomeLink>
        </TopBar>

        <Card>
          <PageTitle>Reagendar cita</PageTitle>
          <PageSub>
            Selecciona el nuevo día y hora para tu cita.
            {tokenExpiry && (
              <> Este enlace expira el{' '}
                <strong style={{ color: colors.primary }}>
                  {format(tokenExpiry, "d MMM 'a las' HH:mm", { locale: es })}
                </strong>.
              </>
            )}
          </PageSub>

          {/* Current booking summary */}
          <SummaryBox>
            <SummaryRow>
              <SummaryIcon><FiCalendar size={15} /></SummaryIcon>
              <div>
                <SummaryLabel>Fecha actual</SummaryLabel>
                <SummaryValue style={{ textTransform: 'capitalize' }}>
                  {currentDate
                    ? format(currentDate, "EEEE d 'de' MMMM, HH:mm'h'", { locale: es })
                    : '—'}
                </SummaryValue>
              </div>
            </SummaryRow>
            <SummaryRow>
              <SummaryIcon><FiScissors size={15} /></SummaryIcon>
              <div>
                <SummaryLabel>Servicio</SummaryLabel>
                <SummaryValue>{booking.service?.name}</SummaryValue>
              </div>
            </SummaryRow>
            <SummaryRow>
              <SummaryIcon><FiUser size={15} /></SummaryIcon>
              <div>
                <SummaryLabel>Barbero</SummaryLabel>
                <SummaryValue>{booking.barber?.name}</SummaryValue>
              </div>
            </SummaryRow>
          </SummaryBox>

          <Warning>
            <FiAlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              El anticipo pagado <strong>no es reembolsable</strong>. Solo puedes reagendar
              una vez. Asegúrate de elegir la fecha definitiva.
            </span>
          </Warning>

          {/* Date selector */}
          <Label><FiCalendar size={14} /> Nueva fecha</Label>
          <DaysRow>
            {days.map(day => (
              <DayBtn
                key={day.toISOString()}
                $active={day.toDateString() === selectedDate.toDateString()}
                onClick={() => { track(EVENTS.RESCHEDULE_SLOT_SELECTED, { date: format(day, 'yyyy-MM-dd') }); setSelectedDate(day); setSelectedHour(null); }}
              >
                <span>{format(day, 'EEE', { locale: es })}</span>
                <strong>{format(day, 'd')}</strong>
                <span>{format(day, 'MMM', { locale: es })}</span>
              </DayBtn>
            ))}
          </DaysRow>

          {/* Hour selector */}
          <Label><FiClock size={14} /> Nueva hora</Label>
          {loadingSlots
            ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                <Spinner />
              </div>
            )
            : (
              <HoursGrid>
                {HOURS.map(h => (
                  <HourBtn
                    key={h}
                    $active={selectedHour === h}
                    $disabled={occupied.has(h)}
                    disabled={occupied.has(h)}
                    onClick={() => setSelectedHour(h)}
                  >
                    {String(h).padStart(2, '0')}:00
                  </HourBtn>
                ))}
              </HoursGrid>
            )
          }

          <div style={{ marginTop: 24 }}>
            <PrimaryBtn
              onClick={() => setStep('confirm')}
              disabled={!selectedHour || loadingSlots}
            >
              <FiRefreshCw size={16} />
              Continuar
            </PrimaryBtn>
          </div>
        </Card>
      </Page>
    </>
  );
}
