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
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1600&q=80',
  logo: 'https://ui-avatars.com/api/?name=T&background=ff9000&color=1a1720&size=120&font-size=0.6&bold=true',
  mapEmbed:
    'https://maps.google.com/maps?q=Calle+18+%2349-75,+Pasto,+Narino,+Colombia&hl=es&z=16&output=embed',
};

const BARBERS_INFO = {
  default: [
    {
      name: 'Jhayser',
      role: 'Fundador & Master Barber',
      specialty: 'Cortes clásicos · Diseño de barba',
      exp: '8 años de experiencia',
      photo: 'https://images.unsplash.com/photo-1618077360395-f3068be8e001?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Fernando',
      role: 'Senior Barber',
      specialty: 'Cortes modernos · Tratamientos',
      exp: '5 años de experiencia',
      photo: 'https://images.unsplash.com/photo-1595152772835-219674b2a163?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Sebastián',
      role: 'Barber & Colorista',
      specialty: 'Color · Degradados · Diseño',
      exp: '4 años de experiencia',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Camilo',
      role: 'Barber',
      specialty: 'Cortes urbanos · Afro',
      exp: '3 años de experiencia',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
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
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 40px;
  background: ${p => p.$scrolled ? 'rgba(18,15,24,0.97)' : 'transparent'};
  backdrop-filter: ${p => p.$scrolled ? 'blur(12px)' : 'none'};
  border-bottom: ${p => p.$scrolled ? '1px solid rgba(255,144,0,0.1)' : 'none'};
  transition: all 0.3s ease;

  @media (max-width: 600px) { padding: 16px 20px; }
`;

const NavLogo = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #ff9000;
  letter-spacing: 2px;
  text-transform: uppercase;
`;

const NavActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const NavBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: ${p => p.$primary ? '#ff9000' : 'transparent'};
  color: ${p => p.$primary ? '#1a1720' : '#f4ede8'};
  border: 1px solid ${p => p.$primary ? '#ff9000' : 'rgba(244,237,232,0.3)'};
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${p => p.$primary ? '700' : '400'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${p => p.$primary ? '#e08000' : 'rgba(255,144,0,0.1)'};
    border-color: #ff9000;
    color: ${p => p.$primary ? '#1a1720' : '#ff9000'};
  }

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
  background-position: center;
  transform: scale(1.05);
  transition: transform 8s ease;

  ${Hero}:hover & { transform: scale(1.08); }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(18,15,24,0.2) 0%,
      rgba(18,15,24,0.5) 50%,
      rgba(18,15,24,0.95) 100%
    );
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  padding: 0 60px 80px;
  max-width: 700px;
  animation: ${fadeUp} 0.8s ease both;

  @media (max-width: 768px) { padding: 0 24px 60px; }
`;

const HeroBadge = styled.span`
  display: inline-block;
  padding: 6px 14px;
  background: rgba(255,144,0,0.15);
  border: 1px solid rgba(255,144,0,0.4);
  border-radius: 20px;
  font-size: 12px;
  color: #ff9000;
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
  color: rgba(244,237,232,0.75);
  margin-bottom: 36px;
  line-height: 1.6;
  max-width: 500px;
`;

const HeroRating = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;

  .stars { display: flex; gap: 3px; }
  .count { color: rgba(244,237,232,0.6); font-size: 14px; }
`;

const HeroCTA = styled.button`
  padding: 16px 36px;
  background: linear-gradient(135deg, #ff9000, #ffb347);
  color: #1a1720;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 32px rgba(255,144,0,0.35);
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(255,144,0,0.5);
  }
`;

/* ─── Info Strip ─────────────────────────────────────────── */
const InfoStrip = styled.div`
  background: #1e1b28;
  border-bottom: 1px solid rgba(255,144,0,0.1);
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
  color: rgba(244,237,232,0.7);
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s;
  cursor: pointer;

  svg { color: #ff9000; flex-shrink: 0; }

  &:hover { color: #ff9000; }
`;

/* ─── Main Layout ────────────────────────────────────────── */
const Main = styled.main`
  background: #120f18;
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
  color: #ff9000;
  margin-bottom: 8px;
`;

const SectionTitle = styled.h2`
  font-size: 32px;
  font-weight: 700;
  color: #f4ede8;
  margin-bottom: 20px;
  line-height: 1.2;
`;

const SectionText = styled.p`
  font-size: 16px;
  line-height: 1.8;
  color: rgba(244,237,232,0.65);
  margin-bottom: 40px;
`;

/* ─── Map ────────────────────────────────────────────────── */
const MapWrapper = styled.div`
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255,144,0,0.15);
  margin-bottom: 32px;
  height: 280px;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
    filter: invert(90%) hue-rotate(180deg);
  }
`;

const MapAddress = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: #1e1b28;
  border-radius: 10px;
  font-size: 14px;
  color: rgba(244,237,232,0.8);
  border: 1px solid rgba(255,144,0,0.1);
  margin-bottom: 32px;

  svg { color: #ff9000; margin-top: 2px; flex-shrink: 0; }
`;

/* ─── Hours ──────────────────────────────────────────────── */
const HoursCard = styled.div`
  background: #1e1b28;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255,144,0,0.1);
  margin-bottom: 32px;
`;

const HoursTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: #f4ede8;
  margin-bottom: 16px;
  svg { color: #ff9000; }
`;

const HoursRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  font-size: 14px;

  &:last-child { border-bottom: none; }

  .day { color: rgba(244,237,232,0.6); }
  .time { color: ${p => p.$closed ? 'rgba(244,237,232,0.3)' : '#f4ede8'}; font-weight: 500; }
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
  background: #1e1b28;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255,144,0,0.08);
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    border-color: rgba(255,144,0,0.4);
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.4);
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
    background: linear-gradient(transparent, #1e1b28);
  }
`;

const BarberInfo = styled.div`
  padding: 16px;
`;

const BarberName = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #f4ede8;
  margin-bottom: 2px;
`;

const BarberRole = styled.p`
  font-size: 12px;
  color: #ff9000;
  margin-bottom: 6px;
`;

const BarberSpec = styled.p`
  font-size: 12px;
  color: rgba(244,237,232,0.5);
  margin-bottom: 12px;
`;

const BookBtn = styled.button`
  width: 100%;
  padding: 10px;
  background: rgba(255,144,0,0.1);
  border: 1px solid rgba(255,144,0,0.3);
  border-radius: 8px;
  color: #ff9000;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    background: #ff9000;
    color: #1a1720;
    border-color: #ff9000;
  }
`;

/* ─── Reviews ────────────────────────────────────────────── */
const ReviewsSection = styled.section`
  background: #120f18;
  padding: 80px 60px;
  border-top: 1px solid rgba(255,144,0,0.08);

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
  color: #ff9000;
  line-height: 1;
`;

const RatingInfo = styled.div`
  .stars { display: flex; gap: 4px; margin-bottom: 4px; }
  .count { font-size: 14px; color: rgba(244,237,232,0.5); }
`;

const SeeAllBtn = styled.button`
  padding: 12px 24px;
  background: transparent;
  border: 1px solid rgba(255,144,0,0.4);
  border-radius: 8px;
  color: #ff9000;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover { background: rgba(255,144,0,0.1); }
`;

const ReviewsGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const ReviewCard = styled.div`
  background: #1e1b28;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255,255,255,0.05);
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
  background: linear-gradient(135deg, #ff9000, #e08000);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #1a1720;
  flex-shrink: 0;
`;

const ReviewerName = styled.p`
  font-size: 15px;
  font-weight: 600;
  color: #f4ede8;
`;

const ReviewDate = styled.p`
  font-size: 12px;
  color: rgba(244,237,232,0.4);
`;

const ReviewStars = styled.div`
  display: flex;
  gap: 3px;
  margin-bottom: 10px;
`;

const ReviewText = styled.p`
  font-size: 14px;
  line-height: 1.7;
  color: rgba(244,237,232,0.65);
`;

/* ─── Footer ─────────────────────────────────────────────── */
const Footer = styled.footer`
  background: #0d0b12;
  padding: 40px 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255,144,0,0.08);
  flex-wrap: wrap;
  gap: 16px;

  @media (max-width: 768px) { padding: 32px 24px; flex-direction: column; text-align: center; }
`;

const FooterLogo = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: #ff9000;
  letter-spacing: 2px;
`;

const FooterText = styled.p`
  font-size: 13px;
  color: rgba(244,237,232,0.3);
`;

/* ─── Stars helper ───────────────────────────────────────── */
function Stars({ rating, size = 16 }) {
  return (
    <span style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(n => {
        if (rating >= n) return <FaStar key={n} size={size} color="#ff9000" />;
        if (rating >= n - 0.5) return <FaStarHalfAlt key={n} size={size} color="#ff9000" />;
        return <FaRegStar key={n} size={size} color="#ff9000" />;
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
      {showReviews && (
        <ReviewsModal reviews={REVIEWS} onClose={() => setShowReviews(false)} />
      )}

      {/* NAV */}
      <Nav $scrolled={scrolled}>
        <NavLogo>Troya</NavLogo>
        <NavActions>
          <NavBtn onClick={() => navigate('/login')}>
            <FiLogIn size={16} />
            <span>Iniciar sesión</span>
          </NavBtn>
          <NavBtn $primary onClick={() => navigate('/register')}>
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
            <strong style={{ color: '#ff9000', fontSize: 18 }}>{SHOP.rating}</strong>
            <button
              className="count"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(244,237,232,0.6)', fontSize: 14, textDecoration: 'underline' }}
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
            <InfoItem href={`tel:${SHOP.phone}`} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <FiPhone size={14} /> {SHOP.phone}
            </InfoItem>
            <InfoItem
              href={`https://wa.me/${SHOP.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 48, fontWeight: 700, color: '#ff9000', lineHeight: 1 }}>{SHOP.rating}</span>
              <div>
                <Stars rating={SHOP.rating} size={16} />
                <p style={{ fontSize: 12, color: 'rgba(244,237,232,0.4)', marginTop: 4 }}>{SHOP.reviewCount} reseñas</p>
              </div>
            </div>
            {REVIEWS.slice(0, 3).map(r => (
              <div key={r.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#f4ede8' }}>{r.name}</span>
                  <Stars rating={r.rating} size={11} />
                </div>
                <p style={{ fontSize: 13, color: 'rgba(244,237,232,0.55)', lineHeight: 1.6 }}>
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
