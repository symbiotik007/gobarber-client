import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO, differenceInSeconds } from 'date-fns';
import { es } from 'date-fns/locale';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import {
  FiClock, FiCheck, FiX, FiAlertCircle, FiCalendar, FiUser,
  FiScissors, FiRefreshCw, FiChevronRight, FiCopy,
} from 'react-icons/fi';
import api from '../services/api';

/* ─── Global ─────────────────────────────────────────────────────── */
const Global = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #ffffff; color: #1e293b; font-family: 'Segoe UI', sans-serif; }
`;

/* ─── Animations ─────────────────────────────────────────────────── */
const fadeIn = keyframes`from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); }`;
const spin = keyframes`from { transform:rotate(0deg); } to { transform:rotate(360deg); }`;
const pulse = keyframes`0%,100%{opacity:1}50%{opacity:.35}`;

/* ─── Layout ──────────────────────────────────────────────────────── */
const Page = styled.div`
  min-height: 100vh;
  background: #ffffff;
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
  color: #4f8ef7;
  letter-spacing: 1px;
`;

const HomeLink = styled(Link)`
  font-size: 13px;
  color: #64748b;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  &:hover { color: #4f8ef7; }
`;

const Card = styled.div`
  width: 100%;
  max-width: 640px;
  padding: 32px 24px;
  animation: ${fadeIn} 0.3s ease;
`;

/* ─── Status badge ────────────────────────────────────────────────── */
const STATUS_META = {
  PENDING_PAYMENT: { label: 'Pendiente de pago', color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)', Icon: FiClock },
  CONFIRMED:       { label: 'Confirmada',         color: '#4caf50', bg: 'rgba(76,175,80,0.12)',  Icon: FiCheck },
  COMPLETED:       { label: 'Completada',         color: '#4caf50', bg: 'rgba(76,175,80,0.12)',  Icon: FiCheck },
  CANCELLED:       { label: 'Cancelada',           color: '#f44336', bg: 'rgba(244,67,54,0.12)', Icon: FiX    },
  EXPIRED:         { label: 'Expirada',            color: '#f44336', bg: 'rgba(244,67,54,0.12)', Icon: FiX    },
  NO_SHOW:         { label: 'No se presentó',      color: '#9e9e9e', bg: 'rgba(158,158,158,0.1)',Icon: FiAlertCircle },
};

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 999px;
  background: ${p => p.$bg};
  color: ${p => p.$color};
  font-size: 15px;
  font-weight: 700;
  animation: ${fadeIn} 0.3s ease;
`;

/* ─── Info grid ───────────────────────────────────────────────────── */
const InfoGrid = styled.div`
  background: #f8faff;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 24px 0;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const InfoIcon = styled.div`
  color: #4f8ef7;
  margin-top: 2px;
  flex-shrink: 0;
`;

const InfoLabel = styled.div`
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: .8px;
  margin-bottom: 2px;
`;

const InfoValue = styled.div`
  font-size: 15px;
  color: #1e293b;
  font-weight: 500;
`;

/* ─── Countdown ───────────────────────────────────────────────────── */
const CountdownBox = styled.div`
  background: rgba(79,142,247,0.08);
  border: 1px solid rgba(79,142,247,0.25);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  text-align: center;
`;

const CountdownTime = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${p => p.$urgent ? '#f44336' : '#4f8ef7'};
  font-variant-numeric: tabular-nums;
  animation: ${p => p.$urgent ? pulse : 'none'} 1s ease infinite;
`;

const CountdownLabel = styled.div`
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
`;

/* ─── Payment instructions ────────────────────────────────────────── */
const PayBox = styled.div`
  background: #f8faff;
  border: 1px solid rgba(79,142,247,0.2);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
`;

const PayTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 14px;
`;

const PayRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  &:last-child { border-bottom: none; }
`;

const PayKey = styled.span`font-size:13px;color:#94a3b8;`;
const PayVal = styled.span`font-size:14px;color:#1e293b;font-weight:600;`;

