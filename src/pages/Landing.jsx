import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import {
  FiMapPin, FiPhone, FiMessageCircle, FiClock, FiStar,
  FiChevronRight, FiX, FiInstagram, FiMenu, FiLogIn,
} from 'react-icons/fi';
import { FaWhatsapp, FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ReviewsModal from '../components/ReviewsModal';

const SHOP = {
  name: 'Troya Barber Studio',
  tagline: 'Experiencias de alta calidad en cuidado masculino',
  description:
    'Somos una empresa comprometida a brindar experiencias de alta calidad en cuidado masculino, enfocados en asesoría de imagen, barbería y tratamientos capilares. Un lugar donde puedes confiar tu imagen y la estilo en manos de profesionales dispuestos a brindarte la mejor experiencia.',
  address: 'Cl 18 #49-75, Pasto, Nariño, Colombia',
  phone: '+573017381452',
  whatsapp: '+573017381452',
  instagram: '@troyabarberstudio',
  hours: [
    { day: 'Lunes – Viernes', time: '9:00 am – 7:00 pm' },
    { day: 'Sábado', time: '9:00 am – 6:00 pm' },
    { day: 'Domingo', time: 'Cerrado' },
  ],
  rating: 4.8,
  reviewCount: 7,
  heroImage:
    '/unnamed.jpg',
  logo: 'https://ui-avatars.com/api/?name=T&background=2563eb&color=ffffff&size=120&font-size=0.6&bold=true',
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15955.656186821718!2d-77.29945537264781!3d1.2198858902215852!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e2ed510e7ab1d87%3A0xb3d5a0e1dc26a862!2sTroya%20Barberia%20premium!5e0!3m2!1sen!2sco!4v1778448288538!5m2!1sen!2sco',
};

const BARBERS_INFO = {
  default: [
    {
      name: 'Luis Fernando',
      role: 'Fundador & Master Barber',
      specialty: 'Cortes clásicos, modernos y diseños de barba, etc.',
      exp: '8 años de experiencia',
      photo: '/Luis.webp',
    },
    {
      name: 'Jhayser',
      role: 'Senior Barber',
      specialty: 'Cortes modernos, tratamientos y diseños, etc.',
      exp: '5 años de experiencia',
      photo: '/Jhoymar-Jojoa.webp',
    },
  ],
};

const REVIEWS = [
  { id: 1, name: 'Carlos Martínez', rating: 5, comment: 'El mejor servicio de barbería que he tenido. Jhayser es un artista, quedé impresionado con el resultado. 100% recomendado.', date: 'hace 2 días', avatar: 'CM' },
  { id: 2, name: 'Andrés López', rating: 5, comment: 'Ambiente increíble, música perfecta y un corte que superó mis expectativas. Fernando se tomó su tiempo para entender exactamente lo que quería.', date: 'hace 1 semana', avatar: 'AL' },
  { id: 3, name: 'Miguel Torres', rating: 5, comment: 'Llevo 2 años viniendo aquí y nunca me han decepcionado. La consistencia en la calidad es lo que más valoro.', date: 'hace 2 semanas', avatar: 'MT' },
  { id: 4, name: 'Daniel Ruiz', rating: 4, comment: 'Muy buena atención y excelente técnica. El único detalle es que a veces toca esperar un poco, pero vale la pena.', date: 'hace 3 semanas', avatar: 'DR' },
  { id: 5, name: 'Sebastián García', rating: 5, comment: 'Fui por primera vez con Sebastián y quedé encantado. El diseño de barba fue perfecto. Ya tengo mi cita para la próxima semana.', date: 'hace 1 mes', avatar: 'SG' },
  { id: 6, name: 'Juan Pérez', rating: 4, comment: 'Excelente lugar, muy profesionales. El ambiente es cálido y te hacen sentir como en casa. Precios muy justos.', date: 'hace 1 mes', avatar: 'JP' },
  { id: 7, name: 'Diego Morales', rating: 5, comment: 'Sin duda la mejor barbería de Pasto. Camilo hizo un trabajo excepcional con mi cabello afro. Muy contento.', date: 'hace 2 meses', avatar: 'DM' },
];

const GlobalStyle = createGlobalStyle`
  body { background: #ffffff; margin: 0; }
`;

/* ─── Animations ─────────────────────────────────────────── */
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;

/* ─── Nav ────────────────────────────────────────────────── */
const Nav = styled.nav`
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 12px;
  background: ${p => p.$scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.4)'};
  backdrop-filter: blur(12px);
  border: 1px solid ${p => p.$scrolled ? 'rgba(79,142,247,0.2)' : 'rgba(255,255,255,0.15)'};
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
  width: auto;

  @media (max-width: 600px) { top: 12px; padding: 6px 10px; }
`;

const NavLogo = styled.span`
  font-size: 20px;
  font-weight: 800;
  color: ${p => p.$scrolled ? '#4f8ef7' : '#ffffff'};
  letter-spacing: 4px;
  text-transform: uppercase;
  text-shadow: ${p => p.$scrolled ? 'none' : '0 2px 12px rgba(0,0,0,0.4)'};
  transition: all 0.3s ease;
`;

const NavActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const NavBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: ${p => p.$primary ? '#4f8ef7' : 'rgba(255,255,255,0.12)'};
  color: #ffffff;
  border: 1.5px solid ${p => p.$primary ? '#4f8ef7' : 'rgba(255,255,255,0.5)'};
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);

  &:hover {
    background: ${p => p.$primary ? '#2563eb' : 'rgba(255,255,255,0.25)'};
    border-color: ${p => p.$primary ? '#2563eb' : '#ffffff'};
    transform: translateY(-1px);
  }

  /* Cuando el nav está scrolled (fondo blanco) */
  ${p => p.$scrolled && `
    background: ${p.$primary ? '#4f8ef7' : 'transparent'};
    color: ${p.$primary ? '#ffffff' : '#1e293b'};
    border-color: ${p.$primary ? '#4f8ef7' : 'rgba(15,23,42,0.2)'};
    text-shadow: none;
    backdrop-filter: none;
    &:hover {
      background: ${p.$primary ? '#2563eb' : 'rgba(79,142,247,0.08)'};
      color: ${p.$primary ? '#ffffff' : '#4f8ef7'};
      border-color: #4f8ef7;
    }
  `}

  @media (max-width: 480px) {
    span { display: none; }
    padding: 10px;
  }
