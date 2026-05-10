import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowLeft, FiCheck, FiCopy, FiClock, FiUser, FiMail, FiPhone, FiCalendar, FiScissors, FiAlertCircle, FiShare2, FiStar } from 'react-icons/fi';
import { GiRazor, GiComb, GiScissors, GiMustache } from 'react-icons/gi';
import api from '../services/api';
import track, { EVENTS } from '../services/analytics';
import { haptic, shareBooking } from '../services/mobile';

/* ─── Global ─────────────────────────────────────────────── */
const Global = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #0f0d14;
    color: #f4ede8;
    font-family: 'Segoe UI', system-ui, sans-serif;
  }
`;

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const STEPS = ['Barbero', 'Servicio', 'Horario', 'Tus datos', 'Pago', 'Confirmación'];

/* ─── Animations ─────────────────────────────────────────── */
const fadeIn    = keyframes`from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); }`;
const spin      = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const pulse     = keyframes`0%,100% { opacity: 1; } 50% { opacity: 0.4; }`;
const shimmer   = keyframes`0% { background-position: -600px 0; } 100% { background-position: 600px 0; }`;
const glowPulse = keyframes`0%,100% { box-shadow: 0 0 20px rgba(255,144,0,0.15); } 50% { box-shadow: 0 0 40px rgba(255,144,0,0.35); }`;
const floatUp   = keyframes`0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); }`;

/* ─── Layout ─────────────────────────────────────────────── */
const Page = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(ellipse 80% 40% at 50% 0%, rgba(255,144,0,0.07) 0%, transparent 70%),
    #0f0d14;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0 100px;
  position: relative;
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      radial-gradient(circle, rgba(255,144,0,0.04) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
    z-index: 0;
  }
`;

const TopBar = styled.div`
  width: 100%;
  max-width: 640px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px 0;
  position: relative;
  z-index: 1;
  @media (max-width: 640px) { padding: 16px 16px 0; }
`;

const BackBtn = styled.button`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: #999591;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 10px;
  transition: all 0.2s;
  &:hover { color: #ff9000; border-color: rgba(255,144,0,0.4); background: rgba(255,144,0,0.06); }
`;

const Logo = styled.span`
  font-size: 20px;
  font-weight: 800;
  background: linear-gradient(135deg, #ff9000, #ffb347);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 3px;
  flex: 1;
  text-align: center;
`;

/* ─── Progress bar ───────────────────────────────────────── */
const ProgressWrap = styled.div`
  width: 100%;
  max-width: 640px;
  padding: 24px 24px 0;
  position: relative;
  z-index: 1;
  @media (max-width: 640px) { padding: 20px 16px 0; }
`;

const ProgressTrack = styled.div`
  display: flex;
  align-items: center;
`;

const StepDot = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.35s;
  background: ${p => p.$done ? 'linear-gradient(135deg,#ff9000,#e07000)' : p.$active ? 'linear-gradient(135deg,#ff9000,#ffb347)' : 'rgba(255,255,255,0.04)'};
  color: ${p => (p.$done || p.$active) ? '#0f0d14' : '#555'};
  border: 1.5px solid ${p => p.$done ? '#e07000' : p.$active ? '#ff9000' : 'rgba(255,255,255,0.08)'};
  box-shadow: ${p => p.$active ? '0 0 16px rgba(255,144,0,0.5)' : 'none'};
`;

const StepLine = styled.div`
  flex: 1;
  height: 2px;
  background: ${p => p.$done
    ? 'linear-gradient(90deg,#ff9000,#e07000)'
    : 'rgba(255,255,255,0.06)'};
  transition: background 0.35s;
`;

const StepLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
`;

const StepLabel = styled.span`
  font-size: 9px;
  color: ${p => p.$active ? '#ff9000' : p.$done ? '#666360' : '#333'};
  font-weight: ${p => p.$active ? '700' : '400'};
  text-align: center;
  width: 60px;
  margin-left: -15px;
  letter-spacing: 0.3px;
  &:first-child { margin-left: 0; }
`;

/* ─── Card ───────────────────────────────────────────────── */
const Card = styled.div`
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 32px 24px;
  animation: ${fadeIn} 0.35s ease;
  position: relative;
  z-index: 1;
  @media (max-width: 640px) { padding: 24px 16px; }
`;

