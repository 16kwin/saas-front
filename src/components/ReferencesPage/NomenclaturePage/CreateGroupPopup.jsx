// CreateGroupPopup.tsx — полный файл
import React, { useState, useEffect } from 'react';
import CatalogSelectPopup from './CatalogSelectPopup';
import Icon31 from '../../../assets/References/NomenclatureCreatePage/Icon31.svg';
import Icon32 from '../../../assets/References/NomenclatureCreatePage/Icon32.svg';
import Icon41 from '../../../assets/References/NomenclatureCreatePage/Icon41.svg';
import Icon42 from '../../../assets/References/NomenclatureCreatePage/Icon42.svg';

interface GroupOption {
  uid: string;
  name: string;
}

interface CreateGroupPopupProps {
  isOpen: boolean;
  currentParentName: string | null;
  currentParentUid?: string | null;
  groups: GroupOption[];
  onClose: () => void;
  onSubmit: (name: string, parentUid: string | null) => void;
  isLoading: boolean;
}

let globalZIndex = 10003;

const getNextZIndex = () => {
  globalZIndex += 1;
  return globalZIndex;
};

const CreateGroupPopup: React.FC<CreateGroupPopupProps> = ({ isOpen, currentParentName, currentParentUid, groups, onClose, onSubmit, isLoading }) => {
  const [name, setName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedParentName, setSelectedParentName] = useState<string>('');
  const [showCatalogSelect, setShowCatalogSelect] = useState(false);
  const [zIndex, setZIndex] = useState(10003);

  useEffect(() => {
    if (isOpen) {
      setZIndex(getNextZIndex());
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedParentId(currentParentUid || null);
    setSelectedParentName(currentParentName || '');
  }, [currentParentUid, currentParentName]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit(name.trim(), selectedParentId);
    setName('');
    setSelectedParentId(currentParentUid || null);
    setSelectedParentName(currentParentName || '');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    else if (e.key === 'Escape') onClose();
  };

  const handleCatalogSelect = (id: string, catalogName: string) => {
    setSelectedParentId(id);
    setSelectedParentName(catalogName);
    setShowCatalogSelect(false);
  };

  const popupWidth = 500;
  const horizontalPadding = 35;
  const fieldWidth = 430;

  return (
    <>
      <div
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.3)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex,
        }}
        onClick={onClose}
      >
        <div
          style={{
            width: `${popupWidth}px`, backgroundColor: '#FFFFFF', borderRadius: '20px',
            padding: '30px 35px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{
            fontFamily: 'Inter, sans-serif', fontSize: '17px', fontWeight: 700,
            color: '#2D4059', margin: '0 0 30px 0', textAlign: 'center',
          }}>
            Создание каталога
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500,
              color: '#2D4059', display: 'block', marginBottom: '7px',
            }}>
              Название каталога
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите название"
              autoFocus
              style={{
                width: `${fieldWidth}px`, height: '44px', borderRadius: '10px',
                border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF',
                paddingLeft: '12px', paddingRight: '12px', fontFamily: 'Inter, sans-serif',
                fontSize: '14px', fontWeight: 500, color: '#2D4059', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{
              fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500,
              color: '#2D4059', display: 'block', marginBottom: '7px',
            }}>
              Выбрать родительский каталог
            </label>
            <div
              onClick={() => setShowCatalogSelect(true)}
              style={{
                width: `${fieldWidth}px`, height: '44px', borderRadius: '10px',
                border: selectedParentId ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)',
                backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center',
                paddingLeft: '12px', paddingRight: '12px', cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <img src={selectedParentId ? Icon32 : Icon31} alt="" style={{ width: 14.5, height: 18, flexShrink: 0 }} />
              <span style={{
                marginLeft: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif', fontSize: '14px',
                fontWeight: 500, color: selectedParentId ? '#666EFE' : '#A0A3BD',
              }}>
                {selectedParentName || 'Выберите каталог'}
              </span>
              <img src={selectedParentId ? Icon42 : Icon41} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !name.trim()}
              style={{
                height: '40px', paddingLeft: '24px', paddingRight: '24px', borderRadius: '10px',
                border: 'none', backgroundColor: name.trim() && !isLoading ? '#666EFE' : '#BCC8FF',
                cursor: name.trim() && !isLoading ? 'pointer' : 'not-allowed',
                fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: '#FFFFFF',
              }}
            >
              {isLoading ? 'Создание...' : 'Создать'}
            </button>
            <button
              onClick={onClose}
              style={{
                height: '40px', paddingLeft: '24px', paddingRight: '24px', borderRadius: '10px',
                border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '15px',
                fontWeight: 400, color: '#2D4059',
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      </div>

      <CatalogSelectPopup
        isOpen={showCatalogSelect}
        onClose={() => setShowCatalogSelect(false)}
        onSelect={handleCatalogSelect}
        popupType="catalog"
      />
    </>
  );
};

export default CreateGroupPopup;