const CopyBtn = styled.button`
  background: none;
  border: none;
  color: #4f8ef7;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  &:hover { background: rgba(79,142,247,0.1); }
`;

const Warning = styled.div`
  background: rgba(244,67,54,0.08);
  border: 1px solid rgba(244,67,54,0.25);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
  color: #f44336;
  margin-bottom: 20px;
  display: flex;
  gap: 8px;
  align-items: flex-start;
`;

/* ─── Timeline ────────────────────────────────────────────────────── */
const TimelineWrap = styled.div`
  margin-top: 28px;
`;

const TimelineTitle = styled.div`
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 14px;
  font-weight: 600;
`;

const TimelineList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const TimelineItem = styled.div`
  display: flex;
  gap: 14px;
  position: relative;
  padding-bottom: 20px;
  &:last-child { padding-bottom: 0; }
  &:last-child .tl-line { display: none; }
`;

const TlDot = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${p => p.$color || '#e2e8f0'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-top: 2px;
  position: relative;
  z-index: 1;
`;

const TlLine = styled.div`
  position: absolute;
  left: 13px;
  top: 30px;
  bottom: 0;
  width: 2px;
  background: #e2e8f0;
  class: tl-line;
`;

const TlBody = styled.div`flex: 1;`;
const TlStatus = styled.div`font-size:14px;font-weight:600;color:#1e293b;`;
const TlReason = styled.div`font-size:12px;color:#64748b;margin-top:2px;`;
const TlDate = styled.div`font-size:11px;color:#4a4757;margin-top:4px;`;

/* ─── Action buttons ──────────────────────────────────────────────── */
const ActionRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
`;

const PrimaryBtn = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  background: #4f8ef7;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  border-radius: 12px;
  text-decoration: none;
  transition: background 0.2s;
  &:hover { background: #2563eb; }
`;

const SecondaryBtn = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  background: transparent;
  border: 1px solid rgba(79,142,247,0.3);
  color: #4f8ef7;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  text-decoration: none;
  transition: background 0.2s;
  &:hover { background: rgba(79,142,247,0.08); }
`;

/* ─── Spinner / Error ─────────────────────────────────────────────── */
const Spinner = styled.div`
  width: 36px; height: 36px;
  border: 3px solid rgba(79,142,247,0.2);
  border-top-color: #4f8ef7;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  margin: 80px auto;
`;

const ErrorMsg = styled.div`
  text-align: center;
  color: #f44336;
  padding: 60px 24px;
  font-size: 15px;
`;

/* ─── Helpers ─────────────────────────────────────────────────────── */
function useCountdownSecs(targetIso) {
  const [secs, setSecs] = useState(() => {
    if (!targetIso) return 0;
    return Math.max(0, differenceInSeconds(parseISO(targetIso), new Date()));
  });

  useEffect(() => {
    if (!targetIso) return;
    const id = setInterval(() => {
      setSecs(Math.max(0, differenceInSeconds(parseISO(targetIso), new Date())));
    }, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return secs;
}

function fmtSecs(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function statusDotColor(status) {
  const meta = STATUS_META[status];
  return meta ? meta.color : '#64748b';
}

function tlLabel(item) {
  const meta = STATUS_META[item.to_status];
  return meta ? meta.label : item.to_status;
}

function formatCOP(n) {
  return '$' + Number(n).toLocaleString('es-CO');
}

/* ─── Component ───────────────────────────────────────────────────── */
export default function BookingStatusPage() {
  const { reference } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const secs = useCountdownSecs(booking?.expires_at);

  const fetchBooking = useCallback(async () => {
    try {
      const [bookingRes, settingsRes] = await Promise.all([
        api.get(`/bookings/${reference}`),
        api.get('/settings/public').catch(() => ({ data: {} })),
      ]);
      setBooking(bookingRes.data);

      if (bookingRes.data.status === 'PENDING_PAYMENT') {
        const s = settingsRes.data;
        setPaymentInfo({
          llave_number: s.llave_number,
          llave_owner: s.llave_owner,
          llave_bank: s.llave_bank,
          amount: bookingRes.data.deposit_amount,
          reference: bookingRes.data.reference,
        });
      }

      setError(null);
    } catch {
      setError('No se encontró la reserva.');
    } finally {
      setLoading(false);
    }
  }, [reference]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Poll each 6s while PENDING_PAYMENT
  useEffect(() => {
    if (!booking || booking.status !== 'PENDING_PAYMENT') return;
    const id = setInterval(fetchBooking, 6000);
    return () => clearInterval(id);
  }, [booking, fetchBooking]);

  function copy(text) {
    navigator.clipboard.writeText(String(text)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return (
    <>
      <Global />
      <Page><Spinner /></Page>
    </>
  );

  if (error || !booking) return (
    <>
      <Global />
      <Page>
        <ErrorMsg>
          <FiAlertCircle size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
          {error || 'Reserva no encontrada.'}
          <br /><br />
          <HomeLink to="/" style={{ justifyContent: 'center' }}>Volver al inicio</HomeLink>
        </ErrorMsg>
      </Page>
    </>
  );

  const meta = STATUS_META[booking.status] || STATUS_META.CANCELLED;
  const StatusIcon = meta.Icon;
  const isPending = booking.status === 'PENDING_PAYMENT';
  const isConfirmed = booking.status === 'CONFIRMED';
  const isTerminal = ['COMPLETED', 'CANCELLED', 'EXPIRED', 'NO_SHOW'].includes(booking.status);
  const expired = isPending && secs === 0;

  const dateLabel = booking.date
    ? format(parseISO(booking.date), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })
    : '—';

  return (
    <>
      <Global />
      <Page>
        <TopBar>
          <Logo>TROYA</Logo>
          <HomeLink to="/"><FiChevronRight size={14} />Inicio</HomeLink>
        </TopBar>

        <Card>
          {/* ── Status badge ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>
              Estado de tu reserva
            </div>
            <StatusBadge $color={meta.color} $bg={meta.bg}>
              <StatusIcon size={16} />
              {expired ? 'Tiempo expirado' : meta.label}
            </StatusBadge>
          </div>

          {/* ── Countdown (solo PENDING_PAYMENT activo) ── */}
          {isPending && !expired && booking.expires_at && (
            <CountdownBox>
              <CountdownTime $urgent={secs < 120}>{fmtSecs(secs)}</CountdownTime>
              <CountdownLabel>tiempo restante para realizar el pago</CountdownLabel>
            </CountdownBox>
          )}

          {/* ── Info summary ── */}
          <InfoGrid>
            <InfoRow>
              <InfoIcon><FiCalendar size={16} /></InfoIcon>
              <div>
                <InfoLabel>Fecha y hora</InfoLabel>
                <InfoValue style={{ textTransform: 'capitalize' }}>{dateLabel}</InfoValue>
              </div>
            </InfoRow>
            <InfoRow>
              <InfoIcon><FiScissors size={16} /></InfoIcon>
              <div>
                <InfoLabel>Servicio</InfoLabel>
                <InfoValue>{booking.service?.name}</InfoValue>
              </div>
            </InfoRow>
            <InfoRow>
              <InfoIcon><FiUser size={16} /></InfoIcon>
              <div>
                <InfoLabel>Barbero</InfoLabel>
                <InfoValue>{booking.barber?.name}</InfoValue>
              </div>
            </InfoRow>
            <InfoRow>
              <InfoIcon><FiClock size={16} /></InfoIcon>
              <div>
                <InfoLabel>Anticipo / Total</InfoLabel>
                <InfoValue>
                  {formatCOP(booking.deposit_amount)} / {formatCOP(booking.total_amount)}
                </InfoValue>
              </div>
            </InfoRow>
          </InfoGrid>

          {/* ── Payment instructions (PENDING_PAYMENT) ── */}
          {isPending && !expired && paymentInfo && (
            <>
              <PayBox>
                <PayTitle>Instrucciones de pago — Bre-B / Llave</PayTitle>
                <PayRow>
                  <PayKey>Número de llave</PayKey>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PayVal>{paymentInfo.llave_number}</PayVal>
                    <CopyBtn onClick={() => copy(paymentInfo.llave_number)}>
                      <FiCopy size={12} /> {copied ? '¡Copiado!' : 'Copiar'}
                    </CopyBtn>
                  </div>
                </PayRow>
                <PayRow>
                  <PayKey>Titular</PayKey>
                  <PayVal>{paymentInfo.llave_owner}</PayVal>
                </PayRow>
                <PayRow>
                  <PayKey>Banco</PayKey>
                  <PayVal>{paymentInfo.llave_bank}</PayVal>
                </PayRow>
                <PayRow>
                  <PayKey>Monto exacto</PayKey>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PayVal style={{ color: '#4f8ef7' }}>{formatCOP(paymentInfo.amount)}</PayVal>
                    <CopyBtn onClick={() => copy(paymentInfo.amount)}>
                      <FiCopy size={12} /> Copiar
                    </CopyBtn>
                  </div>
                </PayRow>
                <PayRow>
                  <PayKey>Referencia</PayKey>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PayVal style={{ fontSize: 11, wordBreak: 'break-all' }}>
                      {paymentInfo.reference.slice(0, 8).toUpperCase()}
                    </PayVal>
                    <CopyBtn onClick={() => copy(paymentInfo.reference)}>
                      <FiCopy size={12} /> Copiar
                    </CopyBtn>
                  </div>
                </PayRow>
              </PayBox>

              <Warning>
                <FiAlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  El anticipo <strong>no es reembolsable</strong>. Una vez confirmada la reserva no
                  se realizan devoluciones bajo ninguna circunstancia.
                </span>
              </Warning>
            </>
          )}

          {/* ── Expired message ── */}
          {isPending && expired && (
            <Warning>
              <FiAlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                El tiempo para realizar el pago expiró. El slot quedó liberado. Puedes hacer una nueva reserva.
              </span>
            </Warning>
          )}

          {/* ── Action buttons ── */}
          <ActionRow>
            {isConfirmed && booking.reschedule_available && booking.reschedule_token && (
              <SecondaryBtn to={`/reschedule/${booking.reschedule_token}`}>
                <FiRefreshCw size={16} />
                Reagendar cita
              </SecondaryBtn>
            )}
            {(isTerminal || (isPending && expired)) && (
              <SecondaryBtn to="/book">
                <FiCalendar size={16} />
                Nueva reserva
              </SecondaryBtn>
            )}
          </ActionRow>

          {/* ── Reference code ── */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#4a4757', marginBottom: 4 }}>
              Código de reserva
            </div>
            <div style={{ fontSize: 13, color: '#64748b', fontFamily: 'monospace', letterSpacing: 1 }}>
              {booking.reference}
            </div>
          </div>

          {/* ── Timeline ── */}
          {booking.status_history && booking.status_history.length > 0 && (
            <TimelineWrap>
              <TimelineTitle>Historial de estados</TimelineTitle>
              <TimelineList>
                {booking.status_history.map((item, i) => (
                  <TimelineItem key={i}>
                    <div style={{ position: 'relative' }}>
                      <TlDot $color={statusDotColor(item.to_status)}>
                        <FiCheck size={12} color="#ffffff" />
                      </TlDot>
                      {i < booking.status_history.length - 1 && (
                        <TlLine className="tl-line" />
                      )}
                    </div>
                    <TlBody>
                      <TlStatus>{tlLabel(item)}</TlStatus>
                      {item.reason && <TlReason>{item.reason}</TlReason>}
                      <TlDate>
                        {format(parseISO(item.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                      </TlDate>
                    </TlBody>
                  </TimelineItem>
                ))}
              </TimelineList>
            </TimelineWrap>
          )}
        </Card>
      </Page>
    </>
  );
}
