// PriceHistoryTab.jsx — read-only версия для Zadel (график видим, кнопки замучены)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import CustomScrollbar from '../../CustomScrollbar';
import IconUp from '../../../assets/References/NomenclatureCreatePage/IconUp.svg';
import IconDown from '../../../assets/References/NomenclatureCreatePage/IconDown.svg';
import IconRavno from '../../../assets/References/NomenclatureCreatePage/IconRavno.svg';
import Button1 from '../../../assets/References/NomenclatureCreatePage/button1.svg';
import Button4 from '../../../assets/References/NomenclatureCreatePage/button4.svg';
import Button5 from '../../../assets/References/NomenclatureCreatePage/button5.svg';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTick = (props) => {
  const { x, y, payload, zoomDomain, extendedRange } = props;
  if (!payload || payload.value === undefined || payload.value === null) return null;
  const d = new Date(payload.value);
  const currentRange = zoomDomain ? (zoomDomain.end - zoomDomain.start) : extendedRange;
  let firstLine = '';
  let secondLine = '';
  if (currentRange < 3600000) {
    firstLine = d.toLocaleString('ru', { hour: '2-digit', minute: '2-digit' });
    secondLine = d.toLocaleString('ru', { day: '2-digit', month: '2-digit' });
  } else if (currentRange < 86400000) {
    firstLine = d.toLocaleString('ru', { hour: '2-digit', minute: '2-digit' });
    secondLine = d.toLocaleString('ru', { day: '2-digit', month: '2-digit' });
  } else if (currentRange < 604800000) {
    firstLine = d.toLocaleString('ru', { day: '2-digit', month: '2-digit' });
    secondLine = d.toLocaleString('ru', { hour: '2-digit', minute: '2-digit' });
  } else if (currentRange < 2592000000) {
    firstLine = d.toLocaleString('ru', { day: '2-digit', month: '2-digit' });
    secondLine = '';
  } else if (currentRange < 31536000000) {
    firstLine = d.toLocaleString('ru', { month: 'long' });
    secondLine = d.getFullYear().toString();
  } else {
    firstLine = d.toLocaleString('ru', { month: 'long' });
    secondLine = d.getFullYear().toString();
  }
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={12} textAnchor="middle" fill="#2D4059" fontFamily="Inter, sans-serif" fontSize={11}>{firstLine}</text>
      {secondLine && <text x={0} y={28} textAnchor="middle" fill="#2D4059" fontFamily="Inter, sans-serif" fontSize={11}>{secondLine}</text>}
    </g>
  );
};

