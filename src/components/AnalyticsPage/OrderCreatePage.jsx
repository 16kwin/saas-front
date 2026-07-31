// components/AnalyticsPage/OrderCreatePage.jsx (Zadel) — ПОЛНЫЙ ФАЙЛ (исправлена логика отмены: до и после подтверждения ТКП)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import AxiosService from '../../services/AxiosService';
import ConstantInfo from '../../info/ConstantInfo';
import { useTabs } from '../../context/TabContext';
import Popup1 from '../../assets/References/popup1.svg';
import Icon7 from '../../assets/References/NomenclatureCreatePage/Icon7.svg';
import TrackDoneIcon from '../../assets/References/OrderCreate/TrackDoneIcon.svg';
import TrackCurrentIcon from '../../assets/References/OrderCreate/TrackCurrentIcon.svg';
import TrackFutureIcon from '../../assets/References/OrderCreate/TrackFutureIcon.svg';
import OtmenaIcon from '../../assets/References/OrderCreate/Otmena.svg';

const ROW_HEIGHT = 54;
const HEADER_HEIGHT = 54;
const TABLE_WIDTH = 1720;
const TABLE_HEIGHT = 400;
const VISIBLE_ROWS = 6;

const ORDER_TRACK_STAGES = [
  { key: 'inprocessing', label: 'Заказ поступил' },
  { key: 'inworkprovider', label: 'Принят в работу' },
  { key: 'posttkpprovider', label: 'ТКП направлен' },
  { key: 'tkp_delivered', label: 'ТКП доставлен' },
  { key: 'tkp_accepted', label: 'ТКП подтверждён' },
  { key: 'inrealise', label: 'Заказ в пути' },
  { key: 'done', label: 'Заказ выдан' },
];

const DELIVERY_TRACK_STAGES = [
  { key: 'notinwork', label: 'Не в работе' },
  { key: 'inwork', label: 'Принят в работу' },
  { key: 'intransitoutside', label: 'Транзит за РФ' },
  { key: 'customs', label: 'Таможня' },
  { key: 'intransitinside', label: 'Транзит по РФ' },
  { key: 'warehouse', label: 'Склад' },
  { key: 'sorting', label: 'Сортировка' },
  { key: 'sent', label: 'Отправлен' },
  { key: 'courier', label: 'Курьер' },
  { key: 'done', label: 'Вручен' },
];

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