const StepTitle = styled.h2`
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 6px;
  color: #f4ede8;
  letter-spacing: -0.3px;
`;

const StepSub = styled.p`
  font-size: 14px;
  color: #555061;
  margin-bottom: 28px;
  line-height: 1.6;
`;

/* ─── Hero banner (Step 0) ───────────────────────────────── */
const HeroBanner = styled.div`
  background: linear-gradient(135deg, rgba(255,144,0,0.08) 0%, rgba(255,100,0,0.04) 100%);
  border: 1px solid rgba(255,144,0,0.12);
  border-radius: 20px;
  padding: 28px 24px;
  margin-bottom: 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  overflow: hidden;
  position: relative;
  &::after {
    content: '✂';
    position: absolute;
    right: -10px;
    top: -10px;
    font-size: 80px;
    opacity: 0.04;
    transform: rotate(30deg);
    pointer-events: none;
  }
`;

const HeroText = styled.div``;

const HeroTitle = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: #f4ede8;
  margin-bottom: 4px;
`;

const HeroSub = styled.div`
  font-size: 13px;
  color: #666360;
  line-height: 1.5;
`;

const HeroIconWrap = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255,144,0,0.2), rgba(255,100,0,0.1));
  border: 1px solid rgba(255,144,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: ${floatUp} 3s ease-in-out infinite;
  color: #ff9000;
`;

/* ─── Services ───────────────────────────────────────────── */
const ServiceGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ServiceCard = styled.button`
  background: ${p => p.$active
    ? 'linear-gradient(135deg, rgba(255,144,0,0.1), rgba(255,100,0,0.06))'
    : 'rgba(255,255,255,0.025)'};
  border: 1.5px solid ${p => p.$active ? '#ff9000' : 'rgba(255,255,255,0.06)'};
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;
  transition: all 0.22s;
  box-shadow: ${p => p.$active ? '0 4px 24px rgba(255,144,0,0.15)' : 'none'};
  &:hover {
    border-color: rgba(255,144,0,0.5);
    background: rgba(255,144,0,0.05);
    transform: translateY(-1px);
  }
`;

const ServiceInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const ServiceName = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #f4ede8;
`;

const ServiceMeta = styled.span`
  font-size: 12px;
  color: #555061;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ServicePrice = styled.div`
  text-align: right;
  flex-shrink: 0;
