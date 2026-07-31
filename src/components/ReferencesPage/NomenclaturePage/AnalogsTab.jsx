// AnalogsTab.jsx — ПОЛНЫЙ ФАЙЛ (read-only для Zadel, все кнопки замучены)
import React, { useState, useRef, useEffect } from 'react';
import CustomScrollbar from '../../CustomScrollbar';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import AnalogIcon from '../../../assets/References/NomenclatureCreatePage/analog.svg';
import Button1 from '../../../assets/References/NomenclatureCreatePage/button1.svg';
import Button4 from '../../../assets/References/NomenclatureCreatePage/button4.svg';
import Button5 from '../../../assets/References/NomenclatureCreatePage/button5.svg';

const AnalogsTab = (props) => {
  const {
    uid, isEdit,
    selectedAccountingGroupId, selectedNomenclatureGroupId, selectedNomenclatureTypeId,
  } = props;

  const scrollContainerRef = useRef(null);
  const [hasScroll, setHasScroll] = useState(false);
  const [analogs, setAnalogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const blockStyle = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const mutedButtonStyle = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, opacity: 0.4 };
  const cs = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  const TABLE_WIDTH = 1660;
  const TABLE_HEIGHT = 464;
  const ROW_HEIGHT = 58;
  const HEADER_HEIGHT = 58;
  const VISIBLE_ROWS = 7;

  const COL_NAME = 50;
  const COL_MODEL = 640;
  const COL_COMPATIBILITY = 1400;

  const fetchAnalogs = async () => {
    if (!uid) return;
    setIsLoading(true);
    try {
      const res = await AxiosService.get(ConstantInfo.restApiNomenclatureAnalogs(uid));
      setAnalogs(res.data || []);
    } catch (e) {
      console.error('Ошибка загрузки аналогов:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (uid && isEdit) fetchAnalogs();
  }, [uid, isEdit]);

  const checkScroll = () => {
    const c = scrollContainerRef.current;
    if (c) setHasScroll(c.scrollHeight > c.clientHeight);
  };

  useEffect(() => { const t = setTimeout(checkScroll, 100); return () => clearTimeout(t); }, [analogs]);
  useEffect(() => {
    const c = scrollContainerRef.current;
    if (!c) return;
    checkScroll();
    c.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(c);
    return () => { c.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, []);

  const totalRows = Math.max(analogs.length, VISIBLE_ROWS);

  return (
    <div style={cs}>
      <div style={{ ...blockStyle, width: 1740, height: 565, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 14, left: 40, right: 40, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 8, paddingLeft: 0 }}>
            <button style={mutedButtonStyle}><img src={Button1} alt="" style={{ width: 18, height: 18 }} /></button>
            <button style={mutedButtonStyle}><img src={Button4} alt="" style={{ width: 14, height: 14 }} /></button>
            <button style={mutedButtonStyle}><img src={Button5} alt="" style={{ width: 18, height: 18 }} /></button>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', position: 'relative', paddingLeft: 0, paddingRight: 0, boxSizing: 'border-box' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_NAME }}>НАИМЕНОВАНИЕ</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_MODEL }}>МОДЕЛЬ</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_COMPATIBILITY }}>ПРИМЕНИМОСТЬ</span>
              </div>
              
              <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div style={{ minWidth: TABLE_WIDTH }}>
                  {isLoading ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Загрузка...</span>
                    </div>
                  ) : (
                    <>
                      {Array.from({ length: totalRows }).map((_, index) => {
                        const analog = analogs[index];
                        const isRealData = !!analog;

                        if (!isRealData) {
                          return (
                            <div 
                              key={`empty-${index}`} 
                              style={{ 
                                height: ROW_HEIGHT, 
                                backgroundColor: '#FFFFFF', 
                                boxSizing: 'border-box',
                                display: 'flex', 
                                alignItems: 'center',
                                borderTop: '0.5px solid #E5ECF5',
                                borderBottom: '0.5px solid #E5ECF5',
                              }} 
                            />
                          );
                        }

                        const isFirst = index === 0;
                        const isLast = index === analogs.length - 1;

                        return (
                          <div 
                            key={analog.uid}
                            style={{ 
                              height: ROW_HEIGHT, 
                              display: 'flex', 
                              alignItems: 'center', 
                              backgroundColor: '#FFFFFF', 
                              position: 'relative', 
                              boxSizing: 'border-box',
                              cursor: 'default',
                              userSelect: 'none',
                              borderTop: isFirst ? 'none' : '0.5px solid #E5ECF5',
                              borderBottom: isLast ? 'none' : '0.5px solid #E5ECF5',
                            }}
                          >
                            <img src={AnalogIcon} alt="" style={{ position: 'absolute', left: 21, width: 20, height: 20, flexShrink: 0 }} />
                            <span style={{ position: 'absolute', left: COL_NAME, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: COL_MODEL - COL_NAME - 30 }}>
                              {analog.analogMaterialName}
                            </span>
                            <span style={{ position: 'absolute', left: COL_MODEL, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: COL_COMPATIBILITY - COL_MODEL - 30 }}>
                              {analog.analogModelName || '-'}
                            </span>
                            <span style={{ position: 'absolute', left: COL_COMPATIBILITY, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: TABLE_WIDTH - COL_COMPATIBILITY - 40 }}>
                              {analog.compatibilityPercent}%
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {hasScroll && (
              <div style={{ width: 10, height: TABLE_HEIGHT, paddingTop: HEADER_HEIGHT }}>
                <CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalogsTab;