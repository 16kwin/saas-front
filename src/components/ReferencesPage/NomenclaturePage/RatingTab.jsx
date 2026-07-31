// RatingTab.jsx — read-only версия для Zadel
import React, { useState, useRef, useEffect } from 'react';
import CustomScrollbar from '../../CustomScrollbar';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import OtzivIcon from '../../../assets/References/NomenclatureCreatePage/Otziv.svg';
import Button1 from '../../../assets/References/NomenclatureCreatePage/button1.svg';
import Button4 from '../../../assets/References/NomenclatureCreatePage/button4.svg';
import Button5 from '../../../assets/References/NomenclatureCreatePage/button5.svg';

const StarRatingSmall = ({ value, size = 18 }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fillPercent = Math.min(100, Math.max(0, (value - i + 1) * 100));
    stars.push(
      <div key={i} style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', top: 0, left: 0 }}>
          <path d="M10 1L12.39 6.53L18.18 7.27L13.92 11.37L15.09 17.23L10 14.25L4.91 17.23L6.08 11.37L1.82 7.27L7.61 6.53L10 1Z" fill="#DBDBDB" stroke="#DBDBDB" strokeWidth="1"/>
        </svg>
        {fillPercent > 0 && (
          <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', top: 0, left: 0, clipPath: `inset(0 ${100 - fillPercent}% 0 0)` }}>
            <path d="M10 1L12.39 6.53L18.18 7.27L13.92 11.37L15.09 17.23L10 14.25L4.91 17.23L6.08 11.37L1.82 7.27L7.61 6.53L10 1Z" fill="#666EFE" stroke="#666EFE" strokeWidth="1"/>
          </svg>
        )}
      </div>
    );
  }
  return <div style={{ display: 'flex', gap: 8 }}>{stars}</div>;
};

const RatingTab = (props) => {
  const { uid, isEdit } = props;
  const scrollContainerRef = useRef(null);
  const [hasScroll, setHasScroll] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [viewComment, setViewComment] = useState('');
  const [viewAuthor, setViewAuthor] = useState('');

  const blockStyle = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const mutedButtonStyle = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, opacity: 0.4 };
  const cs = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };
  const TABLE_WIDTH = 1660;
  const TABLE_HEIGHT = 464;
  const ROW_HEIGHT = 58;
  const HEADER_HEIGHT = 58;
  const VISIBLE_ROWS = 7;
  const COL_DATE = 50;
  const COL_NAME = 290;
  const COL_RATING = 763;
  const COL_AUTHOR = 1155;

  const fetchRatings = async () => {
    if (!uid) return;
    setIsLoading(true);
    try {
      const [ratingsRes, avgRes] = await Promise.all([
        AxiosService.get(ConstantInfo.restApiNomenclatureRatings(uid)),
        AxiosService.get(ConstantInfo.restApiNomenclatureRatingsAverage(uid)),
      ]);
      setRatings(ratingsRes.data || []);
      setAverageRating(Math.round((avgRes.data || 0) * 10) / 10);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { if (uid && isEdit) fetchRatings(); }, [uid, isEdit]);

  const checkScroll = () => { const c = scrollContainerRef.current; if (c) setHasScroll(c.scrollHeight > c.clientHeight); };
  useEffect(() => { const t = setTimeout(checkScroll, 100); return () => clearTimeout(t); }, [ratings]);
  useEffect(() => {
    const c = scrollContainerRef.current; if (!c) return;
    checkScroll(); c.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll); ro.observe(c);
    return () => { c.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try { const d = new Date(dateStr); return d.toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
    catch { return dateStr; }
  };

  const getRatingStatus = (avg) => {
    if (avg === 0) return 'Новый товар или рейтинг отсутствует';
    if (avg <= 2) return 'Товар низкого качества';
    if (avg <= 4) return 'Товар среднего качества';
    return 'Товар высокого качества';
  };

  const totalRows = Math.max(ratings.length, VISIBLE_ROWS);

  return (
    <div style={{ ...cs, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ ...blockStyle, width: 1740, height: 72, flexShrink: 0, display: 'flex', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 40, display: 'flex', alignItems: 'center', gap: 18 }}>
          <StarRatingSmall value={averageRating} size={18} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059' }}>Средний рейтинг: {averageRating.toFixed(1)}</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#666EFE', marginLeft: 42 }}>{getRatingStatus(averageRating)}</span>
        </div>
      </div>

      <div style={{ ...blockStyle, width: 1740, height: 477, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 14, left: 40, display: 'flex', gap: 15 }}>
          <button style={mutedButtonStyle}><img src={Button1} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={mutedButtonStyle}><img src={Button4} alt="" style={{ width: 14, height: 14 }} /></button>
          <button style={mutedButtonStyle}><img src={Button5} alt="" style={{ width: 18, height: 18 }} /></button>
        </div>

        <div style={{ position: 'absolute', top: 68, left: 40, display: 'flex', gap: 10 }}>
          <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', position: 'relative', paddingLeft: 0, paddingRight: 0, boxSizing: 'border-box' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_DATE }}>ДАТА И ВРЕМЯ</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_NAME }}>НАИМЕНОВАНИЕ</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_RATING }}>РЕЙТИНГ</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_AUTHOR }}>АВТОР</span>
            </div>
            <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div style={{ minWidth: TABLE_WIDTH }}>
                {isLoading ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Загрузка...</span></div>
                ) : (
                  <>
                    {Array.from({ length: totalRows }).map((_, index) => {
                      const rating = ratings[index];
                      if (!rating) return <div key={`empty-${index}`} style={{ height: ROW_HEIGHT, backgroundColor: '#FFFFFF', boxSizing: 'border-box', display: 'flex', alignItems: 'center', borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5' }} />;
                      const isFirst = index === 0;
                      const isLast = index === ratings.length - 1;
                      return (
                        <div key={rating.uid} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', position: 'relative', boxSizing: 'border-box', borderTop: isFirst ? 'none' : '0.5px solid #E5ECF5', borderBottom: isLast ? 'none' : '0.5px solid #E5ECF5' }}>
                          <span style={{ position: 'absolute', left: COL_DATE, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: COL_NAME - COL_DATE - 20 }}>{formatDate(rating.createdAt)}</span>
                          <div onClick={() => { setViewComment(rating.comment); setViewAuthor(rating.author); setShowViewPopup(true); }} style={{ position: 'absolute', left: COL_NAME, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                            <img src={OtzivIcon} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
                            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#666EFE', textDecoration: 'underline' }}>Отзыв</span>
                          </div>
                          <div style={{ position: 'absolute', left: COL_RATING }}><StarRatingSmall value={rating.rating} size={18} /></div>
                          <span style={{ position: 'absolute', left: COL_AUTHOR, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: TABLE_WIDTH - COL_AUTHOR - 40 }}>{rating.author || '-'}</span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
          {hasScroll && <div style={{ width: 10, height: TABLE_HEIGHT, paddingTop: HEADER_HEIGHT }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} /></div>}
        </div>
      </div>

      {showViewPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowViewPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Отзыв</h3>
            {viewAuthor && <div><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Автор: </span><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>{viewAuthor}</span></div>}
            <div><p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', margin: 0, lineHeight: '1.5' }}>{viewComment || 'Без текста'}</p></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><button onClick={() => setShowViewPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Закрыть</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingTab;