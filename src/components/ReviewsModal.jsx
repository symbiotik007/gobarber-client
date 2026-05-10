import styled, { keyframes } from 'styled-components';
import { FiX } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { useEffect } from 'react';

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(40px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 8, 16, 0.85);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fadeIn} 0.25s ease;
`;

const Modal = styled.div`
  background: #1e1b28;
  border-radius: 20px;
  width: 100%;
  max-width: 640px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 144, 0, 0.15);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6);
  animation: ${slideUp} 0.3s ease;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 28px 28px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-shrink: 0;
`;

const HeaderLeft = styled.div``;

const ModalTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #f4ede8;
  margin-bottom: 8px;
`;

const RatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  .score { font-size: 32px; font-weight: 700; color: #ff9000; line-height: 1; }
  .count { font-size: 13px; color: rgba(244,237,232,0.4); }
`;

const CloseBtn = styled.button`
  background: rgba(255, 255, 255, 0.06);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(244,237,232,0.6);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 144, 0, 0.15);
    color: #ff9000;
  }
`;

const RatingBars = styled.div`
  padding: 16px 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
`;

const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: rgba(244,237,232,0.5);
`;

const Bar = styled.div`
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.08);
  border-radius: 3px;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${p => p.$pct}%;
    background: linear-gradient(90deg, #ff9000, #ffb347);
    border-radius: 3px;
    transition: width 0.6s ease;
  }
`;

const ScrollArea = styled.div`
  overflow-y: auto;
  padding: 20px 28px 28px;
  flex: 1;

  scrollbar-width: thin;
  scrollbar-color: rgba(255,144,0,0.3) transparent;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(255,144,0,0.3); border-radius: 2px; }
`;

const ReviewItem = styled.div`
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child { border-bottom: none; }
`;

const ReviewerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
`;

const Avatar = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff9000, #c87000);
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
  color: rgba(244,237,232,0.35);
`;

const StarsRow = styled.div`
  display: flex;
  gap: 3px;
  margin-bottom: 8px;
`;

const ReviewText = styled.p`
  font-size: 14px;
  line-height: 1.75;
  color: rgba(244,237,232,0.65);
`;

function Stars({ rating, size = 14 }) {
  return (
    <StarsRow>
      {[1, 2, 3, 4, 5].map(n => {
        if (rating >= n) return <FaStar key={n} size={size} color="#ff9000" />;
        if (rating >= n - 0.5) return <FaStarHalfAlt key={n} size={size} color="#ff9000" />;
        return <FaRegStar key={n} size={size} color="#ff9000" />;
      })}
    </StarsRow>
  );
}

function getRatingDist(reviews) {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { dist[r.rating] = (dist[r.rating] || 0) + 1; });
  return dist;
}

export default function ReviewsModal({ reviews, onClose }) {
  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  const dist = getRatingDist(reviews);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <Overlay onClick={e => e.target === e.currentTarget && onClose()}>
      <Modal>
        <ModalHeader>
          <HeaderLeft>
            <ModalTitle>Reseñas de clientes</ModalTitle>
            <RatingRow>
              <span className="score">{avg}</span>
              <div>
                <Stars rating={parseFloat(avg)} size={16} />
                <p className="count">{reviews.length} reseñas</p>
              </div>
            </RatingRow>
          </HeaderLeft>
          <CloseBtn onClick={onClose}><FiX size={18} /></CloseBtn>
        </ModalHeader>

        <RatingBars>
          {[5, 4, 3, 2, 1].map(star => (
            <BarRow key={star}>
              <span>{star}★</span>
              <Bar $pct={(dist[star] / reviews.length) * 100} />
              <span>{dist[star]}</span>
            </BarRow>
          ))}
        </RatingBars>

        <ScrollArea>
          {reviews.map(r => (
            <ReviewItem key={r.id}>
              <ReviewerRow>
                <Avatar>{r.avatar}</Avatar>
                <div>
                  <ReviewerName>{r.name}</ReviewerName>
                  <ReviewDate>{r.date}</ReviewDate>
                </div>
              </ReviewerRow>
              <Stars rating={r.rating} />
              <ReviewText>{r.comment}</ReviewText>
            </ReviewItem>
          ))}
        </ScrollArea>
      </Modal>
    </Overlay>
  );
}