`;

/* ─── Hero ───────────────────────────────────────────────── */
const Hero = styled.section`
  position: relative;
  height: 100vh;
  min-height: 600px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
`;

const HeroBg = styled.div`
  position: absolute;
  inset: 0;
  background-image: url(${p => p.$src});
  background-size: cover;
  background-position: center top;
  transition: transform 8s ease;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.45) 0%,
      rgba(0,0,0,0.55) 50%,
      rgba(0,0,0,0.75) 100%
    );
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  padding: 40px 48px;
  margin: 0 40px 60px;
  max-width: 640px;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 20px;
  animation: ${fadeUp} 0.8s ease both;

  @media (max-width: 768px) {
    margin: 0 16px 40px;
    padding: 28px 24px;
  }
`;

const HeroBadge = styled.span`
  display: inline-block;
  padding: 6px 14px;
  background: rgba(79,142,247,0.15);
  border: 1px solid rgba(79,142,247,0.4);
  border-radius: 20px;
  font-size: 12px;
  color: #4f8ef7;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 16px;
`;

const HeroTitle = styled.h1`
  font-size: clamp(36px, 6vw, 72px);
  font-weight: 700;
  color: #ffffff;
  line-height: 1.1;
  margin-bottom: 16px;
  letter-spacing: -1px;
`;

const HeroSub = styled.p`
  font-size: 18px;
  color: rgba(255,255,255,0.85);
  margin-bottom: 36px;
  line-height: 1.6;
  max-width: 500px;
  text-shadow: 0 1px 6px rgba(0,0,0,0.4);
`;

const HeroRating = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;

  .stars { display: flex; gap: 3px; }
  .count { color: rgba(255,255,255,0.75); font-size: 14px; }
`;

const HeroCTA = styled.button`
  padding: 16px 36px;
  background: linear-gradient(135deg, #4f8ef7, #93c5fd);
  color: #ffffff;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 32px rgba(79,142,247,0.35);
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(79,142,247,0.5);
  }
`;

/* ─── Info Strip ─────────────────────────────────────────── */
const InfoStrip = styled.div`
  background: #ffffff;
  border-bottom: 1px solid rgba(79,142,247,0.1);
  padding: 20px 60px;
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: 768px) { padding: 20px 24px; gap: 16px; }
`;

const InfoItem = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(15,23,42,0.65);
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s;
  cursor: pointer;

  svg { color: #4f8ef7; flex-shrink: 0; }

  &:hover { color: #4f8ef7; }
`;

/* ─── Main Layout ────────────────────────────────────────── */
const Main = styled.main`
  background: #f0f5ff;
  padding: 80px 60px;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 60px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    padding: 60px 24px;
  }
`;

const Left = styled.div``;
const Right = styled.div``;

/* ─── Section ────────────────────────────────────────────── */
const SectionLabel = styled.p`
  font-size: 11px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #4f8ef7;
  margin-bottom: 8px;
`;

const SectionTitle = styled.h2`
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20px;
  line-height: 1.2;
`;

const SectionText = styled.p`
  font-size: 16px;
  line-height: 1.8;
  color: rgba(15,23,42,0.65);
  margin-bottom: 40px;
`;

/* ─── Map ────────────────────────────────────────────────── */
const MapWrapper = styled.div`
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(79,142,247,0.15);
  margin-bottom: 32px;
  height: 280px;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
    filter: none;
  }