const PriceHistoryTab = (props) => {
  const { prices } = props;
  const scrollContainerRef = useRef(null);
  const chartContainerRef = useRef(null);
  const [hasScroll, setHasScroll] = useState(false);
  const [zoomDomain, setZoomDomain] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(0);

  const sortedPrices = [...prices].sort((a, b) => {
    const dateA = new Date(a.priceDate).getTime();
    const dateB = new Date(b.priceDate).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return prices.indexOf(a) - prices.indexOf(b);
  });

  const chartData = [...prices]
    .sort((a, b) => new Date(a.priceDate).getTime() - new Date(b.priceDate).getTime())
    .map(p => ({ time: new Date(p.priceDate).getTime(), price: p.price, fullDate: p.priceDate }));

  const times = chartData.map(d => d.time);
  const dataMin = Math.min(...times);
  const dataMax = Math.max(...times);
  const totalRange = dataMax - dataMin || 1;
  const padding = totalRange * 0.1;
  const extendedMin = dataMin - padding;
  const extendedMax = dataMax + padding;
  const extendedRange = extendedMax - extendedMin;
  const prices_list = chartData.map(d => d.price);
  const minPrice = Math.min(...prices_list);
  const maxPrice = Math.max(...prices_list);
  const priceRange = maxPrice - minPrice || 1;
  const yDomainMin = Math.floor((minPrice - priceRange * 0.2) * 100) / 100;
  const yDomainMax = Math.ceil((maxPrice + priceRange * 0.2) * 100) / 100;

  useEffect(() => { setZoomDomain(null); }, [prices]);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) { setIsPanning(true); setPanStart(e.clientX); e.preventDefault(); }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    const deltaX = panStart - e.clientX;
    setPanStart(e.clientX);
    setZoomDomain(prev => {
      const currentDomain = prev || { start: extendedMin, end: extendedMax };
      const currentRange = currentDomain.end - currentDomain.start;
      const chartWidth = chartContainerRef.current?.offsetWidth || 530;
      const shift = (deltaX / chartWidth) * currentRange;
      const newStart = currentDomain.start + shift;
      const newEnd = currentDomain.end + shift;
      if (Math.abs(newEnd - newStart - extendedRange) < 1000 && Math.abs(newStart - extendedMin) < 1000) return null;
      return { start: newStart, end: newEnd };
    });
  }, [isPanning, panStart, extendedMin, extendedMax, extendedRange]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);
  useEffect(() => { if (!isPanning) return; const h = () => setIsPanning(false); window.addEventListener('mouseup', h); return () => window.removeEventListener('mouseup', h); }, [isPanning]);

  const handleDoubleClick = () => setZoomDomain(null);

  const generateTicks = () => {
    const currentDomain = zoomDomain || { start: extendedMin, end: extendedMax };
    const range = currentDomain.end - currentDomain.start;
    const tickCount = 6;
    const interval = range / (tickCount - 1);
    const ticks = [];
    for (let i = 0; i < tickCount; i++) ticks.push(currentDomain.start + interval * i);
    return ticks;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = new Date(payload[0].payload.time);
      return (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: '8px 12px', border: '1px solid #E5ECF5', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: '#2D4059' }}>{d.toLocaleString('ru', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          <br />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#666EFE' }}>{Number(payload[0].value).toFixed(2)} ₽</span>
        </div>
      );
    }
    return null;
  };

  const getDynamicsIcon = (change) => {
    if (change === null || change === 0) return <img src={IconRavno} alt="=" style={{ width: 22, height: 4 }} />;
    if (change > 0) return <img src={IconUp} alt="▲" style={{ width: 44, height: 15 }} />;
    return <img src={IconDown} alt="▼" style={{ width: 44, height: 15 }} />;
  };

  const blockStyle = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const mutedButtonStyle = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, opacity: 0.4 };
  const cs = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };
  const TABLE_WIDTH = 1054;
  const TABLE_HEIGHT = 464;
  const ROW_HEIGHT = 58;
  const HEADER_HEIGHT = 58;
  const VISIBLE_ROWS = 7;
  const COL_DATE = 50;
  const COL_DYNAMICS = 314;
  const COL_PRICE = 538;
  const COL_SUPPLIER = 802;

  const checkScroll = () => { const c = scrollContainerRef.current; if (c) setHasScroll(c.scrollHeight > c.clientHeight); };
  useEffect(() => { const t = setTimeout(checkScroll, 100); return () => clearTimeout(t); }, [sortedPrices]);
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

  const totalRows = Math.max(sortedPrices.length, VISIBLE_ROWS);
  const domainX = zoomDomain ? [zoomDomain.start, zoomDomain.end] : [extendedMin, extendedMax];
  const customTicks = generateTicks();

  return (
    <div style={cs}>
      <div style={{ ...blockStyle, width: 1740, height: 565, position: 'relative' }}>
        <div ref={chartContainerRef} style={{ position: 'absolute', bottom: 156, left: 50, width: 530, height: 280, cursor: isPanning ? 'grabbing' : 'grab', userSelect: 'none' }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onDoubleClick={handleDoubleClick}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 30 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#666EFE" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#666EFE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5ECF5" vertical={false} horizontal={true} strokeWidth={1} />
                <XAxis dataKey="time" type="number" domain={domainX} ticks={customTicks} tick={(p) => <CustomTick {...p} zoomDomain={zoomDomain} extendedRange={extendedRange} />} axisLine={{ stroke: '#E5ECF5', strokeWidth: 1 }} tickLine={false} allowDataOverflow={true} interval={0} height={55} />
                <YAxis hide domain={[yDomainMin, yDomainMax]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="price" stroke="#666EFE" strokeWidth={2} fill="url(#colorPrice)" fillOpacity={1} dot={{ r: 4, fill: '#666EFE', stroke: '#FFFFFF', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#666EFE', stroke: '#FFFFFF', strokeWidth: 2 }} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#9CA3AF' }}>Нет данных о ценах</span>
            </div>
          )}
        </div>

        <div style={{ position: 'absolute', top: 14, right: 40, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 8, paddingLeft: 0, justifyContent: 'flex-start' }}>
            <button style={mutedButtonStyle}><img src={Button1} alt="" style={{ width: 18, height: 18 }} /></button>
            <button style={mutedButtonStyle}><img src={Button4} alt="" style={{ width: 14, height: 14 }} /></button>
            <button style={mutedButtonStyle}><img src={Button5} alt="" style={{ width: 18, height: 18 }} /></button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', position: 'relative', paddingLeft: 0, paddingRight: 0, boxSizing: 'border-box' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_DATE }}>ДАТА</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_DYNAMICS }}>ДИНАМИКА</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_PRICE }}>ЦЕНА С НДС РУБ.</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_SUPPLIER }}>ПОСТАВЩИК</span>
              </div>
              <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div style={{ minWidth: TABLE_WIDTH }}>
                  {Array.from({ length: totalRows }).map((_, index) => {
                    const price = sortedPrices[index];
                    if (!price) return <div key={`empty-${index}`} style={{ height: ROW_HEIGHT, backgroundColor: '#FFFFFF', boxSizing: 'border-box', display: 'flex', alignItems: 'center', borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5' }} />;
                    const prev = sortedPrices[index + 1]?.price ?? null;
                    const change = prev !== null ? price.price - prev : null;
                    const isFirst = index === 0;
                    const isLast = index === sortedPrices.length - 1;
                    return (
                      <div key={price.uid} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', position: 'relative', boxSizing: 'border-box', borderTop: isFirst ? 'none' : '0.5px solid #E5ECF5', borderBottom: isLast ? 'none' : '0.5px solid #E5ECF5' }}>
                        <span style={{ position: 'absolute', left: COL_DATE, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: COL_DYNAMICS - COL_DATE - 20 }}>{formatDate(price.priceDate)}</span>
                        <span style={{ position: 'absolute', left: COL_DYNAMICS, display: 'flex', alignItems: 'center', width: COL_PRICE - COL_DYNAMICS - 20 }}>{getDynamicsIcon(change)}</span>
                        <span style={{ position: 'absolute', left: COL_PRICE, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: COL_SUPPLIER - COL_PRICE - 20 }}>{price.price.toFixed(2)} ₽</span>
                        <span style={{ position: 'absolute', left: COL_SUPPLIER, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: TABLE_WIDTH - COL_SUPPLIER - 40 }}>{price.supplierName || '-'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {hasScroll && <div style={{ width: 10, height: TABLE_HEIGHT, paddingTop: HEADER_HEIGHT }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} /></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceHistoryTab;