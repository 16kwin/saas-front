// components/AnalyticsPage/TkpPage.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { motion } from 'framer-motion';
import AxiosService from '../../services/AxiosService';
import ConstantInfo from '../../info/ConstantInfo';
import Icon8 from '../../assets/References/Icon8.svg';
import Icon9 from '../../assets/References/Icon9.svg';
import Icon1 from '../../assets/References/Icon1.svg';
import Icon2 from '../../assets/References/Icon2.svg';
import Icon3 from '../../assets/References/Icon3.svg';
import Icon2Row from '../../assets/ICON2.svg';

const ROW_HEIGHT = 58;
const HEADER_HEIGHT = 58;
const TABLE_WIDTH = 1720;
const TABLE_HEIGHT = 638;
const VISIBLE_ROWS = 10;

const COL_ICON = 30;
const COL_UID_TKP = 60;
const COL_UID_ORDER = 384;
const COL_NUMBER = 719;
const COL_CUSTOMER = 825;
const COL_COST = 1065;
const COL_DELIVERY = 1246;
const COL_INVOICE = 1412;
const COL_STATUS = 1589;

const getStatusLabel = (status) => {
  switch (status) {
    case 'active': return 'Активный';
    case 'processed': return 'В работе';
    case 'closed': return 'Закрыт';
    default: return status || '—';
  }
};

const getStatusColor = (status) => {
  if (status === 'closed') return '#2D4059';
  return '#666EFE';
};

const getStatusInvoiceLabel = (statusinvoice) => {
  switch (statusinvoice) {
    case 'unaccept': return 'Не принят';
    case 'accept': return 'Подтверждён';
    case 'inrealise': return 'В реализации';
    case 'paid': return 'Оплачен';
    case 'unpaid': return 'Не оплачен';
    case 'cancelcustomer': return 'Отменён заказчиком';
    case 'cancelprovider': return 'Отменён поставщиком';
    default: return 'Ожидает';
  }
};

