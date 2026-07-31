// CharacteristicsTab.jsx — read-only версия для Zadel с тултипами
import React, { useState, useEffect, useRef } from 'react';
import CustomScrollbar from '../../../components/CustomScrollbar';
import Icon10 from '../../../assets/References/NomenclatureCreatePage/Icon10.svg';
import Icon101 from '../../../assets/References/NomenclatureCreatePage/Icon101.svg';
import IconChar11 from '../../../assets/References/NomenclatureCreatePage/Characteristics11.svg';
import IconChar12 from '../../../assets/References/NomenclatureCreatePage/Characteristics12.svg';
import IconChar21 from '../../../assets/References/NomenclatureCreatePage/Characteristics21.svg';
import IconChar22 from '../../../assets/References/NomenclatureCreatePage/Characteristics22.svg';
import IconChar31 from '../../../assets/References/NomenclatureCreatePage/Characteristics31.svg';
import IconChar32 from '../../../assets/References/NomenclatureCreatePage/Characteristics32.svg';
import IconChar41 from '../../../assets/References/NomenclatureCreatePage/Characteristics41.svg';
import IconChar42 from '../../../assets/References/NomenclatureCreatePage/Characteristics42.svg';
import IconChar51 from '../../../assets/References/NomenclatureCreatePage/Characteristics51.svg';
import IconChar52 from '../../../assets/References/NomenclatureCreatePage/Characteristics52.svg';
import Icon41 from '../../../assets/References/NomenclatureCreatePage/Icon41.svg';
import Icon42 from '../../../assets/References/NomenclatureCreatePage/Icon42.svg';
import Button1 from '../../../assets/References/NomenclatureCreatePage/button1.svg';
import Button2 from '../../../assets/References/NomenclatureCreatePage/button2.svg';
import Button3 from '../../../assets/References/NomenclatureCreatePage/button3.svg';
import Button4 from '../../../assets/References/NomenclatureCreatePage/button4.svg';
import Button5 from '../../../assets/References/NomenclatureCreatePage/button5.svg';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';

const REQUIRED_ATTRIBUTES = ['Длина', 'Ширина', 'Высота', 'Масса'];
const getDraftKey = (uid) => `nomenclature_draft_${uid}`;

const CharacteristicsTab = (props) => {
  const {
    uid, isEdit, blueprints,
    selectedUnit, selectedManufacturer, selectedBrand, selectedModel, selectedCountry,
    fullscreenBlueprint, localCharacteristics = [], setLocalCharacteristics,
    localBlueprints, setLocalBlueprints, setFullscreenBlueprint, handleDeleteBlueprint
  } = props;

  const [measures, setMeasures] = useState([]);
  const [typeAttributes, setTypeAttributes] = useState([]);
  const [isLoadingChars, setIsLoadingChars] = useState(false);
  const [localBlueprintSelectedIndex, setLocalBlueprintSelectedIndex] = useState(0);
  const [localBlueprintContextMenu, setLocalBlueprintContextMenu] = useState(null);
  const scrollContainerRef = useRef(null);
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  const TABLE_WIDTH = 1070;
  const TABLE_HEIGHT = 324;
  const ROW_HEIGHT = 54;
  const HEADER_HEIGHT = 54;
  const VISIBLE_ROWS = 5;
  const COL_CHAR = 50;
  const COL_DESIGNATION = 390;
  const COL_MEASURE = 644;
  const COL_VALUE = 844;

  const labelStyle = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' };
  const blockStyle = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const mutedButtonStyle = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, opacity: 0.4 };
  const mutedCreateButtonStyle = { width: 122, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'default', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0, opacity: 0.4 };
  const cs = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };
  const generateLocalId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const displayBlueprints = (localBlueprints && localBlueprints.length > 0)
    ? localBlueprints.map(bp => ({ uid: bp.url, url: bp.url, originalName: bp.file.name }))
    : (blueprints || []);

  const isLocalBlueprints = localBlueprints && localBlueprints.length > 0;

  useEffect(() => {
    AxiosService.get(ConstantInfo.restApiNomenclatureMeasures)
      .then(res => setMeasures(res.data || []))
      .catch(e => console.error(e));
    AxiosService.get(ConstantInfo.restApiNomenclatureTypeAttributes)
      .then(res => setTypeAttributes(res.data || []))
      .catch(e => console.error(e));
  }, []);

  useEffect(() => {
    if (!uid) return;
    if (isEdit) {
      setIsLoadingChars(true);
      AxiosService.get(ConstantInfo.restApiNomenclatureCharacteristics(uid))
        .then(res => {
          const serverChars = (res.data || []).map(c => ({
            localId: generateLocalId(),
            uid: c.uid,
            attributeTypeUid: c.attributeTypeUid,
            attributeName: c.attributeName,
            customName: c.customName,
            value: c.value || '',
            measureUid: c.measureUid,
            measureName: c.measureName,
            isCustom: c.isCustom,
            isRequired: c.attributeName && REQUIRED_ATTRIBUTES.includes(c.attributeName)
          }));
          try {
            const draftKey = getDraftKey(uid);
            const raw = localStorage.getItem(draftKey);
            if (raw) {
              const draft = JSON.parse(raw);
              if (draft.localCharacteristics && Array.isArray(draft.localCharacteristics) && draft.localCharacteristics.length > 0) {
                setLocalCharacteristics(draft.localCharacteristics);
                return;
              }
            }
          } catch (e) {}
          setLocalCharacteristics(serverChars);
        })
        .catch(e => console.error(e))
        .finally(() => setIsLoadingChars(false));
    }
  }, [uid, isEdit]);

  useEffect(() => {
    if (!localBlueprintContextMenu) return;
    const h = () => setLocalBlueprintContextMenu(null);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [localBlueprintContextMenu]);

  useEffect(() => {
    if (!tooltip) return;
    const t = setTimeout(() => setTooltip(null), 3000);
    return () => clearTimeout(t);
  }, [tooltip]);

  const chars = localCharacteristics || [];
  const totalRows = Math.max(chars.length, VISIBLE_ROWS);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setHasVerticalScroll(container.scrollHeight > container.clientHeight);
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    return () => clearTimeout(timer);
  }, [chars.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    checkScroll();
    container.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(container);
    return () => {
      container.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, []);

  const handleLocalDeleteBlueprint = (index) => {
    setLocalBlueprints((p) => {
      const n = [...p];
      URL.revokeObjectURL(n[index].url);
      n.splice(index, 1);
      return n;
    });
    if (localBlueprintSelectedIndex >= displayBlueprints.length - 1) {
      setLocalBlueprintSelectedIndex(Math.max(0, displayBlueprints.length - 2));
    }
  };

  const prevBp = (e) => {
    e.stopPropagation();
    setLocalBlueprintSelectedIndex((p) => p > 0 ? p - 1 : displayBlueprints.length - 1);
  };

  const nextBp = (e) => {
    e.stopPropagation();
    setLocalBlueprintSelectedIndex((p) => p < displayBlueprints.length - 1 ? p + 1 : 0);
  };

  const handleBlueprintContextMenu = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setLocalBlueprintContextMenu({ x: e.clientX, y: e.clientY, index });
  };

  const getDesignationByAttributeType = (attributeTypeUid) => {
    if (!attributeTypeUid) return '-';
    const attr = typeAttributes.find(a => a.uid === attributeTypeUid);
    return attr?.designation || '-';
  };

  const getMeasureName = (measureUid) => {
    if (!measureUid) return '-';
    const m = measures.find(m => m.uid === measureUid);
    return m?.name || '-';
  };

  const handleCellMouseEnter = (e, text) => {
    const el = e.currentTarget;
    if (el.scrollWidth > el.clientWidth) {
      const rect = el.getBoundingClientRect();
      setTooltip({ text, x: rect.left + rect.width / 2, y: rect.bottom + 4 });
    }
  };

  const handleCellMouseLeave = () => setTooltip(null);

  const renderReadOnlySelectField = (isFilled, selectedText, placeholder, leftIcon, leftIconFilled) => (
    <div style={{
      width: 300, height: 44, borderRadius: 10,
      border: isFilled ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)',
      backgroundColor: '#FFFFFF', marginTop: 11, display: 'flex',
      alignItems: 'center', paddingLeft: 13, paddingRight: 13,
      fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
      color: isFilled ? '#666EFE' : '#9CA3AF', cursor: 'default', boxSizing: 'border-box'
    }}>
      <img src={isFilled ? leftIconFilled : leftIcon} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
      <span style={{ marginLeft: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {selectedText || placeholder}
      </span>
      <img src={isFilled ? Icon42 : Icon41} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
    </div>
  );

  const cellTextStyle = (left, maxWidth) => ({
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059',
    position: 'absolute', left: `${left}px`, maxWidth: `${maxWidth}px`,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ ...cs, display: 'flex', flexDirection: 'column', gap: 15 }}>
      <div style={{ ...blockStyle, width: 1740, height: 132, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 30, left: 30, display: 'flex', gap: 45, pointerEvents: 'none' }}>
          <div>
            <span style={labelStyle}>Единица измерения:</span>
            {renderReadOnlySelectField(!!selectedUnit, selectedUnit, 'Выбрать', IconChar11, IconChar12)}
          </div>
          <div>
            <span style={labelStyle}>Производитель:</span>
            {renderReadOnlySelectField(!!selectedManufacturer, selectedManufacturer, 'Выбрать', IconChar21, IconChar22)}
          </div>
          <div>
            <span style={labelStyle}>Бренд:</span>
            {renderReadOnlySelectField(!!selectedBrand, selectedBrand, selectedManufacturer ? 'Выбрать' : 'Сначала выберите производителя', IconChar31, IconChar32)}
          </div>
          <div>
            <span style={labelStyle}>Модель:</span>
            {renderReadOnlySelectField(!!selectedModel, selectedModel, selectedBrand ? 'Выбрать' : 'Сначала выберите бренд', IconChar41, IconChar42)}
          </div>
          <div>
            <span style={labelStyle}>Страна происхождения:</span>
            {renderReadOnlySelectField(!!selectedCountry, selectedCountry, 'Выбрать', IconChar51, IconChar52)}
          </div>
        </div>
      </div>

      <div style={{ ...blockStyle, width: 1740, height: 418, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 15, left: 64 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Чертеж</span>
          <div style={{ marginTop: 12, width: 518, height: 311, border: '1px solid rgba(230, 232, 248, 0.44)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 516, height: 47, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(230, 232, 248, 0.44)', cursor: 'default', opacity: 0.4 }}>
              <img src={Icon10} alt="Добавить" style={{ width: 21, height: 21 }} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#FAFBFC' }}>
              {displayBlueprints.length > 1 && (
                <button onClick={prevBp} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}>
                  <img src={Icon101} alt="" style={{ width: 13, height: 19, transform: 'scaleX(-1)' }} />
                </button>
              )}
              {displayBlueprints.length > 0 && displayBlueprints[localBlueprintSelectedIndex] ? (
                <div onContextMenu={(e) => handleBlueprintContextMenu(e, localBlueprintSelectedIndex)} style={{ width: 231, height: 193, backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} onClick={() => setFullscreenBlueprint(true)}>
                  <img src={displayBlueprints[localBlueprintSelectedIndex].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              ) : (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Нет чертежей</span>
              )}
              {displayBlueprints.length > 1 && (
                <button onClick={nextBp} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}>
                  <img src={Icon101} alt="" style={{ width: 13, height: 19 }} />
                </button>
              )}
            </div>
            <div style={{ width: 516, height: 47, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 6, borderTop: '1px solid rgba(230, 232, 248, 0.44)', overflowX: 'auto' }}>
              {displayBlueprints.map((bp, idx) => (
                <div key={bp.uid || idx} onClick={() => setLocalBlueprintSelectedIndex(idx)} onContextMenu={(e) => handleBlueprintContextMenu(e, idx)} style={{ width: 43, height: 36, borderRadius: 4, border: idx === localBlueprintSelectedIndex ? '2px solid #666EFE' : '2px solid transparent', flexShrink: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative', backgroundColor: '#F5F6FA' }}>
                  <img src={bp.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', top: 14, left: 634, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 8, paddingLeft: 15 }}>
            <button style={mutedButtonStyle}><img src={Button1} alt="" style={{ width: 18, height: 18 }} /></button>
            <button style={mutedButtonStyle}><img src={Button2} alt="" style={{ width: 20, height: 14 }} /></button>
            <button style={mutedButtonStyle}><img src={Button3} alt="" style={{ width: 18, height: 18 }} /></button>
            <div style={{ width: 182 }} />
            <button style={mutedCreateButtonStyle}>
              <img src={Button4} alt="" style={{ width: 14, height: 14, marginLeft: 13 }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 13 }}>Создать</span>
            </button>
            <button style={mutedButtonStyle}><img src={Button5} alt="" style={{ width: 18, height: 18 }} /></button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', position: 'relative', paddingLeft: 0, paddingRight: 0, boxSizing: 'border-box' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_CHAR }}>ХАРАКТЕРИСТИКА</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_DESIGNATION }}>ОБОЗНАЧЕНИЕ</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_MEASURE }}>ЕД.ИЗМ</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_VALUE }}>ЗНАЧЕНИЕ</span>
              </div>
              <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div style={{ minWidth: TABLE_WIDTH }}>
                  {isLoadingChars ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Загрузка...</span>
                    </div>
                  ) : (
                    <>
                      {Array.from({ length: totalRows }).map((_, index) => {
                        const char = chars[index];
                        if (!char) {
                          return (
                            <div key={`empty-${index}`} style={{ height: ROW_HEIGHT, backgroundColor: '#FFFFFF', boxSizing: 'border-box', display: 'flex', alignItems: 'center', borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5' }} />
                          );
                        }
                        const isRequired = char.isRequired;
                        const designation = getDesignationByAttributeType(char.attributeTypeUid);
                        const measureName = getMeasureName(char.measureUid);
                        const isFirst = index === 0;
                        const isLast = index === chars.length - 1;
                        const charName = char.attributeName || char.customName || 'Характеристика';
                        const charValue = char.value || '-';
                        return (
                          <div key={char.localId} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', position: 'relative', boxSizing: 'border-box', cursor: 'default', userSelect: 'none', borderTop: isFirst ? 'none' : '0.5px solid #E5ECF5', borderBottom: isLast ? 'none' : '0.5px solid #E5ECF5' }}>
                            <span onMouseEnter={(e) => handleCellMouseEnter(e, charName)} onMouseLeave={handleCellMouseLeave} style={{ ...cellTextStyle(COL_CHAR, COL_DESIGNATION - COL_CHAR - 20), fontWeight: isRequired ? 600 : 400 }}>
                              {charName}{isRequired && <span style={{ color: '#FF3052', marginLeft: 2 }}>*</span>}
                            </span>
                            <span onMouseEnter={(e) => handleCellMouseEnter(e, designation)} onMouseLeave={handleCellMouseLeave} style={{ ...cellTextStyle(COL_DESIGNATION, COL_MEASURE - COL_DESIGNATION - 20), fontWeight: 600 }}>
                              {designation}
                            </span>
                            <span onMouseEnter={(e) => handleCellMouseEnter(e, measureName)} onMouseLeave={handleCellMouseLeave} style={cellTextStyle(COL_MEASURE, COL_VALUE - COL_MEASURE - 20)}>
                              {measureName}
                            </span>
                            <span onMouseEnter={(e) => handleCellMouseEnter(e, charValue)} onMouseLeave={handleCellMouseLeave} style={cellTextStyle(COL_VALUE, TABLE_WIDTH - COL_VALUE - 60)}>
                              {charValue}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </div>
            {hasVerticalScroll && (
              <div style={{ width: 10, height: TABLE_HEIGHT, paddingTop: HEADER_HEIGHT }}>
                <CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Тултип */}
      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x, top: tooltip.y,
          transform: 'translateX(-50%)', backgroundColor: '#2D4059',
          color: '#FFFFFF', fontFamily: 'Inter, sans-serif',
          fontSize: 13, fontWeight: 500, padding: '6px 12px',
          borderRadius: 6, whiteSpace: 'nowrap', zIndex: 9999,
          pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          {tooltip.text}
        </div>
      )}
      
      {localBlueprintContextMenu && (
        <div style={{
          position: 'fixed', top: localBlueprintContextMenu.y,
          left: localBlueprintContextMenu.x, width: 150,
          backgroundColor: '#FFFFFF', borderRadius: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001,
          display: 'flex', flexDirection: 'column', padding: '8px 0'
        }} onClick={e => e.stopPropagation()}>
          <button onClick={() => {
            isLocalBlueprints
              ? handleLocalDeleteBlueprint(localBlueprintContextMenu.index)
              : handleDeleteBlueprint(displayBlueprints[localBlueprintContextMenu.index]?.uid);
            setLocalBlueprintContextMenu(null);
          }} style={{
            width: '100%', height: 40, border: 'none',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', paddingLeft: 20,
            fontFamily: 'Inter, sans-serif', fontSize: 15,
            fontWeight: 400, color: '#2D4059'
          }}>
            Удалить
          </button>
        </div>
      )}
      
      {fullscreenBlueprint && displayBlueprints[localBlueprintSelectedIndex] && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw',
          height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)',
          zIndex: 10001, display: 'flex', alignItems: 'center',
          justifyContent: 'center'
        }} onClick={() => setFullscreenBlueprint(false)}>
          <img src={displayBlueprints[localBlueprintSelectedIndex].url} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
};

export default CharacteristicsTab;