const OrderCreatePage = () => {
  const { uid } = useParams();
  const { tabs, activeTabId, closeTab, openTab } = useTabs();
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTrack, setActiveTrack] = useState('order');
  const [tkpUid, setTkpUid] = useState(null);
  const [tkpStatusInvoice, setTkpStatusInvoice] = useState('');
  const [trackUpdating, setTrackUpdating] = useState(false);
  const stompClientRef = useRef(null);

  const COL_NUMBER = 60;
  const COL_NAME = 156;
  const COL_ARTICLE = 786;
  const COL_QUANTITY = 1212;

  const getCurrentOrderTrackStage = (status, statusreason, statustrack, tkpInv, isCancelled, prevReason) => {
    if (status === 'closed' && !isCancelled) return 'done';
    if (tkpInv === 'inrealise' || statustrack === 'inwork' || statustrack === 'intransitoutside' ||
        statustrack === 'customs' || statustrack === 'intransitinside' || statustrack === 'warehouse' ||
        statustrack === 'sorting' || statustrack === 'sent' || statustrack === 'courier' || statustrack === 'done') return 'inrealise';
    
    // Отмена до подтверждения ТКП (prevReason = 'posttkpprovider')
    // ТКП был отправлен но не подтверждён — отмена будет на этапе tkp_accepted
    if (isCancelled && prevReason === 'posttkpprovider') return 'posttkpprovider';
    
    // Отмена после подтверждения ТКП (prevReason = 'accept')
    // ТКП был подтверждён — отмена будет на этапе inrealise
    if (isCancelled && prevReason === 'accept') return 'tkp_accepted';
    
    // accept в tkpInv означает что ТКП подтверждён (обычный режим, не отмена)
    if (tkpInv === 'accept') return 'tkp_accepted';
    if (statusreason === 'posttkpprovider') return 'posttkpprovider';
    if (statusreason === 'inworkprovider') return 'inworkprovider';
    return 'inprocessing';
  };

  const fetchOrder = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const res = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/orders/${uid}`);
      setOrderDetail(res.data);
      checkTkpForOrder(uid);
    } catch (e) {
      console.error('Ошибка загрузки заказа:', e);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  const checkTkpForOrder = async (orderUid) => {
    try {
      const [outgoingRes, closedRes] = await Promise.all([
        AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/tkp/outgoing`),
        AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/tkp/closed`),
      ]);
      const allTkp = [...(outgoingRes.data || []), ...(closedRes.data || [])];
      const tkp = allTkp.find(t => t.order_uid === orderUid);
      if (tkp) {
        setTkpUid(tkp.tkp_uid);
        setTkpStatusInvoice(tkp.statusinvoice || '');
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (uid) fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (!uid) return;

    let active = true;
    const timer = setTimeout(() => {
      if (!active) return;
      
      const client = new Client({
        webSocketFactory: () => new SockJS(`${ConstantInfo.apiBaseUrl}/ws-orders`),
        onConnect: () => {
          if (!active) {
            client.deactivate();
            return;
          }
          
          client.subscribe('/topic/orders/new', () => {
            if (uid) fetchOrder();
          });
          client.subscribe('/topic/orders/cancelled', () => {
            if (uid) fetchOrder();
          });
          client.subscribe('/topic/tkp/status', () => {
            if (uid) fetchOrder();
          });
          client.subscribe('/topic/orders/refresh', () => {
            if (uid) fetchOrder();
          });
          client.subscribe('/topic/tkp/new', () => {
            if (uid) fetchOrder();
          });
        },
        onDisconnect: () => {},
        onStompError: () => {}
      });

      client.activate();
      stompClientRef.current = client;
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [uid, fetchOrder]);

  const handleClose = () => { 
    const t = tabs.find(tab => tab.id === activeTabId); 
    if (t) closeTab(t.id); 
  };
  
  const handleTakeToWork = async () => {
    setActionLoading(true);
    try { await AxiosService.post(`${ConstantInfo.apiBaseUrl}/orders/${uid}/take-to-work`); await fetchOrder(); }
    catch (e) { console.error('Ошибка при взятии в работу:', e); }
    finally { setActionLoading(false); }
  };
  
  const handleCancelOrder = async () => {
    setActionLoading(true);
    try { 
      await AxiosService.post(`${ConstantInfo.apiBaseUrl}/orders/${uid}/cancel`); 
      await fetchOrder();
    }
    catch (e) { console.error('Ошибка при отмене заказа:', e); }
    finally { setActionLoading(false); }
  };
  
  const handleOpenTkpForm = () => openTab(`/orders/${uid}/tkp/create`, 'ТКП (новый)', null, activeTabId);
  const handleProductDoubleClick = (product) => setSelectedProduct(product);
  const handleCloseProduct = () => setSelectedProduct(null);

  const handleDeliveryTrackClick = async (stageKey) => {
    if (!isDeliveryEditable || trackUpdating) return;
    setTrackUpdating(true);
    try {
      await AxiosService.post(`${ConstantInfo.apiBaseUrl}/orders/${uid}/track`, { statustrack: stageKey });
      
      if (stageKey === 'done' && tkpUid) {
        await AxiosService.post(`${ConstantInfo.apiBaseUrl}/api/tkp/${tkpUid}/unpaid`);
      }
      
      await fetchOrder();
    } catch (e) {
      console.error('Ошибка обновления трека:', e);
    } finally {
      setTrackUpdating(false);
    }
  };

  const labelStyle = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059', minWidth: 160, flexShrink: 0 };
  const valueStyle = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', wordBreak: 'break-word' };
  const sectionTitleStyle = { fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#666EFE', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(102, 110, 254, 0.15)' };

  if (loading) {
    return <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span></div>;
  }
  if (!orderDetail) {
    return <div style={{ padding: '40px 60px' }}><button onClick={handleClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', marginBottom: 20 }}>← Назад к списку</button><div style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#9CA3AF' }}>Данные не найдены</div></div>;
  }

  const products = orderDetail.products || [];
  const emptyRows = Math.max(0, VISIBLE_ROWS - products.length);
  const numberText = orderDetail.ordernumber || orderDetail.order_number || uid;
  const statusReason = orderDetail.statusreason || '';
  const currentStatus = orderDetail.status || 'active';
  const trackStatus = orderDetail.statustrack || '';
  const previousStatusReason = orderDetail.previous_statusreason || '';
  
  const isCancelled = currentStatus === 'closed' && (statusReason === 'cancelcustomer' || statusReason === 'cancelprovider');
  
  const effectiveStatusReason = isCancelled && previousStatusReason 
    ? previousStatusReason
    : statusReason;
  
  const currentOrderStage = getCurrentOrderTrackStage(
    isCancelled ? 'active' : currentStatus, 
    effectiveStatusReason, 
    trackStatus, 
    tkpStatusInvoice,
    isCancelled,
    previousStatusReason
  );
  
  const isDeliveryAvailable = (effectiveStatusReason === 'posttkpprovider' || currentOrderStage === 'tkp_accepted' || currentOrderStage === 'inrealise' || currentOrderStage === 'done') && !isCancelled;
  const isDeliveryEditable = currentOrderStage === 'inrealise' && !isCancelled;

  const showTakeToWork = !statusReason || statusReason === 'inprocessing';
  const showCancelOrder = currentStatus !== 'closed' && (statusReason === 'inprocessing' || statusReason === 'inworkprovider');
  const showTkpButton = statusReason === 'inworkprovider';

  const bottomButtonStyle = { height: 51, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };

  const currentStageIndex = ORDER_TRACK_STAGES.findIndex(s => s.key === currentOrderStage);
  const effectiveIndex = currentOrderStage === 'posttkpprovider' ? currentStageIndex + 1 : currentStageIndex;
  const deliveryStageIndex = DELIVERY_TRACK_STAGES.findIndex(s => s.key === trackStatus);
  const lastOrderIndex = ORDER_TRACK_STAGES.length - 1;
  const lastDeliveryIndex = DELIVERY_TRACK_STAGES.length - 1;

  const cancelledAtIndex = isCancelled ? effectiveIndex + 1 : -1;
  const cancelLabel = statusReason === 'cancelcustomer' ? 'Заказ отменён заказчиком' : 'Заказ отменён поставщиком';

  const getOrderStageColor = (idx, currentIdx) => {
    if (isCancelled && idx === cancelledAtIndex) return '#FF3052';
    if (isCancelled && idx > cancelledAtIndex) return 'rgba(45, 64, 89, 0.35)';
    if (isCancelled && idx <= currentIdx) return '#666EFE';
    if (idx === lastOrderIndex && idx <= currentIdx) return '#07E098';
    if (idx < currentIdx) return '#666EFE';
    if (idx === currentIdx) return 'linear-gradient(to right, #666EFE, #07E098)';
    return 'rgba(45, 64, 89, 0.35)';
  };

  const getOrderLineBg = (idx, currentIdx) => {
    if (isCancelled && idx === cancelledAtIndex) return 'linear-gradient(to right, #666EFE, #FF3052)';
    if (isCancelled && idx > cancelledAtIndex) return 'rgba(45, 64, 89, 0.35)';
    if (isCancelled && idx <= currentIdx) return '#666EFE';
    if (idx === lastOrderIndex && idx <= currentIdx) return 'linear-gradient(to right, #666EFE, #07E098)';
    if (idx <= currentIdx) return '#666EFE';
    if (idx === currentIdx + 1) return 'linear-gradient(to right, #07E098, rgba(45, 64, 89, 0.35))';
    return 'rgba(45, 64, 89, 0.35)';
  };

  const getDeliveryStageColor = (idx, currentIdx) => {
    if (idx === lastDeliveryIndex && idx <= currentIdx) return '#07E098';
    if (idx < currentIdx) return '#666EFE';
    if (idx === currentIdx) return 'linear-gradient(to right, #666EFE, #07E098)';
    return 'rgba(45, 64, 89, 0.35)';
  };

  const getDeliveryLineBg = (idx, currentIdx) => {
    if (idx === lastDeliveryIndex && idx <= currentIdx) return 'linear-gradient(to right, #666EFE, #07E098)';
    if (idx <= currentIdx) return '#666EFE';
    if (idx === currentIdx + 1) return 'linear-gradient(to right, #07E098, rgba(45, 64, 89, 0.35))';
    return 'rgba(45, 64, 89, 0.35)';
  };

  const statusLabel = getStatusLabel(currentStatus);
  const statusColorVal = getStatusColor(currentStatus);
  const stateLabel = getStateLabel(orderDetail);
  const stateColorVal = getStateColor(orderDetail);

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF' }}>
      <h1 style={{ position: 'absolute', top: 35, left: 60, fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '30px', height: 30 }}>Документ: Заказ на поставку {numberText ? `(${numberText})` : ''}</h1>
      <button onClick={handleClose} style={{ position: 'absolute', top: 40, right: 40, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={Icon7} alt="Закрыть" style={{ width: 18, height: 18 }} /></button>

      <div style={{ position: 'absolute', top: 85, left: 60, right: 60, height: 18, display: 'flex', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059' }}>UID заказа: </span><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: 'rgba(45, 64, 89, 0.6)' }}>{uid}</span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059', marginLeft: 177 }}>Заказчик: </span><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: 'rgba(45, 64, 89, 0.6)' }}>{orderDetail.customer || '—'}</span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059', marginLeft: 177 }}>Представитель покупателя: </span><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: 'rgba(45, 64, 89, 0.6)' }}>{orderDetail.contactperson || '—'}</span>
      </div>

      {/* Блок трека */}
      <div style={{ position: 'absolute', top: 133, left: 40, width: TABLE_WIDTH, height: 137, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', width: '200%', height: '100%', transform: activeTrack === 'delivery' ? 'translateX(-50%)' : 'translateX(0)', transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          
          {/* Трек заказа */}
          <div style={{ width: '50%', height: '100%', position: 'relative', flexShrink: 0 }}>
            {isDeliveryAvailable && (
              <button onClick={() => setActiveTrack('delivery')} style={{ position: 'absolute', top: 8, right: 14, height: 30, paddingLeft: 14, paddingRight: 14, borderRadius: 8, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500, color: '#666EFE', zIndex: 2 }}>Трек поставки →</button>
            )}
            <div style={{ padding: '38px 60px 15px 60px', height: '100%', display: 'flex', alignItems: 'center' }}>
              {ORDER_TRACK_STAGES.map((stage, idx) => {
                const circleSize = 40;
                const lineHeight = 6;
                const gap = 7;
                const isFirst = idx === 0;
                const isCancelledStage = isCancelled && idx === cancelledAtIndex;
                const isAfterCancelled = isCancelled && idx > cancelledAtIndex;
                const isDone = isCancelled ? (idx <= effectiveIndex) : (idx < effectiveIndex || (idx === lastOrderIndex && effectiveIndex >= lastOrderIndex));
                const isCurrent = !isCancelled && idx === effectiveIndex && idx !== lastOrderIndex;
                const isFuture = !isCancelled && idx > effectiveIndex;
                const color = getOrderStageColor(idx, effectiveIndex);
                
                let icon;
                if (isCancelledStage) {
                  icon = OtmenaIcon;
                } else if (isAfterCancelled) {
                  icon = TrackFutureIcon;
                } else if (isDone) {
                  icon = TrackDoneIcon;
                } else if (isCurrent) {
                  icon = TrackCurrentIcon;
                } else {
                  icon = TrackFutureIcon;
                }
                
                const iconSize = isCancelledStage ? 22 : 20;
                const iconFilter = (isDone || isCurrent) ? 'brightness(0) invert(1)' : 'none';
                const iconOpacity = (isFuture || isAfterCancelled) ? 0.5 : 1;
                
                const labelText = isCancelledStage ? cancelLabel : stage.label;
                const labelColor = isCancelledStage ? '#FF3052' : (isAfterCancelled ? 'rgba(45, 64, 89, 0.35)' : ((isDone || isCurrent) ? '#2D4059' : 'rgba(45, 64, 89, 0.35)'));

                return (
                  <React.Fragment key={stage.key}>
                    {!isFirst && (
                      <div style={{
                        flex: 1, height: lineHeight, minWidth: 20,
                        background: getOrderLineBg(idx, effectiveIndex),
                        borderRadius: lineHeight / 2,
                        marginLeft: gap, marginRight: gap,
                      }} />
                    )}
                    <div style={{ position: 'relative', width: circleSize, height: circleSize, flexShrink: 0 }}>
                      <div style={{
                        width: circleSize, height: circleSize, borderRadius: '50%',
                        background: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <img src={icon} alt="" style={{ width: iconSize, height: iconSize, filter: iconFilter, opacity: iconOpacity }} />
                      </div>
                      <span style={{
                        position: 'absolute', top: circleSize + gap, left: '50%', transform: 'translateX(-50%)',
                        fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500,
                        color: labelColor,
                        textAlign: 'center', lineHeight: '16px',
                        whiteSpace: 'nowrap',
                      }}>
                        {labelText}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Трек поставки */}
          <div style={{ width: '50%', height: '100%', position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setActiveTrack('order')} style={{ position: 'absolute', top: 8, left: 14, height: 30, paddingLeft: 14, paddingRight: 14, borderRadius: 8, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500, color: '#666EFE', zIndex: 2 }}>← Трек заказа</button>
            {trackUpdating && (
              <div style={{ position: 'absolute', top: 8, right: 14, height: 30, display: 'flex', alignItems: 'center', zIndex: 2 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>Обновление...</span>
              </div>
            )}
            <div style={{ padding: '38px 40px 15px 40px', height: '100%', display: 'flex', alignItems: 'center' }}>
              {DELIVERY_TRACK_STAGES.map((stage, idx) => {
                const circleSize = 20;
                const lineHeight = 3;
                const gap = 3.5;
                const isFirst = idx === 0;
                const isDone = idx < deliveryStageIndex || (idx === lastDeliveryIndex && deliveryStageIndex >= lastDeliveryIndex);
                const isCurrent = idx === deliveryStageIndex && idx !== lastDeliveryIndex;
                const isFuture = idx > deliveryStageIndex;
                const clickable = isDeliveryEditable;
                const color = getDeliveryStageColor(idx, deliveryStageIndex);
                const icon = isDone ? TrackDoneIcon : (isCurrent ? TrackCurrentIcon : TrackFutureIcon);
                const iconSize = 10;
                const iconFilter = isDone || isCurrent ? 'brightness(0) invert(1)' : 'none';
                const iconOpacity = isFuture ? 0.5 : 1;

                return (
                  <React.Fragment key={stage.key}>
                    {!isFirst && (
                      <div style={{
                        flex: 1, height: lineHeight, minWidth: 8,
                        background: getDeliveryLineBg(idx, deliveryStageIndex),
                        borderRadius: lineHeight / 2,
                        marginLeft: gap, marginRight: gap,
                      }} />
                    )}
                    <div
                      onClick={() => clickable && handleDeliveryTrackClick(stage.key)}
                      style={{
                        position: 'relative', width: circleSize, height: circleSize, flexShrink: 0,
                        cursor: clickable ? 'pointer' : 'default',
                      }}
                    >
                      <div style={{
                        width: circleSize, height: circleSize, borderRadius: '50%',
                        background: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'transform 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        if (clickable) e.currentTarget.style.transform = 'scale(1.15)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      >
                        <img src={icon} alt="" style={{ width: iconSize, height: iconSize, filter: iconFilter, opacity: iconOpacity }} />
                      </div>
                      <span style={{
                        position: 'absolute', top: circleSize + gap, left: '50%', transform: 'translateX(-50%)',
                        fontFamily: 'Inter, sans-serif', fontSize: 8, fontWeight: 500,
                        color: idx <= deliveryStageIndex ? '#2D4059' : 'rgba(45, 64, 89, 0.35)',
                        textAlign: 'center', lineHeight: '10px',
                        whiteSpace: 'nowrap',
                      }}>
                        {stage.label}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Таблица */}
      <div style={{ position: 'absolute', top: 300, left: 40 }}>
        <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', position: 'relative', paddingRight: 40, boxSizing: 'border-box' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_NUMBER }}>НОМЕР</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_NAME }}>НАИМЕНОВАНИЕ НОМЕНКЛАТУРЫ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_ARTICLE }}>АРТИКУЛ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_QUANTITY }}>КОЛИЧЕСТВО</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {products.map((product, idx) => (
              <div key={product.product_uid || idx} onDoubleClick={() => handleProductDoubleClick(product)}
                style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', position: 'relative', cursor: 'pointer', borderTop: idx === 0 ? 'none' : '0.5px solid #E5ECF5', borderBottom: idx === products.length - 1 ? 'none' : '0.5px solid #E5ECF5' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8F9FC'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                <img src={Popup1} alt="" style={{ position: 'absolute', left: 30, width: 20, height: 22 }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_NUMBER }}>{idx + 1}</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_NAME, maxWidth: COL_ARTICLE - COL_NAME - 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.product || '—'}</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_ARTICLE }}>{product.article || '—'}</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_QUANTITY }}>{product.quantity}</span>
              </div>
            ))}
            {Array.from({ length: emptyRows }).map((_, i) => <div key={`empty-${i}`} style={{ height: ROW_HEIGHT, backgroundColor: '#FFFFFF', borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5' }} />)}
          </div>
        </div>
      </div>

      {/* Нижние блоки: количество, статус и состояние */}
      <div style={{ position: 'absolute', bottom: 30, left: 40, display: 'flex', gap: 15 }}>
        <div style={{ width: 217, height: 60, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059' }}>Всего номенклатур:</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059' }}>{products.length}</span>
        </div>
        <div style={{ width: 400, height: 60, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', padding: '0 30px', gap: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Статус заказа:</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: statusColorVal }}>{statusLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Состояние заказа:</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: stateColorVal }}>{stateLabel}</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 30 }}>
        {showTakeToWork && <button onClick={handleTakeToWork} disabled={actionLoading} style={{ ...bottomButtonStyle, width: 180, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#FFFFFF', backgroundColor: actionLoading ? '#BCC8FF' : '#666EFE', border: 'none', opacity: actionLoading ? 0.6 : 1, cursor: actionLoading ? 'not-allowed' : 'pointer' }}>{actionLoading ? 'Выполнение...' : 'Взять в работу'}</button>}
        {showTkpButton && <button onClick={handleOpenTkpForm} style={{ ...bottomButtonStyle, width: 180, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#FFFFFF', backgroundColor: '#10B981', border: 'none', cursor: 'pointer' }}>Сформировать ТКП</button>}
        {showCancelOrder && <button onClick={handleCancelOrder} disabled={actionLoading} style={{ ...bottomButtonStyle, width: 180, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#FFFFFF', backgroundColor: actionLoading ? '#BCC8FF' : '#FF3052', border: 'none', opacity: actionLoading ? 0.6 : 1, cursor: actionLoading ? 'not-allowed' : 'pointer' }}>{actionLoading ? 'Отмена...' : 'Отклонить'}</button>}
        <button onClick={handleClose} style={{ ...bottomButtonStyle, width: 116, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Закрыть</button>
      </div>

      {selectedProduct && (
        <div onClick={handleCloseProduct} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 900, maxHeight: '80vh', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#2D4059', fontFamily: 'Inter, sans-serif' }}>{selectedProduct.product || '—'}</h2>
              <button onClick={handleCloseProduct} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: 18, color: '#2D4059' }}>✕</button>
            </div>
            <div style={{ marginBottom: 20 }}><h3 style={sectionTitleStyle}>Основная информация</h3><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10 }}><span style={labelStyle}>UID:</span><span style={valueStyle}>{selectedProduct.product_uid || '—'}</span></div>
              <div style={{ display: 'flex', gap: 10 }}><span style={labelStyle}>Артикул:</span><span style={valueStyle}>{selectedProduct.article || '—'}</span></div>
              <div style={{ display: 'flex', gap: 10 }}><span style={labelStyle}>Количество:</span><span style={valueStyle}>{selectedProduct.quantity}</span></div>
              {selectedProduct.group && <div style={{ display: 'flex', gap: 10 }}><span style={labelStyle}>Группа:</span><span style={valueStyle}>{selectedProduct.group}</span></div>}
              {selectedProduct.type && <div style={{ display: 'flex', gap: 10 }}><span style={labelStyle}>Вид:</span><span style={valueStyle}>{selectedProduct.type}</span></div>}
              {selectedProduct.manufacturer && <div style={{ display: 'flex', gap: 10 }}><span style={labelStyle}>Производитель:</span><span style={valueStyle}>{selectedProduct.manufacturer}</span></div>}
              {selectedProduct.country && <div style={{ display: 'flex', gap: 10 }}><span style={labelStyle}>Страна:</span><span style={valueStyle}>{selectedProduct.country}</span></div>}
              {selectedProduct.brand && <div style={{ display: 'flex', gap: 10 }}><span style={labelStyle}>Бренд:</span><span style={valueStyle}>{selectedProduct.brand}</span></div>}
              {selectedProduct.model && <div style={{ display: 'flex', gap: 10 }}><span style={labelStyle}>Модель:</span><span style={valueStyle}>{selectedProduct.model}</span></div>}
              {selectedProduct.description && <div style={{ display: 'flex', gap: 10 }}><span style={labelStyle}>Описание:</span><span style={{ ...valueStyle, maxWidth: 600 }}>{selectedProduct.description}</span></div>}
            </div></div>
            {selectedProduct.specifications && selectedProduct.specifications.length > 0 && <div style={{ marginBottom: 20 }}><h3 style={sectionTitleStyle}>Характеристики</h3><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{selectedProduct.specifications.map((spec, i) => <div key={i} style={{ display: 'flex', gap: 10 }}><span style={labelStyle}>{spec.characteristic}:</span><span style={valueStyle}>{spec.value} {spec.unit || ''}</span></div>)}</div></div>}
            {selectedProduct.barcode && <div style={{ marginBottom: 20 }}><h3 style={sectionTitleStyle}>Штрихкод</h3><div style={{ display: 'flex', gap: 10 }}><span style={labelStyle}>Код:</span><span style={valueStyle}>{selectedProduct.barcode.code || '—'}</span></div>{selectedProduct.barcode.codeimage && <img src={`data:image/png;base64,${selectedProduct.barcode.codeimage}`} alt="Штрихкод" style={{ maxWidth: 300, marginTop: 8 }} />}</div>}
            {selectedProduct.sku && <div style={{ marginBottom: 20 }}><h3 style={sectionTitleStyle}>SKU</h3><div style={{ display: 'flex', gap: 10 }}><span style={labelStyle}>Код:</span><span style={valueStyle}>{selectedProduct.sku.code || '—'}</span></div>{selectedProduct.sku.image && <img src={`data:image/png;base64,${selectedProduct.sku.image}`} alt="SKU" style={{ maxWidth: 150, marginTop: 8 }} />}</div>}
            {selectedProduct.images && selectedProduct.images.length > 0 && <div style={{ marginBottom: 20 }}><h3 style={sectionTitleStyle}>Изображения</h3><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{selectedProduct.images.map((img, i) => <img key={i} src={`data:image/png;base64,${img}`} alt="" style={{ width: 150, height: 150, objectFit: 'contain', borderRadius: 8, border: '1px solid rgba(102,110,254,0.15)' }} />)}</div></div>}
            {selectedProduct.draws && selectedProduct.draws.length > 0 && <div style={{ marginBottom: 20 }}><h3 style={sectionTitleStyle}>Чертежи</h3><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{selectedProduct.draws.map((draw, i) => <img key={i} src={`data:image/png;base64,${draw}`} alt="" style={{ width: 200, height: 150, objectFit: 'contain', borderRadius: 8, border: '1px solid rgba(102,110,254,0.15)' }} />)}</div></div>}
            {selectedProduct.analogues && selectedProduct.analogues.length > 0 && <div style={{ marginBottom: 20 }}><h3 style={sectionTitleStyle}>Аналоги</h3>{selectedProduct.analogues.map((analog, i) => <div key={i} style={{ display: 'flex', gap: 20, padding: '8px 0' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059' }}>{analog.name}</span><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280' }}>{analog.model}</span><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF' }}>UID: {analog.uid}</span></div>)}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCreatePage;