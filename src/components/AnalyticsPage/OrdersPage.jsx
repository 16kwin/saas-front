// components/AnalyticsPage/OrdersPage.jsx
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
import Popup1 from '../../assets/References/popup1.svg';

const ROW_HEIGHT = 58;
const HEADER_HEIGHT = 58;
const TABLE_WIDTH = 1720;
const TABLE_HEIGHT = 638;
const VISIBLE_ROWS = 10;

const COL_ICON = 30;
const COL_UID = 62;
const COL_CUSTOMER = 482;
const COL_SOURCE = 682;
const COL_NUMBER = 913;
const COL_DATE = 1139;
const COL_STATUS = 1339;
const COL_STATE = 1495;

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

const getStateLabel = (item) => {
  const reason = item.statusreason;
  const track = item.statustrack;
  
  if (reason === 'cancelcustomer') return 'Отменён заказчиком';
  if (reason === 'cancelprovider') return 'Отменён поставщиком';
  if (reason === 'done') return 'Завершён';
  if (track === 'done') return 'Вручен';
  if (track === 'sent') return 'Отправлен получателю';
  if (track === 'courier') return 'У курьера';
  if (track === 'sorting') return 'Сортировка';
  if (track === 'warehouse') return 'Прибыл на склад';
  if (track === 'intransitinside') return 'Транзит на территории РФ';
  if (track === 'customs') return 'На таможне';
  if (track === 'intransitoutside') return 'Транзит за пределами РФ';
  if (reason === 'posttkpprovider') return 'ТКП направлено';
  if (reason === 'inworkprovider') return 'В работе';
  if (reason === 'inprocessing') return 'В обработке';
  if (track === 'inwork') return 'Принят в работу';
  if (track === 'notinwork') return 'Не в работе';
  
  return reason || track || '—';
};

