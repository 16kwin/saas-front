// components/AnalyticsPage/TkpCreatePage.jsx (Zadel) — ПОЛНЫЙ ФАЙЛ с закрытием вкладки после отправки ТКП
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import AxiosService from '../../services/AxiosService';
import ConstantInfo from '../../info/ConstantInfo';
import { useTabs } from '../../context/TabContext';
import CatalogSelectPopup from '../ReferencesPage/NomenclaturePage/CatalogSelectPopup';
import Icon7 from '../../assets/References/NomenclatureCreatePage/Icon7.svg';

const ROW_HEIGHT = 54;
const HEADER_HEIGHT = 54;
const TABLE_WIDTH = 1720;
const TABLE_HEIGHT = 540;
const VISIBLE_ROWS = 9;

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

const formatCost = (value) => {
  return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';
};

const TkpCreatePage = () => {
  const { uid } = useParams();
  const { tabs, activeTabId, closeTab } = useTabs();
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orderCache, setOrderCache] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [products, setProducts] = useState([]);
  const [buyerInfoCache, setBuyerInfoCache] = useState({});
  const [zadelMaterialsCache, setZadelMaterialsCache] = useState({});
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [currentSelectIndex, setCurrentSelectIndex] = useState(null);
  const [filterProduct, setFilterProduct] = useState(null);
  const [excludeUids, setExcludeUids] = useState([]);
  const [relevanceScores, setRelevanceScores] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const tooltipTimer = useRef(null);
  const stompClientRef = useRef(null);

  const COL_NUMBER = 50;
  const COL_NAME_ZADEL = 130;
  const COL_ARTICLE_ZADEL = 380;
  const COL_NAME_BUYER = 590;
  const COL_ARTICLE_BUYER = 840;
  const COL_QUANTITY = 1070;
  const COL_PRICE = 1200;
  const COL_COST = 1350;
  const COL_RELEVANCE = 1540;

  const fetchOrderForTkp = async (orderUid) => {
    if (!orderUid) return null;
    if (orderCache[orderUid]) return orderCache[orderUid];
    try {
      const res = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/orders/${orderUid}`);
      setOrderCache(prev => ({ ...prev, [orderUid]: res.data }));
      return res.data;
    } catch (e) { return null; }
  };

  const fetchZadelMaterial = async (materialUid) => {
    if (!materialUid) return null;
    if (zadelMaterialsCache[materialUid]) return zadelMaterialsCache[materialUid];
    try {
      const res = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/nomenclature/${materialUid}`);
      setZadelMaterialsCache(prev => ({ ...prev, [materialUid]: res.data }));
      return res.data;
    } catch (e) { return null; }
  };

  const loadBuyerInfo = async (orderUid, tkpProducts) => {
    try {
      const orderRes = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/orders/${orderUid}`);
      const orderData = orderRes.data;
      const orderProducts = orderData.products || [];

      const cache = {};
      tkpProducts.forEach(p => {
        const found = orderProducts.find(op => op.product_uid === p.product_uid);
        cache[p.product_uid] = {
          product: found?.product || '—',
          article: found?.article || '—',
          specifications: found?.specifications || [],
          fullData: found || null,
        };
      });
      setBuyerInfoCache(cache);
    } catch (e) {
      console.error('Ошибка загрузки данных покупателя:', e);
    }
  };

  const fetchTkp = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/tkp/${uid}`);
      const tkpData = res.data;

      if (tkpData.order_uid) {
        const orderData = await fetchOrderForTkp(tkpData.order_uid);
        if (orderData) {
          tkpData.statustrack = orderData.statustrack;
          tkpData.order_status = orderData.status;
          tkpData.order_statusreason = orderData.statusreason;
        }
      }

      // Режим редактирования только если statusinvoice отсутствует (новый ТКП)
      const isNew = !tkpData.statusinvoice;
      setIsEditMode(isNew);

      const tkpProducts = (tkpData.products || []).map((p, idx) => ({
        ...p,
        localId: `prod_${idx}_${Date.now()}`,
        zadel_product_uid: p.zadel_product_uid || null,
        zadel_selected: !!p.zadel_product_uid,
        price: p.price || 0,
        cost: p.cost || 0,
      }));

      setProducts(tkpProducts);
      setOrderDetail(tkpData);

      const uids = tkpProducts.filter(p => p.zadel_product_uid).map(p => p.zadel_product_uid);
      setExcludeUids(uids);

      const savedRelevance = {};
      tkpProducts.forEach(p => {
        if (p.relevance !== undefined && p.relevance !== null) {
          savedRelevance[p.product_uid] = p.relevance;
        }
      });
      setRelevanceScores(savedRelevance);

      if (tkpData.order_uid) {
        loadBuyerInfo(tkpData.order_uid, tkpProducts);
      }
    } catch (e) {
      console.error('Ошибка загрузки ТКП:', e);

      const orderData = await fetchOrderForTkp(uid);
      if (orderData) {
        setIsEditMode(true);
        const tkpProducts = (orderData.products || []).map((p, idx) => ({
          ...p,
          localId: `prod_${idx}_${Date.now()}`,
          zadel_product_uid: null,
          zadel_selected: false,
          price: 0,
          cost: 0,
        }));
        setProducts(tkpProducts);
        setOrderDetail({
          order_uid: uid,
          customer: orderData.customer,
          contactperson: orderData.contactperson,
          delivery_date: orderData.delivery_date || '',
          total_cost: 0,
          statusinvoice: null,
          statustrack: orderData.statustrack,
          products: tkpProducts,
        });
        setExcludeUids([]);
        if (uid) {
          loadBuyerInfo(uid, tkpProducts);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    if (uid) fetchTkp();
  }, [fetchTkp]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${ConstantInfo.apiBaseUrl}/ws-orders`),
      onConnect: () => {
        client.subscribe('/topic/tkp/accepted', () => {
          fetchTkp();
        });
        client.subscribe('/topic/tkp/cancelled', () => {
          fetchTkp();
        });
        client.subscribe('/topic/tkp/status', () => {
          fetchTkp();
        });
        client.subscribe('/topic/tkp/new', () => {
          fetchTkp();
        });
        client.subscribe('/topic/orders/refresh', () => {
          fetchTkp();
        });
      },
      onDisconnect: () => {},
      onStompError: () => {}
    });

    client.activate();
    stompClientRef.current = client;

    return () => { client.deactivate(); };
  }, [fetchTkp]);

  const handleClose = () => { 
    const t = tabs.find(tab => tab.id === activeTabId); 
    if (t) closeTab(t.id); 
  };

  const handleNavigateToOrder = (orderUid) => {
    if (orderUid) {
      const t = tabs.find(tab => tab.id === activeTabId);
      if (t) {
        closeTab(t.id);
      }
      import('./OrderCreatePage').then(() => {
        window.dispatchEvent(new CustomEvent('open-tab', { 
          detail: { path: `/orders/${orderUid}`, label: `Заказ ${orderUid.slice(0, 8)}` }
        }));
      });
    }
  };

  const handlePriceChange = (index, value) => {
    if (!isEditMode) return;
    const numValue = parseFloat(value) || 0;
    setProducts(prev => {
      const updated = [...prev];
      const qty = updated[index].quantity || 1;
      updated[index] = {
        ...updated[index],
        price: numValue,
        cost: numValue * qty,
      };
      return updated;
    });
  };

  const handleOpenCatalogForProduct = (index) => {
    if (!isEditMode) return;
    setCurrentSelectIndex(index);
    
    const orderUid = orderDetail?.order_uid || uid;
    const orderData = orderCache[orderUid];
    
    let awmsProduct = null;
    if (orderData?.products) {
      awmsProduct = orderData.products.find(p => p.product_uid === products[index]?.product_uid);
    }
    
    if (!awmsProduct) {
      const buyerInfo = buyerInfoCache[products[index]?.product_uid];
      awmsProduct = {
        product_uid: products[index]?.product_uid,
        product: buyerInfo?.product || products[index]?.product || '',
        article: buyerInfo?.article || products[index]?.article || '',
        specifications: buyerInfo?.specifications || products[index]?.specifications || [],
        quantity: products[index]?.quantity,
      };
    }
    
    setFilterProduct(awmsProduct);
    setCatalogOpen(true);
  };

  const calculateRelevanceScore = (awmsProduct, materialData, zadelChars) => {
    if (!awmsProduct || !materialData) return 0;

    const productName = (awmsProduct.product || '').toLowerCase().trim();
    const productArticle = (awmsProduct.article || '').toLowerCase().trim();
    const materialName = (materialData.name || '').toLowerCase().trim();
    const materialArticle = (materialData.article || '').toLowerCase().trim();

    if (productName && materialName === productName) return 100;
    if (productArticle && materialArticle === productArticle) return 100;

    const orderSpecs = awmsProduct.specifications || [];
    if (orderSpecs.length === 0) return 0;

    let matched = 0;
    orderSpecs.forEach(spec => {
      const found = zadelChars.some(c =>
        (c.attributeName || '').toLowerCase().trim() === (spec.characteristic || '').toLowerCase().trim() &&
        (c.value || c.customName || '').toLowerCase().trim() === (spec.value || '').toLowerCase().trim()
      );
      if (found) matched++;
    });

    return Math.round((matched / orderSpecs.length) * 100);
  };

  const handleCatalogSelect = async (materialUid, materialName) => {
    if (currentSelectIndex === null) return;

    const materialData = await fetchZadelMaterial(materialUid);
    if (!materialData) return;

    const awmsProduct = filterProduct;
    if (awmsProduct) {
      try {
        const zadelCharsRes = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/nomenclature/${materialUid}/characteristics`);
        const zadelChars = zadelCharsRes.data || [];
        const relevance = calculateRelevanceScore(awmsProduct, materialData, zadelChars);
        setRelevanceScores(prev => ({ ...prev, [awmsProduct.product_uid]: relevance }));
      } catch (e) {
        console.error('Ошибка расчёта релевантности:', e);
      }
    }

    setProducts(prev => {
      const updated = [...prev];
      const existing = updated[currentSelectIndex];
      updated[currentSelectIndex] = {
        ...existing,
        zadel_product_uid: materialUid,
        zadel_selected: true,
        product: materialData.name || existing.product,
        article: materialData.article || '',
        description: materialData.description || '',
        manufacturer: materialData.manufacturerName || '',
        country: materialData.countryName || '',
        brand: materialData.brandName || '',
        model: materialData.modelOfBrandName || '',
        group: materialData.typeMainName || '',
        type: materialData.typeProductName || '',
      };
      return updated;
    });

    setExcludeUids(prev => [...prev, materialUid]);
    setCurrentSelectIndex(null);
    setFilterProduct(null);
  };

  const handleCatalogClose = () => {
    setCatalogOpen(false);
    setCurrentSelectIndex(null);
    setFilterProduct(null);
  };

  const handleShowBuyerProductInfo = (productUid) => {
    const buyerInfo = buyerInfoCache[productUid];
    if (buyerInfo?.fullData) {
      setSelectedProduct(buyerInfo.fullData);
    }
  };

  const handleCloseProduct = () => {
    setSelectedProduct(null);
  };

  const handleCellMouseEnter = (e, text) => {
    const el = e.currentTarget;
    if (el.scrollWidth > el.clientWidth || el.offsetWidth < el.scrollWidth) {
      clearTimeout(tooltipTimer.current);
      const rect = el.getBoundingClientRect();
      tooltipTimer.current = setTimeout(() => {
        setTooltip({ text, x: rect.left + rect.width / 2, y: rect.bottom + 6 });
      }, 500);
    }
  };

  const handleCellMouseLeave = () => {
    clearTimeout(tooltipTimer.current);
    setTooltip(null);
  };

  const handleSendTkp = async () => {
    const notSelected = products.filter(p => !p.zadel_selected);
    if (notSelected.length > 0) {
      alert('Не для всех позиций подобрана номенклатура Zadel');
      return;
    }

    setSaving(true);
    try {
      const totalCost = products.reduce((sum, p) => sum + (p.cost || 0), 0);

      const body = {
        prices: products.map(p => ({
          productUid: p.product_uid,
          price: p.price,
          zadelProductUid: p.zadel_product_uid,
          relevance: relevanceScores[p.product_uid] || 0,
        })),
        totalCost,
      };

      await AxiosService.post(`${ConstantInfo.apiBaseUrl}/api/tkp/${uid}/send`, body);
      
      // Закрываем вкладку после успешной отправки
      handleClose();
      
    } catch (e) {
      console.error('Ошибка при отправке ТКП:', e);
      alert('Ошибка при отправке ТКП');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelTkp = async () => {
    try {
      await AxiosService.post(`${ConstantInfo.apiBaseUrl}/api/tkp/${uid}/cancel`);
      handleClose();
    } catch (e) { console.error('Ошибка:', e); }
  };

  const handlePayTkp = async () => {
    try {
      await AxiosService.post(`${ConstantInfo.apiBaseUrl}/api/tkp/${uid}/pay`);
      fetchTkp();
    } catch (e) { console.error('Ошибка:', e); }
  };

  const handleCompleteTkp = async () => {
    try {
      await AxiosService.post(`${ConstantInfo.apiBaseUrl}/api/tkp/${uid}/unpaid`);
      fetchTkp();
    } catch (e) { console.error('Ошибка:', e); }
  };

  const handleInrealiseTkp = async () => {
    try {
      await AxiosService.post(`${ConstantInfo.apiBaseUrl}/api/tkp/${uid}/inrealise`);
      fetchTkp();
    } catch (e) { console.error('Ошибка:', e); }
  };

  if (loading) {
    return (
      <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
      </div>
    );
  }

  if (!orderDetail) {
    return (
      <div style={{ padding: '40px 60px' }}>
        <button onClick={handleClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', marginBottom: 20 }}>
          ← Назад к списку
        </button>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#9CA3AF' }}>Данные не найдены</div>
      </div>
    );
  }

  const showCancelTkp = (orderDetail.statusinvoice === 'unaccept' || orderDetail.statusinvoice === 'accept') && !isEditMode;
  const showInrealiseButton = orderDetail.statusinvoice === 'accept';
  const showCompleteButton = orderDetail.statustrack === 'done' &&
    orderDetail.statusinvoice !== 'unpaid' && orderDetail.statusinvoice !== 'paid' &&
    orderDetail.statusinvoice !== 'cancelcustomer' && orderDetail.statusinvoice !== 'cancelprovider';
  const showPayButton = orderDetail.statusinvoice === 'unpaid';
  const showSendButton = isEditMode;

  const emptyRows = Math.max(0, VISIBLE_ROWS - products.length);

  const bottomButtonStyle = {
    height: 51, borderRadius: 10,
    border: '1px solid rgba(102, 110, 254, 0.15)',
    backgroundColor: '#FFFFFF', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, flexShrink: 0,
  };

  const totalCost = products.reduce((sum, p) => sum + (p.cost || 0), 0);
  const nds = totalCost * 0.22;

  const getRelevanceColor = (relevance) => {
    if (!relevance && relevance !== 0) return '#9CA3AF';
    if (relevance >= 80) return '#10B981';
    if (relevance >= 50) return '#F59E0B';
    if (relevance > 0) return '#EF4444';
    return '#9CA3AF';
  };

  const labelStyle = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059', minWidth: 160, flexShrink: 0 };
  const valueStyle = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', wordBreak: 'break-word' };
  const sectionTitleStyle = { fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#666EFE', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(102, 110, 254, 0.15)' };

  const statusLabel = orderDetail.status ? getStatusLabel(orderDetail.status) : '—';
  const statusColorVal = orderDetail.status ? getStatusColor(orderDetail.status) : '#2D4059';
  const invoiceLabel = getStatusInvoiceLabel(orderDetail.statusinvoice);
  const invoiceColorVal = getStatusInvoiceColor(orderDetail.statusinvoice);

  const subBlockTextStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 15,
    fontWeight: 500,
    color: '#2D4059',
  };

  const subBlockLabelStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 600,
    color: '#2D4059',
  };

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF' }}>
      <h1 style={{ position: 'absolute', top: 35, left: 60, fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '30px', height: 30 }}>Документ: ТКП {uid ? `(${uid.slice(0, 8)})` : ''}</h1>
      <button onClick={handleClose} style={{ position: 'absolute', top: 40, right: 40, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={Icon7} alt="Закрыть" style={{ width: 18, height: 18 }} /></button>

      <div style={{ position: 'absolute', top: 85, left: 60, right: 60, height: 18, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <div><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>UID ТКП: </span><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280' }}>{uid}</span></div>
        {orderDetail.order_uid && (
          <div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>UID заказа: </span>
            <span
              onClick={() => handleNavigateToOrder(orderDetail.order_uid)}
              style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#666EFE', cursor: 'pointer', textDecoration: 'underline' }}
            >{orderDetail.order_uid}</span>
          </div>
        )}
        <div><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Заказчик: </span><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280' }}>{orderDetail.customer || '—'}</span></div>
        <div><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Дата поставки: </span><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280' }}>{orderDetail.delivery_date || '—'}</span></div>
      </div>

      <div style={{ position: 'absolute', top: 130, left: 40 }}>
        <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', position: 'relative', paddingRight: 40, boxSizing: 'border-box' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_NUMBER }}>НОМЕР</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_NAME_ZADEL }}>НАИМЕНОВАНИЕ (ZADEL)</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_ARTICLE_ZADEL }}>АРТИКУЛ (ZADEL)</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_NAME_BUYER }}>НАИМЕНОВАНИЕ ПОКУПАТЕЛЯ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_ARTICLE_BUYER }}>АРТИКУЛ ПОКУПАТЕЛЯ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_QUANTITY }}>КОЛИЧЕСТВО</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_PRICE }}>ЦЕНА</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_COST }}>СТОИМОСТЬ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_RELEVANCE }}>РЕЛЕВАНТНОСТЬ</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {products.map((product, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === products.length - 1;
              const buyerInfo = buyerInfoCache[product.product_uid] || { product: '—', article: '—' };
              const relevance = relevanceScores[product.product_uid];

              return (
                <div key={product.localId || idx}
                  onDoubleClick={() => isEditMode && handleOpenCatalogForProduct(idx)}
                  style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', position: 'relative', cursor: isEditMode ? 'pointer' : 'default', borderTop: isFirst ? 'none' : '0.5px solid #E5ECF5', borderBottom: isLast ? 'none' : '0.5px solid #E5ECF5' }}
                  onMouseEnter={e => isEditMode && (e.currentTarget.style.backgroundColor = '#F8F9FC')}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_NUMBER }}>{idx + 1}</span>

                  {product.zadel_selected ? (
                    <>
                      <span onMouseEnter={(e) => handleCellMouseEnter(e, product.product || '')} onMouseLeave={handleCellMouseLeave}
                        style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_NAME_ZADEL, maxWidth: COL_ARTICLE_ZADEL - COL_NAME_ZADEL - 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.product || '—'}</span>
                      <span onMouseEnter={(e) => handleCellMouseEnter(e, product.article || '')} onMouseLeave={handleCellMouseLeave}
                        style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_ARTICLE_ZADEL, maxWidth: COL_NAME_BUYER - COL_ARTICLE_ZADEL - 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.article || ''}</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#9CA3AF', position: 'absolute', left: COL_NAME_ZADEL, maxWidth: COL_ARTICLE_ZADEL - COL_NAME_ZADEL - 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Выберите номенклатуру</span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#9CA3AF', position: 'absolute', left: COL_ARTICLE_ZADEL }}></span>
                    </>
                  )}

                  <span onClick={(e) => { e.stopPropagation(); handleShowBuyerProductInfo(product.product_uid); }}
                    onMouseEnter={(e) => handleCellMouseEnter(e, buyerInfo.product)} onMouseLeave={handleCellMouseLeave}
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#666EFE', position: 'absolute', left: COL_NAME_BUYER, maxWidth: COL_ARTICLE_BUYER - COL_NAME_BUYER - 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: 'underline' }}>{buyerInfo.product}</span>
                  <span onMouseEnter={(e) => handleCellMouseEnter(e, buyerInfo.article)} onMouseLeave={handleCellMouseLeave}
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_ARTICLE_BUYER, maxWidth: COL_QUANTITY - COL_ARTICLE_BUYER - 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{buyerInfo.article}</span>

                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_QUANTITY }}>{product.quantity}</span>

                  {isEditMode ? (
                    <input type="number" value={product.price || ''} onChange={(e) => handlePriceChange(idx, e.target.value)} placeholder="0"
                      style={{ position: 'absolute', left: COL_PRICE, width: 100, height: 36, borderRadius: 8, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 10, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} />
                  ) : (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_PRICE }}>{product.price?.toLocaleString()} ₽</span>
                  )}

                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059', position: 'absolute', left: COL_COST }}>{product.cost?.toLocaleString()} ₽</span>

                  <div style={{ position: 'absolute', left: COL_RELEVANCE, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {product.zadel_selected && relevance !== undefined && relevance !== null ? (
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: getRelevanceColor(relevance) }}>{relevance}%</span>
                    ) : !product.zadel_selected ? (
                      <>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F59E0B', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500, color: '#F59E0B' }}>Не подобрано</span>
                      </>
                    ) : (
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500, color: '#9CA3AF' }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
            {Array.from({ length: emptyRows }).map((_, i) => (
              <div key={`empty-${i}`} style={{ height: ROW_HEIGHT, backgroundColor: '#FFFFFF', borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Нижние блоки */}
      <div style={{ position: 'absolute', bottom: 30, left: 40, display: 'flex', gap: 15 }}>
        <div style={{ width: 520, height: 60, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={subBlockTextStyle}>Количество номенклатур</span>
            <span style={subBlockTextStyle}>{products.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={subBlockTextStyle}>На сумму</span>
            <span style={subBlockTextStyle}>{formatCost(totalCost)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={subBlockTextStyle}>НДС</span>
            <span style={subBlockTextStyle}>{formatCost(nds)}</span>
          </div>
        </div>

        <div style={{ width: 420, height: 60, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={subBlockLabelStyle}>Статус ТКП:</span>
            <span style={{ ...subBlockTextStyle, color: statusColorVal }}>{statusLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={subBlockLabelStyle}>Инвойс:</span>
            <span style={{ ...subBlockTextStyle, color: invoiceColorVal }}>{invoiceLabel}</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 30 }}>
        {showSendButton && <button onClick={handleSendTkp} disabled={saving} style={{ ...bottomButtonStyle, width: 180, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#FFFFFF', backgroundColor: saving ? '#BCC8FF' : '#10B981', border: 'none', opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Отправка...' : 'Отправить ТКП'}</button>}
        {showCancelTkp && <button onClick={handleCancelTkp} style={{ ...bottomButtonStyle, width: 180, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#FFFFFF', backgroundColor: '#FF3052', border: 'none', cursor: 'pointer' }}>Отменить ТКП</button>}
        {showInrealiseButton && <button onClick={handleInrealiseTkp} style={{ ...bottomButtonStyle, width: 180, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#FFFFFF', backgroundColor: '#666EFE', border: 'none', cursor: 'pointer' }}>Взять в реализацию</button>}
        {showCompleteButton && <button onClick={handleCompleteTkp} style={{ ...bottomButtonStyle, width: 180, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#FFFFFF', backgroundColor: '#8B5CF6', border: 'none', cursor: 'pointer' }}>Завершить ТКП</button>}
        {showPayButton && <button onClick={handlePayTkp} style={{ ...bottomButtonStyle, width: 180, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#FFFFFF', backgroundColor: '#F59E0B', border: 'none', cursor: 'pointer' }}>Отметить оплату</button>}
        <button onClick={handleClose} style={{ ...bottomButtonStyle, width: 116, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Закрыть</button>
      </div>

      <CatalogSelectPopup isOpen={catalogOpen} onClose={handleCatalogClose} onSelect={handleCatalogSelect} popupType="analogSelect" excludeUids={excludeUids} filterProduct={filterProduct} />

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
            {selectedProduct.specifications && selectedProduct.specifications.length > 0 && (
              <div style={{ marginBottom: 20 }}><h3 style={sectionTitleStyle}>Характеристики</h3><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedProduct.specifications.map((spec, i) => <div key={i} style={{ display: 'flex', gap: 10 }}><span style={labelStyle}>{spec.characteristic}:</span><span style={valueStyle}>{spec.value} {spec.unit || ''}</span></div>)}
              </div></div>
            )}
            {selectedProduct.barcode && <div style={{ marginBottom: 20 }}><h3 style={sectionTitleStyle}>Штрихкод</h3><div style={{ display: 'flex', gap: 10 }}><span style={labelStyle}>Код:</span><span style={valueStyle}>{selectedProduct.barcode.code || '—'}</span></div>{selectedProduct.barcode.codeimage && <img src={`data:image/png;base64,${selectedProduct.barcode.codeimage}`} alt="Штрихкод" style={{ maxWidth: 300, marginTop: 8 }} />}</div>}
            {selectedProduct.sku && <div style={{ marginBottom: 20 }}><h3 style={sectionTitleStyle}>SKU</h3><div style={{ display: 'flex', gap: 10 }}><span style={labelStyle}>Код:</span><span style={valueStyle}>{selectedProduct.sku.code || '—'}</span></div>{selectedProduct.sku.image && <img src={`data:image/png;base64,${selectedProduct.sku.image}`} alt="SKU" style={{ maxWidth: 150, marginTop: 8 }} />}</div>}
            {selectedProduct.images && selectedProduct.images.length > 0 && <div style={{ marginBottom: 20 }}><h3 style={sectionTitleStyle}>Изображения</h3><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{selectedProduct.images.map((img, i) => <img key={i} src={`data:image/png;base64,${img}`} alt="" style={{ width: 150, height: 150, objectFit: 'contain', borderRadius: 8, border: '1px solid rgba(102,110,254,0.15)' }} />)}</div></div>}
            {selectedProduct.draws && selectedProduct.draws.length > 0 && <div style={{ marginBottom: 20 }}><h3 style={sectionTitleStyle}>Чертежи</h3><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{selectedProduct.draws.map((draw, i) => <img key={i} src={`data:image/png;base64,${draw}`} alt="" style={{ width: 200, height: 150, objectFit: 'contain', borderRadius: 8, border: '1px solid rgba(102,110,254,0.15)' }} />)}</div></div>}
            {selectedProduct.analogues && selectedProduct.analogues.length > 0 && <div style={{ marginBottom: 20 }}><h3 style={sectionTitleStyle}>Аналоги</h3>{selectedProduct.analogues.map((analog, i) => <div key={i} style={{ display: 'flex', gap: 20, padding: '8px 0' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059' }}>{analog.name}</span><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280' }}>{analog.model}</span><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF' }}>UID: {analog.uid}</span></div>)}</div>}
          </div>
        </div>
      )}

      {tooltip && <div style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)', backgroundColor: '#2D4059', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 6, whiteSpace: 'nowrap', zIndex: 9999, pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>{tooltip.text}</div>}
    </div>
  );
};

export default TkpCreatePage;