`;

const MapAddress = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: #ffffff;
  border-radius: 10px;
  font-size: 14px;
  color: rgba(15,23,42,0.8);
  border: 1px solid rgba(79,142,247,0.1);
  margin-bottom: 32px;

  svg { color: #4f8ef7; margin-top: 2px; flex-shrink: 0; }
`;

/* ─── Hours ──────────────────────────────────────────────── */
const HoursCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(79,142,247,0.1);
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  margin-bottom: 32px;
`;

const HoursTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: #1e293b;
  margin-bottom: 16px;
  svg { color: #4f8ef7; }
`;

const HoursRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  font-size: 14px;

  &:last-child { border-bottom: none; }

  .day { color: rgba(15,23,42,0.55); }
  .time { color: ${p => p.$closed ? 'rgba(15,23,42,0.25)' : '#1e293b'}; font-weight: 500; }
`;

/* ─── Professionals ──────────────────────────────────────── */
const BarbersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 60px;

  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const BarberCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(79,142,247,0.08);
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    border-color: rgba(79,142,247,0.4);
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.12);
  }
`;

const BarberPhoto = styled.div`
  height: 180px;
  background-image: url(${p => p.$src});
  background-size: cover;
  background-position: center top;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 60px;
    background: linear-gradient(transparent, rgba(0,0,0,0.25));
  }
`;

const BarberInfo = styled.div`
  padding: 16px;
`;

const BarberName = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2px;
`;

const BarberRole = styled.p`
  font-size: 12px;
  color: #4f8ef7;
  margin-bottom: 6px;
`;

const BarberSpec = styled.p`
  font-size: 12px;
  color: rgba(15,23,42,0.45);
  margin-bottom: 12px;
`;

const BookBtn = styled.button`
  width: 100%;
  padding: 10px;
  background: rgba(79,142,247,0.1);
  border: 1px solid rgba(79,142,247,0.3);
  border-radius: 8px;
  color: #4f8ef7;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    background: #4f8ef7;
    color: #ffffff;
    border-color: #4f8ef7;
  }
`;

/* ─── Reviews ────────────────────────────────────────────── */
const ReviewsSection = styled.section`
  background: #f0f5ff;
  padding: 80px 60px;
  border-top: 1px solid rgba(79,142,247,0.08);

  @media (max-width: 768px) { padding: 60px 24px; }
`;

const ReviewsHeader = styled.div`
  max-width: 1200px;
  margin: 0 auto 48px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
`;

const RatingBig = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const RatingNumber = styled.span`
  font-size: 72px;
  font-weight: 700;
  color: #4f8ef7;
  line-height: 1;
`;

const RatingInfo = styled.div`
  .stars { display: flex; gap: 4px; margin-bottom: 4px; }
  .count { font-size: 14px; color: rgba(15,23,42,0.45); }
`;

const SeeAllBtn = styled.button`
  padding: 12px 24px;
  background: transparent;
  border: 1px solid rgba(79,142,247,0.4);
  border-radius: 8px;
  color: #4f8ef7;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover { background: rgba(79,142,247,0.1); }
`;

const ReviewsGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const ReviewCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(79,142,247,0.1);
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  animation: ${fadeUp} 0.6s ease both;
  animation-delay: ${p => p.$i * 0.1}s;
`;

const ReviewerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const ReviewerAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f8ef7, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  flex-shrink: 0;
`;

const ReviewerName = styled.p`
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
`;

const ReviewDate = styled.p`
  font-size: 12px;
  color: rgba(15,23,42,0.35);
`;

const ReviewStars = styled.div`
  display: flex;
  gap: 3px;
  margin-bottom: 10px;
`;

const ReviewText = styled.p`
  font-size: 14px;
  line-height: 1.7;
  color: rgba(15,23,42,0.65);
`;

/* ─── Footer ─────────────────────────────────────────────── */
const Footer = styled.footer`
  background: #ffffff;
  padding: 40px 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(79,142,247,0.08);
  flex-wrap: wrap;
  gap: 16px;

  @media (max-width: 768px) { padding: 32px 24px; flex-direction: column; text-align: center; }
`;

const FooterLogo = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: #4f8ef7;
  letter-spacing: 2px;
`;

const FooterText = styled.p`
  font-size: 13px;
  color: rgba(15,23,42,0.25);
`;

/* ─── Stars helper ───────────────────────────────────────── */
function Stars({ rating, size = 16 }) {
  return (
    <span style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(n => {
        if (rating >= n) return <FaStar key={n} size={size} color="#4f8ef7" />;
        if (rating >= n - 0.5) return <FaStarHalfAlt key={n} size={size} color="#4f8ef7" />;
        return <FaRegStar key={n} size={size} color="#4f8ef7" />;
      })}
    </span>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [providers, setProviders] = useState([]);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    api.get('/providers').then(res => setProviders(res.data)).catch(() => {});
  }, []);

  function handleBook(barberName) {
    const apiProvider = providers.find(p =>
      p.name.toLowerCase().includes(barberName.toLowerCase())
    );
    const url = apiProvider ? `/book?barber=${apiProvider.id}` : '/book';
    navigate(url);
  }

  const barbers = BARBERS_INFO.default.map((b, i) => ({
    ...b,
    apiId: providers[i]?.id,
  }));

  return (
    <>
      <GlobalStyle />
      {showReviews && (
        <ReviewsModal reviews={REVIEWS} onClose={() => setShowReviews(false)} />
      )}

      {/* NAV */}
      <Nav $scrolled={scrolled}>
        <div />
        <NavActions>
          <NavBtn $scrolled={scrolled} onClick={() => navigate('/login')}>
            <FiLogIn size={16} />
            <span>Iniciar sesión</span>
          </NavBtn>
          <NavBtn $primary $scrolled={scrolled} onClick={() => navigate('/register')}>
            <span>Crear cuenta</span>
          </NavBtn>
        </NavActions>
      </Nav>

      {/* HERO */}
      <Hero>
        <HeroBg $src={SHOP.heroImage} />
        <HeroContent>
          <HeroBadge>Pasto, Nariño · Colombia</HeroBadge>
          <HeroTitle>Troya Barber<br />Studio</HeroTitle>
          <HeroSub>{SHOP.tagline}</HeroSub>
          <HeroRating>
            <div className="stars">
              <Stars rating={SHOP.rating} size={18} />
            </div>
            <strong style={{ color: '#ffffff', fontSize: 18 }}>{SHOP.rating}</strong>
            <button
              className="count"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', fontSize: 14, textDecoration: 'underline' }}
              onClick={() => setShowReviews(true)}
            >
              {SHOP.reviewCount} reseñas
            </button>
          </HeroRating>
          <HeroCTA onClick={() => navigate('/book')}>
            Agendar cita <FiChevronRight size={20} />
          </HeroCTA>
        </HeroContent>
      </Hero>

      {/* INFO STRIP */}
      <InfoStrip>
        <InfoItem href={`https://maps.google.com/?q=${encodeURIComponent(SHOP.address)}`} target="_blank">
          <FiMapPin size={16} /> {SHOP.address}
        </InfoItem>
        <InfoItem href={`tel:${SHOP.phone}`}>
          <FiPhone size={16} /> {SHOP.phone}
        </InfoItem>
        <InfoItem href={`https://wa.me/${SHOP.whatsapp.replace(/\D/g, '')}`} target="_blank">
          <FaWhatsapp size={16} /> WhatsApp
        </InfoItem>
        <InfoItem>
          <FiClock size={16} /> Lun–Sáb: 9am – 7pm
        </InfoItem>
      </InfoStrip>

      {/* MAIN */}
      <Main>
        {/* LEFT */}
        <Left>
          <SectionLabel>Nuestra historia</SectionLabel>
          <SectionTitle>Más que una barbería,<br />una experiencia</SectionTitle>
          <SectionText>{SHOP.description}</SectionText>

          {/* MAP */}
          <SectionLabel>Encuéntranos</SectionLabel>
          <SectionTitle style={{ fontSize: 22, marginBottom: 16 }}>Nuestra ubicación</SectionTitle>
          <MapWrapper>
            <iframe
              src={SHOP.mapEmbed}
              title="Troya Barber Studio"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </MapWrapper>
          <MapAddress>
            <FiMapPin size={16} />
            <span>{SHOP.address}</span>
          </MapAddress>

          {/* PROFESSIONALS */}
          <div id="profesionales">
            <SectionLabel>El equipo</SectionLabel>
            <SectionTitle>Nuestros profesionales</SectionTitle>
            <BarbersGrid>
              {barbers.map(b => (
                <BarberCard key={b.name}>
                  <BarberPhoto $src={b.photo} />
                  <BarberInfo>
                    <BarberName>{b.name}</BarberName>
                    <BarberRole>{b.role}</BarberRole>
                    <BarberSpec>{b.specialty}</BarberSpec>
                    <BookBtn onClick={() => handleBook(b.name)}>
                      Agendar cita <FiChevronRight size={14} />
                    </BookBtn>
                  </BarberInfo>
                </BarberCard>
              ))}
            </BarbersGrid>
          </div>
        </Left>

        {/* RIGHT */}
        <Right>
          {/* HOURS */}
          <HoursCard>
            <HoursTitle><FiClock size={16} /> Horario de atención</HoursTitle>
            {SHOP.hours.map(h => (
              <HoursRow key={h.day} $closed={h.time === 'Cerrado'}>
                <span className="day">{h.day}</span>
                <span className="time">{h.time}</span>
              </HoursRow>
            ))}
          </HoursCard>

          {/* CONTACT */}
          <HoursCard>
            <HoursTitle><FiPhone size={16} /> Contacto</HoursTitle>
            <InfoItem href={`tel:${SHOP.phone}`} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <FiPhone size={14} /> {SHOP.phone}
            </InfoItem>
            <InfoItem
              href={`https://wa.me/${SHOP.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
            >
              <FaWhatsapp size={14} /> Escribir por WhatsApp
            </InfoItem>
            <InfoItem
              href={`https://instagram.com/troyabarberstudio`}
              target="_blank"
              style={{ display: 'flex', padding: '10px 0' }}
            >
              <FiInstagram size={14} /> {SHOP.instagram}
            </InfoItem>
          </HoursCard>

          {/* MINI REVIEWS */}
          <HoursCard>
            <HoursTitle><FiStar size={16} /> Reseñas destacadas</HoursTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 48, fontWeight: 700, color: '#4f8ef7', lineHeight: 1 }}>{SHOP.rating}</span>
              <div>
                <Stars rating={SHOP.rating} size={16} />
                <p style={{ fontSize: 12, color: 'rgba(15,23,42,0.35)', marginTop: 4 }}>{SHOP.reviewCount} reseñas</p>
              </div>
            </div>
            {REVIEWS.slice(0, 3).map(r => (
              <div key={r.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{r.name}</span>
                  <Stars rating={r.rating} size={11} />
                </div>
                <p style={{ fontSize: 13, color: 'rgba(15,23,42,0.5)', lineHeight: 1.6 }}>
                  {r.comment.length > 80 ? r.comment.slice(0, 80) + '...' : r.comment}
                </p>
              </div>
            ))}
            <SeeAllBtn style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowReviews(true)}>
              Ver todas las reseñas <FiChevronRight size={14} />
            </SeeAllBtn>
          </HoursCard>
        </Right>
      </Main>

      {/* REVIEWS SECTION */}
      <ReviewsSection>
        <ReviewsHeader>
          <div>
            <SectionLabel>Lo que dicen de nosotros</SectionLabel>
            <SectionTitle style={{ marginBottom: 8 }}>Reseñas de clientes</SectionTitle>
          </div>
          <RatingBig>
            <RatingNumber>{SHOP.rating}</RatingNumber>
            <RatingInfo>
              <div className="stars"><Stars rating={SHOP.rating} size={20} /></div>
              <p className="count">{SHOP.reviewCount} reseñas verificadas</p>
            </RatingInfo>
          </RatingBig>
          <SeeAllBtn onClick={() => setShowReviews(true)}>
            Ver todas <FiChevronRight size={14} />
          </SeeAllBtn>
        </ReviewsHeader>

        <ReviewsGrid>
          {REVIEWS.slice(0, 3).map((r, i) => (
            <ReviewCard key={r.id} $i={i}>
              <ReviewerRow>
                <ReviewerAvatar>{r.avatar}</ReviewerAvatar>
                <div>
                  <ReviewerName>{r.name}</ReviewerName>
                  <ReviewDate>{r.date}</ReviewDate>
                </div>
              </ReviewerRow>
              <ReviewStars><Stars rating={r.rating} size={14} /></ReviewStars>
              <ReviewText>{r.comment}</ReviewText>
            </ReviewCard>
          ))}
        </ReviewsGrid>
      </ReviewsSection>

      {/* FOOTER */}
      <Footer>
        <FooterLogo>TROYA BARBER STUDIO</FooterLogo>
        <FooterText>Cl 18 #49-75, Pasto, Nariño, Colombia</FooterText>
        <FooterText>© 2025 Troya Barber Studio. Todos los derechos reservados.</FooterText>
      </Footer>
    </>
  );
}
