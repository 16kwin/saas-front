// MainTab.jsx — ПОЛНЫЙ ФАЙЛ (read-only для Zadel)
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import FormField from '../../elements/FormField';
import Icon8 from '../../../assets/References/NomenclatureCreatePage/Icon8.svg';
import Icon9 from '../../../assets/References/NomenclatureCreatePage/Icon9.svg';
import Icon10 from '../../../assets/References/NomenclatureCreatePage/Icon10.svg';
import Icon101 from '../../../assets/References/NomenclatureCreatePage/Icon101.svg';
import Icon11 from '../../../assets/References/NomenclatureCreatePage/Icon11.svg';
import Icon12 from '../../../assets/References/NomenclatureCreatePage/Icon12.svg';
import Icon21 from '../../../assets/References/NomenclatureCreatePage/Icon21.svg';
import Icon22 from '../../../assets/References/NomenclatureCreatePage/Icon22.svg';
import Icon31 from '../../../assets/References/NomenclatureCreatePage/Icon31.svg';
import Icon32 from '../../../assets/References/NomenclatureCreatePage/Icon32.svg';
import Icon41 from '../../../assets/References/NomenclatureCreatePage/Icon41.svg';
import Icon42 from '../../../assets/References/NomenclatureCreatePage/Icon42.svg';
import Icon51 from '../../../assets/References/NomenclatureCreatePage/Icon51.svg';
import Icon52 from '../../../assets/References/NomenclatureCreatePage/Icon52.svg';
import Icon61 from '../../../assets/References/NomenclatureCreatePage/Icon61.svg';
import Icon62 from '../../../assets/References/NomenclatureCreatePage/Icon62.svg';
import Icon71 from '../../../assets/References/NomenclatureCreatePage/Icon71.svg';
import Icon72 from '../../../assets/References/NomenclatureCreatePage/Icon72.svg';
import IconArt1 from '../../../assets/References/NomenclatureCreatePage/IconArt1.svg';
import IconArt2 from '../../../assets/References/NomenclatureCreatePage/IconArt2.svg';
import IconRating from '../../../assets/References/NomenclatureCreatePage/IconRating.svg';
import IconCODE from '../../../assets/References/NomenclatureCreatePage/CODE.svg';
import IconCODE1 from '../../../assets/References/NomenclatureCreatePage/CODE2.svg';
import IconCODE2 from '../../../assets/References/NomenclatureCreatePage/CODE3.svg';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';

const ToggleSwitch = React.memo(({ value }) => {
  const trackWidth = 26;
  const trackHeight = 13;
  const knobSize = 11;
  const padding = (trackHeight - knobSize) / 2;
  return (
    <div style={{ width: trackWidth, height: trackHeight, borderRadius: trackHeight / 2, backgroundColor: value ? '#666EFE' : 'rgba(45, 64, 89, 0.44)', cursor: 'default', position: 'relative', flexShrink: 0 }}>
      <motion.div
        initial={false}
        animate={{ x: value ? trackWidth - knobSize - padding * 2 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.5 }}
        style={{ width: knobSize, height: knobSize, borderRadius: '50%', backgroundColor: '#FFFFFF', position: 'absolute', top: padding, left: padding }}
      />
    </div>
  );
});

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
  return <div style={{ display: 'flex', gap: 2 }}>{stars}</div>;
};

const MainTab = (props) => {
  const {
    uid, code, name, article, description, isEdit, images,
    selectedCatalog, selectedAccountingGroup, selectedAccountingGroupId,
    selectedNomenclatureGroup, selectedNomenclatureGroupId,
    selectedNomenclatureType, selectedNomenclatureTypeId,
    usage, wasteMaterial, recycleMaterial,
    fullscreenImage, setFullscreenImage,
    localImages, serverBarcodes, serverSkus,
    localBarcodes, localSkus, isFinishedProduct
  } = props;

  const [averageRating, setAverageRating] = useState(0);
  const [localSelectedIndex, setLocalSelectedIndex] = useState(0);

  const fetchAverageRating = async () => {
    if (!uid || isFinishedProduct) return;
    try {
      const res = await AxiosService.get(ConstantInfo.restApiNomenclatureRatingsAverage(uid));
      setAverageRating(Math.round((res.data || 0) * 10) / 10);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (uid && isEdit) { fetchAverageRating(); }
  }, [uid, isEdit]);

  const displayImages = (localImages && localImages.length > 0)
    ? localImages.map(img => ({ uid: img.url, url: img.url, originalName: img.file.name }))
    : images;

  const prevImage = (e) => {
    e.stopPropagation();
    setLocalSelectedIndex((p) => p > 0 ? p - 1 : displayImages.length - 1);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setLocalSelectedIndex((p) => p < displayImages.length - 1 ? p + 1 : 0);
  };

  const currentBarcode = (localBarcodes && localBarcodes[0]) || (serverBarcodes && serverBarcodes[0]) || null;
  const currentSku = (localSkus && localSkus[0]) || (serverSkus && serverSkus[0]) || null;

  const labelStyle = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' };
  const blockStyle = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const cs = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };
  const grayBorder = '1px solid rgba(102, 110, 254, 0.15)';
  const activeBorder = '1px solid #666EFE';
  const FIELD_WIDTH = 340;
  const FIELD_HEIGHT = 44;
  const SELECT_WIDTH = 388;

  const getRatingStatus = () => {
    if (averageRating === 0) return 'Рейтинг отсутствует';
    if (averageRating <= 2) return 'Низкое качество';
    if (averageRating <= 4) return 'Среднее качество';
    return 'Высокое качество';
  };

  return (
    <div style={{ ...cs, display: 'flex', gap: 30 }}>
      {/* ЛЕВЫЙ БЛОК */}
      <div style={{ ...blockStyle, width: 792, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 40, left: 30 }}>
          <div style={{ pointerEvents: 'none' }}>
            <FormField
              width={FIELD_WIDTH} height={FIELD_HEIGHT}
              label="Код:"
              icon={Icon11} iconActive={Icon12}
              value={code ? String(code) : ''}
              type="input"
              onChange={() => {}}
            />
          </div>
          <div style={{ marginTop: 25, pointerEvents: 'none' }}>
            <FormField
              width={FIELD_WIDTH} height={FIELD_HEIGHT}
              label="Артикул:"
              icon={IconArt1} iconActive={IconArt2}
              value={article}
              placeholder="Артикул"
              type="input"
              onChange={() => {}}
            />
          </div>
        </div>
        <div style={{ position: 'absolute', top: 40, right: 52 }}>
          <div style={{ pointerEvents: 'none' }}>
            <FormField
              width={FIELD_WIDTH} height={FIELD_HEIGHT}
              label="Наименование:"
              icon={Icon21} iconActive={Icon22}
              value={name}
              placeholder="Введите название"
              type="input"
              onChange={() => {}}
            />
          </div>
          <div style={{ marginTop: 25, pointerEvents: 'none' }}>
            <FormField
              width={FIELD_WIDTH} height={FIELD_HEIGHT}
              label="Каталог:"
              icon={Icon31} iconActive={Icon32}
              value={selectedCatalog}
              placeholder="Выберите группу"
              type="select"
              rightIcon={Icon41} rightIconActive={Icon42}
              onRightIconClick={() => {}}
              onClick={() => {}}
            />
          </div>
        </div>
        <div style={{ position: 'absolute', top: 238, left: 30, right: 30 }}>
          <span style={labelStyle}>Описание:</span>
          <div style={{ width: 732, height: 263, borderRadius: 10, border: description ? activeBorder : grayBorder, backgroundColor: '#FFFFFF', marginTop: 11, position: 'relative' }}>
            <img src={description ? Icon52 : Icon51} alt="" style={{ width: 16, height: 16, position: 'absolute', top: 15, left: 15 }} />
            <textarea
              readOnly
              style={{ width: '100%', height: '100%', border: 'none', outline: 'none', paddingTop: 15, paddingLeft: 44, paddingRight: 15, paddingBottom: 15, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: description ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent', resize: 'none', borderRadius: 10, boxSizing: 'border-box', cursor: 'default' }}
              value={description}
              placeholder="Введите описание"
            />
          </div>
        </div>
      </div>

      {/* СРЕДНИЙ БЛОК */}
      <div style={{ ...blockStyle, width: 475, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 40, left: 30, right: 30, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={Icon8} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            <span style={{ ...labelStyle, marginLeft: 9 }}>Группа учета:</span>
          </div>
          <div style={{ width: SELECT_WIDTH, height: 44, borderRadius: 10, border: selectedAccountingGroupId ? activeBorder : grayBorder, backgroundColor: '#FFFFFF', marginTop: 11, display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, cursor: 'default', position: 'relative', boxSizing: 'border-box' }}>
            <img src={selectedAccountingGroup ? Icon62 : Icon61} alt="" style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span style={{ marginLeft: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: selectedAccountingGroup ? '#666EFE' : '#9CA3AF' }}>
              {selectedAccountingGroup || 'Выбрать группу учета'}
            </span>
            <img src={Icon9} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
          </div>
        </div>
        <div style={{ position: 'absolute', top: 145, left: 30, right: 30, pointerEvents: 'none' }}>
          <FormField
            width={SELECT_WIDTH} height={FIELD_HEIGHT}
            label="Группа номенклатуры:"
            icon={Icon31} iconActive={Icon32}
            value={selectedNomenclatureGroup}
            placeholder={selectedAccountingGroupId ? 'Выбрать группу' : 'Сначала выберите группу учета'}
            type="select"
            locked={!selectedAccountingGroupId}
            rightIcon={Icon41} rightIconActive={Icon42}
            onRightIconClick={() => {}}
            onClick={() => {}}
          />
        </div>
        <div style={{ position: 'absolute', top: 250, left: 30, right: 30, pointerEvents: 'none' }}>
          <FormField
            width={SELECT_WIDTH} height={FIELD_HEIGHT}
            label="Вид номенклатуры:"
            icon={Icon71} iconActive={Icon72}
            value={selectedNomenclatureType}
            placeholder={selectedNomenclatureGroupId ? 'Выбрать вид' : 'Сначала выберите группу номенклатуры'}
            type="select"
            locked={!selectedNomenclatureGroupId}
            rightIcon={Icon41} rightIconActive={Icon42}
            onRightIconClick={() => {}}
            onClick={() => {}}
          />
        </div>
        
        {!isFinishedProduct && (
          <div style={{ position: 'absolute', top: 345, left: 70, right: 70, height: 85, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'default' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Многократное использование</span>
              <ToggleSwitch value={usage} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'default' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Сдача в лом (отходы)</span>
              <ToggleSwitch value={wasteMaterial} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'default' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Сдача на переточку</span>
              <ToggleSwitch value={recycleMaterial} />
            </div>
          </div>
        )}

        {!isFinishedProduct && (
          <div style={{ position: 'absolute', top: 460, left: 30, right: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={Icon8} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#2D4059', marginLeft: 9 }}>Рейтинг номенклатуры:</span>
              <div style={{ marginLeft: 9, width: 18, height: 18 }}>
                <img src={IconRating} alt="Рейтинг" style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 17, marginLeft: 27 }}>
              <StarRatingSmall value={averageRating} size={18} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 10 }}>
                Средний рейтинг: {averageRating}
              </span>
            </div>
          </div>
        )}
        {!isFinishedProduct && (
          <div style={{ position: 'absolute', bottom: 23, left: 0, right: 0, textAlign: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#666EFE' }}>
              {getRatingStatus()}
            </span>
          </div>
        )}
      </div>

      {/* ПРАВЫЙ БЛОК */}
      <div style={{ ...blockStyle, width: 413, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, left: 30 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Изображение</span>
        </div>
        <div style={{ position: 'absolute', top: 49, left: 30, width: 353, height: 311, border: '1px solid rgba(230, 232, 248, 0.44)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 351, height: 47, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(230, 232, 248, 0.44)', cursor: 'default' }}>
            <img src={Icon10} alt="Добавить" style={{ width: 21, height: 21 }} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#FAFBFC' }}>
            {displayImages.length > 1 && (
              <button onClick={prevImage} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}>
                <img src={Icon101} alt="" style={{ width: 13, height: 19, transform: 'scaleX(-1)' }} />
              </button>
            )}
            {displayImages.length > 0 ? (
              <div style={{ width: 231, height: 193, backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} onClick={() => setFullscreenImage(true)}>
                <img src={displayImages[localSelectedIndex]?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ) : (
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Нет изображений</span>
            )}
            {displayImages.length > 1 && (
              <button onClick={nextImage} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}>
                <img src={Icon101} alt="" style={{ width: 13, height: 19 }} />
              </button>
            )}
          </div>
          <div style={{ width: 351, height: 47, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 6, borderTop: '1px solid rgba(230, 232, 248, 0.44)', overflowX: 'auto' }}>
            {displayImages.map((img, idx) => (
              <div key={idx} onClick={() => setLocalSelectedIndex(idx)} style={{ width: 43, height: 36, borderRadius: 4, border: idx === localSelectedIndex ? '2px solid #666EFE' : '2px solid transparent', flexShrink: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative', backgroundColor: '#F5F6FA' }}>
                <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Штрихкод */}
        <div style={{ position: 'absolute', top: 379, left: 30, right: 30 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Штрихкод:</span>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <div style={{ width: 76, height: 44, borderRadius: 10, border: currentBarcode ? activeBorder : grayBorder, backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'default' }}>
              {currentBarcode && <img src={IconCODE} alt="" style={{ width: 57, height: 25 }} />}
            </div>
            <div style={{ flex: 1, height: 44, borderRadius: 10, border: currentBarcode ? activeBorder : grayBorder, backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, cursor: 'default', position: 'relative', boxSizing: 'border-box' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: currentBarcode ? '#666EFE' : '#9CA3AF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentBarcode?.codeValue || 'Добавить штрихкод'}
              </span>
              <div style={{ width: 29, height: 22, flexShrink: 0, position: 'absolute', right: 13 }}>
                <img src={IconCODE1} alt="" style={{ width: 29, height: 22, opacity: currentBarcode ? 1 : 0.4 }} />
              </div>
            </div>
          </div>
        </div>

        {/* SKU */}
        <div style={{ position: 'absolute', top: 465, left: 30, right: 30 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>SKU:</span>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <div style={{ width: 76, height: 44, borderRadius: 10, border: currentSku ? activeBorder : grayBorder, backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'default' }}>
              {currentSku && <img src={IconCODE2} alt="" style={{ width: 31, height: 31 }} />}
            </div>
            <div style={{ flex: 1, height: 44, borderRadius: 10, border: currentSku ? activeBorder : grayBorder, backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, cursor: 'default', position: 'relative', boxSizing: 'border-box' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: currentSku ? '#666EFE' : '#9CA3AF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentSku?.codeValue || 'Добавить SKU'}
              </span>
              <div style={{ width: 29, height: 22, flexShrink: 0, position: 'absolute', right: 13 }}>
                <img src={IconCODE1} alt="" style={{ width: 29, height: 22, opacity: currentSku ? 1 : 0.4 }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {fullscreenImage && displayImages[localSelectedIndex] && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setFullscreenImage(false)}>
          <img src={displayImages[localSelectedIndex].url} alt="" style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
};

export default MainTab;