const getStateColor = (item) => {
  const reason = item.statusreason;
  const track = item.statustrack;
  
  if (reason === 'cancelcustomer' || reason === 'cancelprovider') return '#FF3052';
  if (reason === 'done' || track === 'done') return '#07E098';
  return '#2D4059';
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}.${mm}.${yy}-${hh}:${min}`;
  } catch {
    return dateStr;
  }
};

const getNotificationTitle = (type) => {
  switch (type) {
    case 'order_new': return 'Новый заказ!';
    case 'order_cancelled': return 'Заказ отменён';
    default: return 'Уведомление';
  }
};

const getNotificationColor = (type) => {
  switch (type) {
    case 'order_new': return '#666EFE';
    case 'order_cancelled': return '#FF3052';
    default: return '#666EFE';
  }
};

const OrdersPage = () => {
  const navigate = useNavigate();
  const [activeOrdersTab, setActiveOrdersTab] = useState('active');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const tooltipTimerRef = useRef(null);
  const stompClientRef = useRef(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const url = activeOrdersTab === 'active' 
        ? `${ConstantInfo.apiBaseUrl}/orders/active` 
        : `${ConstantInfo.apiBaseUrl}/orders/closed`;
      const res = await AxiosService.get(url);
      setOrders(res.data || []);
    } catch (e) {
      console.error('Ошибка загрузки заказов:', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [activeOrdersTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${ConstantInfo.apiBaseUrl}/ws-orders`),
      onConnect: () => {
        client.subscribe('/topic/orders/new', (message) => {
          const data = JSON.parse(message.body);
          setNotification({ ...data, type: 'order_new' });
          fetchOrders();
        });
        client.subscribe('/topic/orders/cancelled', (message) => {
          const data = JSON.parse(message.body);
          setNotification({ ...data, type: 'order_cancelled' });
          fetchOrders();
        });
        client.subscribe('/topic/tkp/status', () => {
          fetchOrders();
        });
        client.subscribe('/topic/orders/refresh', () => {
          fetchOrders();
        });
      },
      onDisconnect: () => {},
      onStompError: () => {}
    });

    client.activate();
    stompClientRef.current = client;

    return () => { client.deactivate(); };
  }, [fetchOrders]);

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

  const handleViewOrder = (orderUid) => {
    navigate(`/orders/${orderUid}`);
  };

  const handleViewNotification = () => {
    if (notification.order_uid) handleViewOrder(notification.order_uid);
    setNotification(null);
  };

  const handleCellMouseEnter = (e, text) => {
    const el = e.currentTarget;
    if (el.scrollWidth > el.clientWidth) {
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

  const emptyRows = Math.max(0, VISIBLE_ROWS - orders.length);

  const mutedButtonStyle = {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF',
    border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'default',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, opacity: 0.4
  };

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC' }}>
      {/* Заголовок */}
      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '30px', height: 30 }}>Заказы</h1>
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
            <div onClick={() => setActiveOrdersTab('active')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', paddingBottom: 7 }}>
              <span style={{
                fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600,
                color: activeOrdersTab === 'active' ? '#666EFE' : 'rgba(45, 64, 89, 0.6)',
                lineHeight: '18px', transition: 'color 0.3s ease'
              }}>Активные</span>
              <motion.div
                initial={false}
                animate={{ scaleX: activeOrdersTab === 'active' ? 1 : 0, opacity: activeOrdersTab === 'active' ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                style={{ width: 89, height: 3, borderRadius: 3, backgroundColor: '#666EFE', position: 'absolute', bottom: 0, transformOrigin: 'center' }}
              />
            </div>
            <div onClick={() => setActiveOrdersTab('closed')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', paddingBottom: 7 }}>
              <span style={{
                fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600,
                color: activeOrdersTab === 'closed' ? '#666EFE' : 'rgba(45, 64, 89, 0.6)',
                lineHeight: '18px', transition: 'color 0.3s ease'
              }}>Закрытые</span>
              <motion.div
                initial={false}
                animate={{ scaleX: activeOrdersTab === 'closed' ? 1 : 0, opacity: activeOrdersTab === 'closed' ? 1 : 0 }}
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
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_UID }}>UID ЗАКАЗА</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_CUSTOMER }}>ЗАКАЗЧИК</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_SOURCE }}>ИСТОЧНИК ЗАКАЗА</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_NUMBER }}>НОМЕР</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_DATE }}>ДАТА-ВРЕМЯ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_STATUS }}>СТАТУС</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_STATE }}>СОСТОЯНИЕ ЗАКАЗА</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div style={{ minWidth: TABLE_WIDTH - 40 }}>
              {loading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#9CA3AF' }}>Загрузка...</span>
                </div>
              ) : (
                <>
                  {orders.map((item, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === orders.length - 1;
                    const uidText = item.order_uid || '—';
                    const customerText = item.customer_id || '—';
                    const sourceText = 'AWMS:Динамика';
                    const numberText = item.order_number || '—';
                    const dateText = formatDateTime(item.order_datetime);
                    const statusText = getStatusLabel(item.status);
                    const statusColor = getStatusColor(item.status);
                    const stateText = getStateLabel(item);
                    const stateColor = getStateColor(item);

                    return (
                      <div key={item.order_uid || idx} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', position: 'relative', cursor: 'pointer', boxSizing: 'border-box', borderTop: isFirst ? 'none' : '0.5px solid #E5ECF5', borderBottom: isLast ? 'none' : '0.5px solid #E5ECF5' }}
                        onDoubleClick={() => handleViewOrder(item.order_uid)}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8F9FC'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                        <img src={Popup1} alt="" style={{ position: 'absolute', left: COL_ICON, width: 20, height: 22 }} />
                        <span
                          onMouseEnter={(e) => handleCellMouseEnter(e, uidText)}
                          onMouseLeave={handleCellMouseLeave}
                          style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_UID, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >{uidText}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_CUSTOMER, maxWidth: COL_SOURCE - COL_CUSTOMER - 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customerText}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_SOURCE, maxWidth: COL_NUMBER - COL_SOURCE - 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sourceText}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_NUMBER, maxWidth: COL_DATE - COL_NUMBER - 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{numberText}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_DATE }}>{dateText}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: statusColor, position: 'absolute', left: COL_STATUS }}>{statusText}</span>
                        <span
                          onMouseEnter={(e) => handleCellMouseEnter(e, stateText)}
                          onMouseLeave={handleCellMouseLeave}
                          style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: stateColor, position: 'absolute', left: COL_STATE, maxWidth: 185, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >{stateText}</span>
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
      {notification && (
        <div style={{ position: 'fixed', top: 20, right: 20, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 10000, border: `1px solid ${getNotificationColor(notification.type)}`, minWidth: 350 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: getNotificationColor(notification.type), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#FFFFFF', fontSize: 20 }}>{notification.type === 'order_new' ? '📦' : '✕'}</span>
            </div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, color: '#2D4059' }}>{getNotificationTitle(notification.type)}</div>
              {notification.order_number && <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280' }}>{notification.order_number}</div>}
            </div>
          </div>
          {notification.customer && <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#2D4059', marginBottom: 16 }}>Заказчик: {notification.customer}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleViewNotification} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', backgroundColor: getNotificationColor(notification.type), color: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500 }}>Посмотреть</button>
            <button onClick={() => setNotification(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', color: '#2D4059', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500 }}>Позже</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;