`;

const PriceTotal = styled.div`
  font-size: 19px;
  font-weight: 800;
  background: linear-gradient(135deg, #ff9000, #ffb347);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const PriceDeposit = styled.div`
  font-size: 11px;
  color: #444;
  margin-top: 3px;
`;

const ServiceIconWrap = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: rgba(255,144,0,0.08);
  border: 1px solid rgba(255,144,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff9000;
  flex-shrink: 0;
  margin-right: 14px;
`;

/* ─── Skeleton ───────────────────────────────────────────── */
const Skeleton = styled.div`
  background: linear-gradient(90deg,
    rgba(255,255,255,0.03) 25%,
    rgba(255,255,255,0.06) 50%,
    rgba(255,255,255,0.03) 75%);
  background-size: 1200px 100%;
  animation: ${shimmer} 1.6s ease infinite;
  border-radius: 16px;
  height: ${p => p.$h || '72px'};
  width: ${p => p.$w || '100%'};
  margin-bottom: 10px;
`;

/* ─── Barbers ─────────────────────────────────────────────── */
const BarberGrid = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 28px;
`;

const BarberBtn = styled.button`
  background: ${p => p.$active
    ? 'linear-gradient(135deg, rgba(255,144,0,0.12), rgba(255,100,0,0.06))'
    : 'rgba(255,255,255,0.025)'};
  border: 1.5px solid ${p => p.$active ? '#ff9000' : 'rgba(255,255,255,0.06)'};
  border-radius: 14px;
  padding: 14px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.22s;
  color: #f4ede8;
  font-size: 14px;
  font-weight: ${p => p.$active ? '700' : '400'};
  box-shadow: ${p => p.$active ? '0 4px 20px rgba(255,144,0,0.15)' : 'none'};
  &:hover { border-color: rgba(255,144,0,0.5); transform: translateY(-1px); }
`;

const BarberAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff9000, #e07000);
  color: #0f0d14;
  font-weight: 800;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(255,144,0,0.3);
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
  background: ${p => p.$active
    ? 'linear-gradient(135deg, #ff9000, #e07000)'
    : 'rgba(255,255,255,0.03)'};
  color: ${p => p.$active ? '#0f0d14' : '#f4ede8'};
  border: 1.5px solid ${p => p.$active ? 'transparent' : 'rgba(255,255,255,0.06)'};
  border-radius: 14px;
  padding: 12px 14px;
  min-width: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  transition: all 0.22s;
  flex-shrink: 0;
  box-shadow: ${p => p.$active ? '0 4px 16px rgba(255,144,0,0.3)' : 'none'};
  &:hover { border-color: rgba(255,144,0,0.5); transform: translateY(-1px); }
  strong { font-size: 22px; font-weight: 800; line-height: 1; }
  span { font-size: 10px; text-transform: capitalize; opacity: ${p => p.$active ? 0.8 : 0.5}; }
`;

/* ─── Hours ──────────────────────────────────────────────── */
const HoursGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  @media (max-width: 400px) { grid-template-columns: repeat(3, 1fr); }
`;

const HourBtn = styled.button`
  background: ${p => p.$active
    ? 'linear-gradient(135deg, #ff9000, #e07000)'
    : p.$disabled ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.04)'};
  color: ${p => p.$active ? '#0f0d14' : p.$disabled ? '#2a2830' : '#ccc8c4'};
  border: 1.5px solid ${p => p.$active ? 'transparent' : p.$disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.07)'};
  border-radius: 12px;
  padding: 13px 8px;
  font-size: 13px;
  font-weight: ${p => p.$active ? '700' : '500'};
  cursor: ${p => p.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  box-shadow: ${p => p.$active ? '0 3px 12px rgba(255,144,0,0.3)' : 'none'};
  &:hover:not(:disabled) { border-color: rgba(255,144,0,0.5); transform: translateY(-1px); }
`;

/* ─── Form ───────────────────────────────────────────────── */
const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666360;
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  svg { color: #ff9000; }
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  background: rgba(255,255,255,0.04);
  border: 1.5px solid ${p => p.$error ? '#e05555' : 'rgba(255,255,255,0.08)'};
  border-radius: 12px;
  color: #f4ede8;
  font-size: 15px;
  transition: all 0.2s;
  &:focus {
    outline: none;
    border-color: #ff9000;
    background: rgba(255,144,0,0.04);
    box-shadow: 0 0 0 3px rgba(255,144,0,0.08);
  }
  &::placeholder { color: #2e2c38; }
`;

const FieldError = styled.span`
  font-size: 12px;
  color: #e05555;
  margin-top: 5px;
  display: block;
`;

/* ─── Summary box ────────────────────────────────────────── */
const SummaryBox = styled.div`
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: ${p => p.$highlight ? '#ff9000' : '#f4ede8'};
  font-weight: ${p => p.$highlight ? '700' : '400'};
  span:first-child { color: #444; font-size: 13px; }
  ${p => p.$highlight && 'border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px;'}
`;

/* ─── Payment box ────────────────────────────────────────── */
const PaymentBox = styled.div`
  background: linear-gradient(135deg, rgba(255,144,0,0.06), rgba(255,100,0,0.03));
  border: 1px solid rgba(255,144,0,0.2);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
  animation: ${glowPulse} 3s ease-in-out infinite;
`;

const PaymentTitle = styled.div`
  font-size: 11px;
  color: #666360;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 4px;
  font-weight: 600;
`;

const PaymentRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  font-size: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  &:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
`;

const PaymentLabel = styled.span`
  color: #555061;
  font-size: 13px;
`;

const PaymentValue = styled.span`
  color: #f4ede8;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AmountBig = styled.div`
  font-size: 42px;
  font-weight: 800;
  background: linear-gradient(135deg, #ff9000, #ffb347);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 12px 0 2px;
  line-height: 1;
`;

const CopyBtn = styled.button`
  background: rgba(255,144,0,0.1);
  border: 1px solid rgba(255,144,0,0.25);
  border-radius: 8px;
  color: #ff9000;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  &:hover { background: rgba(255,144,0,0.18); }
`;

const CountdownWrap = styled.div`
  background: rgba(255,144,0,0.06);
  border: 1px solid rgba(255,144,0,0.18);
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
`;

const CountdownTime = styled.span`
  font-size: 26px;
  font-weight: 800;
  color: ${p => p.$urgent ? '#e05555' : '#ff9000'};
  font-variant-numeric: tabular-nums;
  animation: ${p => p.$urgent ? pulse : 'none'} 1s ease infinite;
  letter-spacing: 1px;
`;

const AlertBox = styled.div`
  background: rgba(224,85,85,0.07);
  border: 1px solid rgba(224,85,85,0.2);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 20px;
  font-size: 13px;
  color: #c06060;
  line-height: 1.5;
  svg { flex-shrink: 0; margin-top: 1px; }
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
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${p => p.$confirmed
    ? 'linear-gradient(135deg, rgba(76,175,80,0.15), rgba(56,142,60,0.08))'
    : 'linear-gradient(135deg, rgba(255,144,0,0.12), rgba(255,100,0,0.06))'};
  border: 2px solid ${p => p.$confirmed ? 'rgba(76,175,80,0.5)' : 'rgba(255,144,0,0.4)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  box-shadow: 0 0 32px ${p => p.$confirmed ? 'rgba(76,175,80,0.15)' : 'rgba(255,144,0,0.15)'};
`;

const Spinner = styled.div`
  width: 26px;
  height: 26px;
  border: 3px solid rgba(255,144,0,0.15);
  border-top-color: #ff9000;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const StatusTitle = styled.h3`
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 8px;
  color: ${p => p.$confirmed ? '#4caf50' : '#f4ede8'};
`;

const StatusText = styled.p`
  font-size: 14px;
  color: #555061;
  line-height: 1.7;
  max-width: 340px;
  margin-bottom: 8px;
`;

const RefCode = styled.div`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 12px 20px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #ff9000;
  letter-spacing: 1.5px;
  margin: 16px 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

/* ─── CTA ────────────────────────────────────────────────── */
const CTABtn = styled.button`
  width: 100%;
  padding: 17px;
  background: ${p => p.$ghost
    ? 'transparent'
    : 'linear-gradient(135deg, #ff9000 0%, #e07000 100%)'};
  border: ${p => p.$ghost ? '1.5px solid rgba(255,144,0,0.25)' : 'none'};
  border-radius: 16px;
  color: ${p => p.$ghost ? '#ff9000' : '#0f0d14'};
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  letter-spacing: 0.2px;
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${p => p.$ghost
      ? '0 4px 20px rgba(255,144,0,0.1)'
      : '0 8px 32px rgba(255,144,0,0.35)'};
  }
  &:disabled { opacity: 0.25; cursor: not-allowed; transform: none; box-shadow: none; }
`;

const StickyFooter = styled.div`
  position: sticky;
  bottom: 0;
  background: linear-gradient(to top, #0f0d14 60%, transparent);
  padding: 20px 0 10px;
  margin-top: 12px;
  @media (min-width: 640px) { position: static; background: none; padding: 8px 0 0; }
`;

const Divider = styled.div`height: 12px;`;

/* ─── Badges / misc ──────────────────────────────────────── */
const TrustBar = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
`;

const TrustItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #555061;
  svg { color: #ff9000; }
`;

/* ─── Service icon helper ────────────────────────────────── */
function ServiceIcon({ name }) {
  const n = (name || '').toLowerCase();
  if (n.includes('barba')) return <GiMustache size={18} />;
  if (n.includes('ceja') || n.includes('henna')) return <FiScissors size={16} />;
  if (n.includes('corte')) return <GiScissors size={18} />;
  return <GiComb size={18} />;
}

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

/* ─── Step 0: Barber ─────────────────────────────────────── */
function StepBarber({ preselectedId, onNext }) {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(preselectedId ? Number(preselectedId) : null);

  useEffect(() => {
    api.get('/providers')
      .then(r => {
        setBarbers(r.data);
        if (preselectedId && r.data.length > 0) setSelected(Number(preselectedId));
      })
      .finally(() => setLoading(false));
  }, []);

  function handleNext() {
    if (!selected) return;
    const barber = barbers.find(b => b.id === selected);
    onNext({ barberId: selected, barberName: barber?.name || '' });
  }

  return (
    <Card>
      <HeroBanner>
        <HeroIconWrap><GiScissors size={28} /></HeroIconWrap>
        <HeroText>
          <HeroTitle>Tu estilo, tu cita ✦</HeroTitle>
          <HeroSub>Reserva en minutos. Anticipo seguro, horario garantizado.</HeroSub>
        </HeroText>
      </HeroBanner>

      <TrustBar>
        <TrustItem><FiStar size={12} />Barberos certificados</TrustItem>
        <TrustItem><FiClock size={12} />Confirmación inmediata</TrustItem>
        <TrustItem><GiRazor size={12} />Cortes premium</TrustItem>
      </TrustBar>

      <StepTitle>¿Con quién quieres tu cita?</StepTitle>
      <StepSub>Elige tu barbero para ver los servicios disponibles.</StepSub>
      <ServiceGrid>
        {loading
          ? [1, 2].map(i => <Skeleton key={i} $h="72px" />)
          : barbers.map(b => (
            <ServiceCard
              key={b.id}
              $active={selected === b.id}
              onClick={() => setSelected(b.id)}
            >
              <ServiceInfo style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <BarberAvatar style={{ width: 44, height: 44, fontSize: 16, flexShrink: 0 }}>
                  {(b.avatar && b.avatar.url)
                    ? <img src={b.avatar.url} alt={b.name} />
                    : b.name[0].toUpperCase()
                  }
                </BarberAvatar>
                <div>
                  <ServiceName>{b.name}</ServiceName>
                  <ServiceMeta><FiScissors size={11} style={{ marginRight: 4 }} />Barbero profesional</ServiceMeta>
                </div>
              </ServiceInfo>
              {selected === b.id && <FiCheck size={20} color="#ff9000" style={{ flexShrink: 0 }} />}
            </ServiceCard>
          ))
        }
      </ServiceGrid>
      <StickyFooter>
        <CTABtn disabled={!selected} onClick={handleNext}>
          Continuar
        </CTABtn>
      </StickyFooter>
    </Card>
  );
}

/* ─── Step 1: Service ────────────────────────────────────── */
function StepService({ barberId, barberName, onNext, onBack }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/services', { params: { barber_id: barberId } })
      .then(r => setServices(r.data))
      .finally(() => setLoading(false));
  }, [barberId]);

  return (
    <Card>
      <StepTitle>¿Qué servicio necesitas?</StepTitle>
      <StepSub>Servicios disponibles con <strong style={{ color: '#ff9000' }}>{barberName}</strong>.</StepSub>
      <ServiceGrid>
        {loading
          ? [1, 2, 3].map(i => <Skeleton key={i} $h="80px" />)
          : services.map(s => (
            <ServiceCard
              key={s.id}
              $active={selected?.id === s.id}
              onClick={() => setSelected(s)}
            >
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <ServiceIconWrap><ServiceIcon name={s.name} /></ServiceIconWrap>
                <ServiceInfo>
                  <ServiceName>{s.name}</ServiceName>
                  <ServiceMeta>
                    <FiClock size={11} />{s.duration_minutes} min
                  </ServiceMeta>
                </ServiceInfo>
              </div>
              <ServicePrice>
                <PriceTotal>{fmt(s.price)}</PriceTotal>
                <PriceDeposit>Anticipo {fmt(s.deposit_range.min)}</PriceDeposit>
              </ServicePrice>
            </ServiceCard>
          ))
        }
      </ServiceGrid>
      <StickyFooter>
        <CTABtn disabled={!selected} onClick={() => onNext(selected)}>
          Continuar
        </CTABtn>
        <CTABtn $ghost onClick={onBack} style={{ marginTop: 8 }}>Atrás</CTABtn>
      </StickyFooter>
    </Card>
  );
}

/* ─── Step 2: Date + Hour (barber already chosen) ────────── */
function StepSchedule({ barberId, barberName, onNext, onBack }) {
  const [selectedDate, setSelectedDate] = useState(startOfDay(addDays(new Date(), 1)));
  const [selectedHour, setSelectedHour] = useState(null);
  const [occupied, setOccupied] = useState(new Set());
  const [availableHours, setAvailableHours] = useState(HOURS);
  const [dayClosed, setDayClosed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const days = Array.from({ length: 10 }, (_, i) => addDays(startOfDay(new Date()), i + 1));

  useEffect(() => {
    setLoadingSlots(true);
    setSelectedHour(null);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    api.get(`/bookings/availability/${barberId}`, { params: { date: dateStr } })
      .then(r => {
        setOccupied(new Set(r.data.occupied.map(d => new Date(d).getHours())));
        setAvailableHours(r.data.available_hours && r.data.available_hours.length ? r.data.available_hours : HOURS);
        setDayClosed(!!r.data.closed);
      })
      .catch(() => { setOccupied(new Set()); setAvailableHours(HOURS); setDayClosed(false); })
      .finally(() => setLoadingSlots(false));
  }, [barberId, selectedDate]);

  function handleNext() {
    if (selectedHour === null) return;
    const date = new Date(selectedDate);
    date.setHours(selectedHour, 0, 0, 0);
    onNext({ barberId, date: date.toISOString(), barberName });
  }

  return (
    <Card>
      <StepTitle>Elige tu horario</StepTitle>
      <StepSub>Selecciona el día y hora con <strong style={{ color: '#ff9000' }}>{barberName}</strong>.</StepSub>

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
        Desde tu banco envía a través de Bre-B exactamente <strong style={{ color: '#ff9000' }}>{fmt(inst?.amount)}</strong> a la llave <strong style={{ color: '#f4ede8' }}>{inst?.llave}</strong> e incluye la referencia <strong style={{ color: '#f4ede8' }}>{inst?.reference}</strong> en el mensaje.
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
  const [barber, setBarber] = useState(null);   // { barberId, barberName }
  const [service, setService] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [bookingRef, setBookingRef] = useState(null);

  useEffect(() => {
    if (step === 0) track(EVENTS.BOOKING_STARTED);
    if (step === 4 && service && schedule) track(EVENTS.BOOKING_PAYMENT_SHOWN, {
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
              <StepBarber
                preselectedId={preselectedBarberId}
                onNext={b => {
                  haptic([20]);
                  track(EVENTS.BOOKING_STARTED, { barberId: b.barberId, barberName: b.barberName });
                  setBarber(b);
                  setStep(1);
                }}
              />
            )}
            {step === 1 && barber && (
              <StepService
                barberId={barber.barberId}
                barberName={barber.barberName}
                onNext={s => {
                  haptic([20]);
                  track(EVENTS.BOOKING_SLOT_SELECTED, { serviceId: s.id, serviceName: s.name });
                  setService(s);
                  setStep(2);
                }}
                onBack={handleBack}
              />
            )}
            {step === 2 && barber && (
              <StepSchedule
                barberId={barber.barberId}
                barberName={barber.barberName}
                onNext={s => {
                  haptic([20]);
                  track(EVENTS.BOOKING_SLOT_SELECTED, { barberId: s.barberId, date: s.date });
                  setSchedule(s);
                  setStep(3);
                }}
                onBack={handleBack}
              />
            )}
            {step === 3 && (
              <StepCustomer
                service={service}
                schedule={schedule}
                onNext={c => {
                  haptic([20]);
                  track(EVENTS.BOOKING_CUSTOMER_FILLED);
                  setCustomer(c);
                  setStep(4);
                }}
                onBack={handleBack}
              />
            )}
            {step === 4 && (
              <StepPayment
                service={service}
                schedule={schedule}
                customer={customer}
                onBookingCreated={ref => {
                  haptic([30, 30, 60]);
                  track(EVENTS.BOOKING_CREATED, { reference: ref });
                  setBookingRef(ref);
                  setStep(5);
                }}
                onBack={() => setStep(2)}
              />
            )}
            {step === 5 && (
              <StepStatus reference={bookingRef} />
            )}
          </motion.div>
        </AnimatePresence>
      </Page>
    </>
  );
}