const getStatusInvoiceColor = (statusinvoice) => {
  switch (statusinvoice) {
    case 'unaccept': return '#6B7280';
    case 'accept': return '#10B981';
    case 'inrealise': return '#666EFE';
    case 'paid': return '#F59E0B';
    case 'unpaid': return '#EF4444';
    case 'cancelcustomer': return '#FF3052';
    case 'cancelprovider': return '#FF3052';
    default: return '#6B7280';
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${dd}.${mm}.${yy}`;
  } catch {
    return dateStr;
  }
};

const getTkpNotificationTitle = (type) => {
  switch (type) {
    case 'tkp_accepted': return 'ТКП принят';
    case 'tkp_cancelled': return 'ТКП отклонён';
    default: return 'Статус ТКП обновлён';
  }
};

const getTkpNotificationColor = (type) => {
  switch (type) {
    case 'tkp_accepted': return '#10B981';
    case 'tkp_cancelled': return '#FF3052';
    default: return '#10B981';
  }
};

const TkpPage = () => {
  const navigate = useNavigate();
  const [activeTkpTab, setActiveTkpTab] = useState('active');
  const [tkpList, setTkpList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tkpNotification, setTkpNotification] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const tooltipTimerRef = useRef(null);
  const stompClientRef = useRef(null);

  const fetchTkpList = useCallback(async () => {
    setLoading(true);
    try {
      const url = activeTkpTab === 'active' 
        ? `${ConstantInfo.apiBaseUrl}/api/tkp/outgoing` 
        : `${ConstantInfo.apiBaseUrl}/api/tkp/closed`;
      const res = await AxiosService.get(url);
      setTkpList(res.data || []);
    } catch (e) {
      console.error('Ошибка загрузки ТКП:', e);
      setTkpList([]);
    } finally {
      setLoading(false);
    }
  }, [activeTkpTab]);

  useEffect(() => {
    fetchTkpList();
  }, [fetchTkpList]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${ConstantInfo.apiBaseUrl}/ws-orders`),
      onConnect: () => {
        client.subscribe('/topic/tkp/accepted', (message) => {
          const data = JSON.parse(message.body);
          setTkpNotification({ ...data, type: 'tkp_accepted' });
          fetchTkpList();
        });
        client.subscribe('/topic/tkp/cancelled', (message) => {
          const data = JSON.parse(message.body);
          setTkpNotification({ ...data, type: 'tkp_cancelled' });
          fetchTkpList();
        });
        client.subscribe('/topic/tkp/status', () => {
          fetchTkpList();
        });
        client.subscribe('/topic/orders/refresh', () => {
          fetchTkpList();
        });
        client.subscribe('/topic/tkp/new', () => {
          fetchTkpList();
        });
      },
      onDisconnect: () => {},
      onStompError: () => {}
    });

    client.activate();
    stompClientRef.current = client;

    return () => { client.deactivate(); };
  }, [fetchTkpList]);

  useEffect(() => {
    if (!tooltip) return;
    const handleMove = () => setTooltip(null);
    const timer = setTimeout(handleMove, 3000);
    window.addEventListener('scroll', handleMove, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleMove, true);
    };
  }, [tooltip]);

  const handleViewTkp = (tkpUid) => {
    navigate(`/tkp/${tkpUid}`);
  };

  const handleViewOrder = (e, orderUid) => {
    e.stopPropagation();
    if (orderUid) navigate(`/orders/${orderUid}`);
  };

  const handleViewTkpNotification = () => {
    if (tkpNotification.tkp_uid) handleViewTkp(tkpNotification.tkp_uid);
    setTkpNotification(null);
  };

  const handleCellMouseEnter = (e, text) => {
    const el = e.currentTarget;
    if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
      const rect = el.getBoundingClientRect();
      tooltipTimerRef.current = setTimeout(() => {
        setTooltip({
          text,
          x: rect.left + rect.width / 2,
          y: rect.bottom + 4,
        });
      }, 500);
    }
  };

  const handleCellMouseLeave = () => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
    setTooltip(null);
  };

  const emptyRows = Math.max(0, VISIBLE_ROWS - tkpList.length);

  const mutedButtonStyle = {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF',
    border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'default',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, opacity: 0.4
  };

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC' }}>
      {/* Заголовок */}
      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '30px', height: 30 }}>Технико-коммерческие предложения (ТКП)</h1>
      </div>

      {/* Верхняя панель */}
      <div style={{ position: 'absolute', top: 100, left: 60, right: 60, height: 40, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 15 }}>
          <button style={mutedButtonStyle}><img src={Icon1} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={mutedButtonStyle}><img src={Icon2} alt="" style={{ width: 20, height: 14 }} /></button>
          <button style={mutedButtonStyle}><img src={Icon3} alt="" style={{ width: 18, height: 18 }} /></button>
        </div>

        <div style={{ marginLeft: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 45, cursor: 'pointer', userSelect: 'none', position: 'relative' }}>
            <div onClick={() => setActiveTkpTab('active')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', paddingBottom: 7 }}>
              <span style={{
                fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600,
                color: activeTkpTab === 'active' ? '#666EFE' : 'rgba(45, 64, 89, 0.6)',
                lineHeight: '18px', transition: 'color 0.3s ease'
              }}>Активные</span>
              <motion.div
                initial={false}
                animate={{ scaleX: activeTkpTab === 'active' ? 1 : 0, opacity: activeTkpTab === 'active' ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                style={{ width: 89, height: 3, borderRadius: 3, backgroundColor: '#666EFE', position: 'absolute', bottom: 0, transformOrigin: 'center' }}
              />
            </div>
            <div onClick={() => setActiveTkpTab('closed')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', paddingBottom: 7 }}>
              <span style={{
                fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600,
                color: activeTkpTab === 'closed' ? '#666EFE' : 'rgba(45, 64, 89, 0.6)',
                lineHeight: '18px', transition: 'color 0.3s ease'
              }}>Закрытые</span>
              <motion.div
                initial={false}
                animate={{ scaleX: activeTkpTab === 'closed' ? 1 : 0, opacity: activeTkpTab === 'closed' ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                style={{ width: 89, height: 3, borderRadius: 3, backgroundColor: '#666EFE', position: 'absolute', bottom: 0, transformOrigin: 'center' }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 15 }}>
          <button style={mutedButtonStyle}><img src={Icon8} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={mutedButtonStyle}><img src={Icon9} alt="" style={{ width: 14, height: 18 }} /></button>
        </div>
      </div>

      {/* Таблица */}
      <div style={{ position: 'absolute', top: 162, left: 40 }}>
        <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', position: 'relative', paddingRight: 40, boxSizing: 'border-box' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_UID_TKP }}>UID ТКП</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_UID_ORDER }}>UID ЗАКАЗА</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_NUMBER }}>НОМЕР</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_CUSTOMER }}>ЗАКАЗЧИК</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_COST }}>СТОИМОСТЬ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_DELIVERY }}>ПОСТАВКА</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_INVOICE }}>ИНВОЙС</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_STATUS }}>СТАТУС</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div style={{ minWidth: TABLE_WIDTH - 40 }}>
              {loading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#9CA3AF' }}>Загрузка...</span>
                </div>
              ) : (
                <>
                  {tkpList.map((item, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === tkpList.length - 1;
                    const tkpUidText = item.tkp_uid || '—';
                    const orderUidText = item.order_uid || '—';
                    const numberText = item.tkp_number || item.order_number || '—';
                    const customerText = item.customer_id || '—';
                    const costText = item.total_cost ? `${Number(item.total_cost).toLocaleString()} ₽` : '—';
                    const deliveryText = formatDateTime(item.delivery_date);
                    const invoiceText = getStatusInvoiceLabel(item.statusinvoice);
                    const invoiceColor = getStatusInvoiceColor(item.statusinvoice);
                    const statusText = getStatusLabel(item.status);
                    const statusColor = getStatusColor(item.status);

                    return (
                      <div key={item.tkp_uid || idx} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', position: 'relative', cursor: 'pointer', boxSizing: 'border-box', borderTop: isFirst ? 'none' : '0.5px solid #E5ECF5', borderBottom: isLast ? 'none' : '0.5px solid #E5ECF5' }}
                        onDoubleClick={() => handleViewTkp(item.tkp_uid)}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8F9FC'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                        <img src={Icon2Row} alt="" style={{ position: 'absolute', left: COL_ICON, width: 18, height: 22 }} />
                        <span
                          onMouseEnter={(e) => handleCellMouseEnter(e, tkpUidText)}
                          onMouseLeave={handleCellMouseLeave}
                          style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_UID_TKP, maxWidth: 274, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >{tkpUidText}</span>
                        <span
                          onClick={(e) => handleViewOrder(e, item.order_uid)}
                          style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#666EFE', position: 'absolute', left: COL_UID_ORDER, maxWidth: COL_NUMBER - COL_UID_ORDER - 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: 'underline' }}
                        >{orderUidText}</span>
                        <span
                          onMouseEnter={(e) => handleCellMouseEnter(e, numberText)}
                          onMouseLeave={handleCellMouseLeave}
                          style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_NUMBER, maxWidth: COL_CUSTOMER - COL_NUMBER - 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >{numberText}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_CUSTOMER, maxWidth: COL_COST - COL_CUSTOMER - 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customerText}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059', position: 'absolute', left: COL_COST }}>{costText}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_DELIVERY }}>{deliveryText}</span>
                        <span
                          onMouseEnter={(e) => handleCellMouseEnter(e, invoiceText)}
                          onMouseLeave={handleCellMouseLeave}
                          style={{
                            fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: invoiceColor,
                            position: 'absolute', left: COL_INVOICE,
                            maxWidth: 130,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '20px',
                            maxHeight: 40,
                          }}
                        >{invoiceText}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: statusColor, position: 'absolute', left: COL_STATUS }}>{statusText}</span>
                      </div>
                    );
                  })}
                  {Array.from({ length: emptyRows }).map((_, i) => (
                    <div key={`empty-${i}`} style={{ height: ROW_HEIGHT, backgroundColor: '#FFFFFF', borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5' }} />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Тултип */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translateX(-50%)',
          backgroundColor: '#2D4059',
          color: '#FFFFFF',
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          fontWeight: 500,
          padding: '6px 12px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          {tooltip.text}
        </div>
      )}

      {/* Уведомления */}
      {tkpNotification && (
        <div style={{ position: 'fixed', top: 20, right: 20, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 10000, border: `1px solid ${getTkpNotificationColor(tkpNotification.type)}`, minWidth: 350 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: getTkpNotificationColor(tkpNotification.type), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#FFFFFF', fontSize: 20 }}>{tkpNotification.type === 'tkp_accepted' ? '✓' : '✕'}</span>
            </div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, color: '#2D4059' }}>{getTkpNotificationTitle(tkpNotification.type)}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280' }}>{tkpNotification.tkp_uid?.slice(0, 8)}</div>
            </div>
          </div>
          {tkpNotification.order_uid && <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#2D4059', marginBottom: 16 }}>Заказ: {tkpNotification.order_uid?.slice(0, 8)}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleViewTkpNotification} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', backgroundColor: getTkpNotificationColor(tkpNotification.type), color: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500 }}>Посмотреть</button>
            <button onClick={() => setTkpNotification(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', color: '#2D4059', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500 }}>Позже</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TkpPage;