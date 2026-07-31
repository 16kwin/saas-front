// components/ReferencesPage/NomenclaturePage/CatalogSelectPopup.jsx (Zadel) — с анимациями и сохранением открытых папок
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomScrollbar from '../../../components/CustomScrollbar';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import Icon12 from '../../../assets/References/Icon12.svg';
import Icon11 from '../../../assets/References/Icon11.svg';

const ROW_HEIGHT = 54;
const HEADER_HEIGHT = 54;
const VISIBLE_ROWS = 7;
const TABLE_WIDTH = 992;
const TABLE_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS + HEADER_HEIGHT;

const characteristicsCache = {};

const fetchCharacteristics = async (materialUid) => {
  if (characteristicsCache[materialUid]) return characteristicsCache[materialUid];
  try {
    const res = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/nomenclature/${materialUid}/characteristics`);
    characteristicsCache[materialUid] = res.data || [];
    return res.data || [];
  } catch (e) {
    characteristicsCache[materialUid] = [];
    return [];
  }
};

const getFilterKeywords = (filterProduct) => {
  if (!filterProduct) return [];
  const keywords = [];
  if (filterProduct.product) {
    keywords.push(filterProduct.product.toLowerCase());
    filterProduct.product.toLowerCase().split(/[\s,.\-]+/).forEach(token => {
      if (token.length >= 2 && !keywords.includes(token)) keywords.push(token);
    });
  }
  if (filterProduct.article) {
    const art = filterProduct.article.toLowerCase();
    if (!keywords.includes(art)) keywords.push(art);
    art.split(/[\s,.\-]+/).forEach(token => {
      if (token.length >= 2 && !keywords.includes(token)) keywords.push(token);
    });
  }
  if (filterProduct.specifications) {
    filterProduct.specifications.forEach(spec => {
      if (spec.value) {
        const val = spec.value.toLowerCase();
        if (!keywords.includes(val)) keywords.push(val);
      }
      if (spec.characteristic) {
        const char = spec.characteristic.toLowerCase();
        if (!keywords.includes(char)) keywords.push(char);
      }
    });
  }
  return keywords;
};

const checkMandatoryFilters = (material, zadelChars, mandatoryFilters) => {
  if (mandatoryFilters.length === 0) return true;

  const materialName = (material.name || '').toLowerCase().trim();
  const materialArticle = (material.article || '').toLowerCase().trim();

  return mandatoryFilters.every(filter => {
    if (filter.type === 'name') {
      return materialName === filter.value.toLowerCase();
    }
    if (filter.type === 'article') {
      return materialArticle === filter.value.toLowerCase();
    }
    if (filter.type === 'spec') {
      return zadelChars.some(char => {
        const charName = (char.attributeName || '').toLowerCase().trim();
        const charValue = (char.value || char.customName || '').toLowerCase().trim();
        return charName === filter.charName.toLowerCase() && charValue === filter.charValue.toLowerCase();
      });
    }
    return true;
  });
};

const calculateRelevance = (material, filterProduct, characteristics) => {
  if (!filterProduct) return 0;

  const productName = (filterProduct.product || '').toLowerCase().trim();
  const productArticle = (filterProduct.article || '').toLowerCase().trim();
  const materialName = (material.name || '').toLowerCase().trim();
  const materialArticle = (material.article || '').toLowerCase().trim();

  if (productName && materialName === productName) return 100;
  if (productArticle && materialArticle === productArticle) return 100;

  const orderSpecs = filterProduct.specifications || [];
  if (orderSpecs.length === 0) return 0;

  let matchedChars = 0;
  const zadelChars = characteristics || [];

  orderSpecs.forEach(orderSpec => {
    const orderCharName = (orderSpec.characteristic || '').toLowerCase().trim();
    const orderValue = (orderSpec.value || '').toLowerCase().trim();

    const found = zadelChars.some(zadelChar => {
      const zadelCharName = (zadelChar.attributeName || '').toLowerCase().trim();
      const zadelValue = (zadelChar.value || zadelChar.customName || '').toLowerCase().trim();

      if (orderCharName && zadelCharName && orderCharName === zadelCharName && orderValue === zadelValue) {
        return true;
      }
      return false;
    });

    if (found) matchedChars++;
  });

  return Math.round((matchedChars / orderSpecs.length) * 100);
};

const convertBackendTreeWithMaterials = (backendGroups, excludeUids = []) => {
  const excludeSet = new Set(excludeUids);
  return backendGroups.map(g => {
    const materialItems = (g.materials || [])
      .filter(m => !excludeSet.has(m.uid))
      .map(m => ({ id: m.uid, name: m.name || 'Без названия', isMaterial: true, article: m.article || '', raw: m }));
    const childGroups = g.children && g.children.length > 0 ? convertBackendTreeWithMaterials(g.children, excludeUids) : [];
    return { id: g.uid, name: g.name, groupCode: '', children: [...childGroups, ...materialItems] };
  });
};

const filterTreeByKeywordsAndCharacteristics = async (treeData, keywords, filterProduct, mandatoryFilters) => {
  if (keywords.length === 0 && mandatoryFilters.length === 0) {
    const allMaterials = [];
    const findMaterials = (items) => {
      items.forEach(item => {
        if (item.isMaterial) allMaterials.push(item);
        if (item.children) findMaterials(item.children);
      });
    };
    findMaterials(treeData);

    await Promise.all(allMaterials.map(async (material) => {
      const characteristics = await fetchCharacteristics(material.id);
      material.relevance = calculateRelevance(material, filterProduct, characteristics);
    }));

    return treeData;
  }

  const allMaterials = [];
  const findMaterials = (items) => {
    items.forEach(item => {
      if (item.isMaterial) allMaterials.push(item);
      if (item.children) findMaterials(item.children);
    });
  };
  findMaterials(treeData);

  const matchPromises = allMaterials.map(async (material) => {
    const characteristics = await fetchCharacteristics(material.id);

    const mandatoryMatch = checkMandatoryFilters(material, characteristics, mandatoryFilters);
    if (mandatoryFilters.length > 0 && !mandatoryMatch) return null;

    if (mandatoryFilters.length === 0) {
      const name = (material.name || '').toLowerCase();
      const article = (material.article || '').toLowerCase();
      const materialText = `${name} ${article}`;

      const textMatch = keywords.some(keyword => materialText.includes(keyword));

      const charMatch = characteristics.some(char => {
        const charValue = (char.value || char.customName || '').toLowerCase().trim();
        const charName = (char.attributeName || '').toLowerCase().trim();
        return keywords.some(keyword => charValue === keyword || charName === keyword);
      });

      if (!textMatch && !charMatch) return null;
    }

    material.relevance = calculateRelevance(material, filterProduct, characteristics);
    return material.id;
  });

  const matchedIds = new Set((await Promise.all(matchPromises)).filter(Boolean));

  const filterNodes = (items) => {
    return items.map(item => {
      if (item.isMaterial) {
        return matchedIds.has(item.id) ? item : null;
      }
      const filteredChildren = item.children ? filterNodes(item.children).filter(Boolean) : [];
      if (filteredChildren.length > 0) {
        return { ...item, children: filteredChildren };
      }
      return null;
    }).filter(Boolean);
  };

  return filterNodes(treeData);
};

const CatalogSelectPopup = ({
  isOpen, onClose, onSelect, popupType, filterParam, excludeUids = [], filterProduct = null,
}) => {
  const scrollContainerRef = useRef(null);
  const filterRef = useRef(null);
  const [hasScroll, setHasScroll] = useState(false);
  const [openFolders, setOpenFolders] = useState(new Set());
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [mandatoryFilters, setMandatoryFilters] = useState([]);

  useEffect(() => { if (isOpen) setInternalOpen(true); }, [isOpen]);

  // Закрытие фильтра при клике вне
  useEffect(() => {
    if (!filterOpen) return;
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  const handleClose = () => { setInternalOpen(false); onClose(); };

  const getFilterOptions = () => {
    if (!filterProduct) return [];
    const options = [];

    if (filterProduct.product) {
      options.push({ type: 'name', label: `Название: ${filterProduct.product}`, value: filterProduct.product, charName: '', charValue: '' });
    }
    if (filterProduct.article) {
      options.push({ type: 'article', label: `Артикул: ${filterProduct.article}`, value: filterProduct.article, charName: '', charValue: '' });
    }
    if (filterProduct.specifications) {
      filterProduct.specifications.forEach(spec => {
        options.push({
          type: 'spec',
          label: `${spec.characteristic}: ${spec.value}`,
          value: '',
          charName: spec.characteristic || '',
          charValue: spec.value || '',
        });
      });
    }
    return options;
  };

  const filterOptions = getFilterOptions();

  const toggleMandatoryFilter = (option) => {
    setMandatoryFilters(prev => {
      const exists = prev.find(f =>
        f.type === option.type &&
        f.charName === option.charName &&
        f.charValue === option.charValue &&
        f.value === option.value
      );
      if (exists) {
        return prev.filter(f => !(f.type === option.type && f.charName === option.charName && f.charValue === option.charValue && f.value === option.value));
      }
      return [...prev, option];
    });
  };

  const loadData = async () => {
    setIsLoading(true);
    setFiltering(true);
    try {
      const response = await AxiosService.get(ConstantInfo.restApiNomenclatureTree);
      const converted = convertBackendTreeWithMaterials(response.data, excludeUids);
      const keywords = mandatoryFilters.length > 0 ? [] : getFilterKeywords(filterProduct);
      const filtered = await filterTreeByKeywordsAndCharacteristics(converted, keywords, filterProduct, mandatoryFilters);
      setData(filtered);
      if (filtered.length > 0 && openFolders.size === 0) {
        setOpenFolders(new Set([filtered[0].id]));
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setData([]);
    } finally {
      setIsLoading(false);
      setFiltering(false);
    }
  };

  useEffect(() => {
    if (internalOpen) {
      setOpenFolders(new Set());
      setMandatoryFilters([]);
      setFilterOpen(false);
      loadData();
    }
  }, [internalOpen, filterParam, excludeUids.join(','), JSON.stringify(filterProduct)]);

  useEffect(() => {
    if (internalOpen) {
      loadData();
    }
  }, [mandatoryFilters]);

  const toggleFolder = (folderId) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      next.has(folderId) ? next.delete(folderId) : next.add(folderId);
      return next;
    });
  };

  const checkScroll = () => {
    const c = scrollContainerRef.current;
    if (!c) return;
    setHasScroll(c.scrollHeight > c.clientHeight);
  };

  useEffect(() => { const t = setTimeout(checkScroll, 100); return () => clearTimeout(t); }, [openFolders, data]);
  useEffect(() => {
    const c = scrollContainerRef.current;
    if (!c) return;
    checkScroll();
    c.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(c);
    return () => { c.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, []);

  const handleItemClick = (id, name) => {
    onSelect?.(id, name);
    handleClose();
  };

  const countRows = (items) => {
    let count = 0;
    items.forEach(item => {
      count += 1;
      if (openFolders.has(item.id) && item.children) count += countRows(item.children);
    });
    return count;
  };

  const getRelevanceColor = (relevance) => {
    if (relevance >= 80) return '#10B981';
    if (relevance >= 50) return '#F59E0B';
    if (relevance > 0) return '#EF4444';
    return '#9CA3AF';
  };

  const renderTree = (items, depth = 0) => {
    const result = [];
    items.forEach((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const isOpen = openFolders.has(item.id);
      const shift = depth * 20;
      const isMaterial = item.isMaterial === true;

      const handleClick = () => {
        if (isMaterial) {
          handleItemClick(item.id, item.name);
        } else if (hasChildren) {
          toggleFolder(item.id);
        }
      };

      result.push(
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: depth * 0.03 }}
          onClick={handleClick}
          onDoubleClick={() => isMaterial && handleItemClick(item.id, item.name)}
          style={{
            height: ROW_HEIGHT, display: 'flex', alignItems: 'center',
            backgroundColor: '#FFFFFF', cursor: 'pointer', userSelect: 'none',
            boxSizing: 'border-box', position: 'relative',
            borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5',
            paddingLeft: 20 + shift, paddingRight: 40,
          }}
          whileHover={{ backgroundColor: '#F8F9FC' }}
        >
          {isMaterial ? (
            <div style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid #666EFE', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#666EFE' }} />
            </div>
          ) : (
            <motion.img
              src={hasChildren ? (isOpen ? Icon12 : Icon11) : Icon11}
              alt=""
              style={{ width: hasChildren && isOpen ? 19 : 18, height: 16, flexShrink: 0 }}
              animate={{ rotate: hasChildren && isOpen ? 0 : 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: 15,
            fontWeight: isMaterial ? 400 : 700,
            color: '#2D4059',
            marginLeft: 10,
            maxWidth: isMaterial ? 480 : (400 - shift),
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.name}
          </span>
          {isMaterial && item.relevance !== undefined && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                right: 20,
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: getRelevanceColor(item.relevance),
              }}
            >
              {item.relevance}%
            </motion.span>
          )}
        </motion.div>
      );
      if (isOpen && hasChildren) {
        result.push(
          <AnimatePresence key={`children-${item.id}`}>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              {renderTree(item.children, depth + 1)}
            </motion.div>
          </AnimatePresence>
        );
      }
    });
    return result;
  };

  const totalRows = countRows(data);
  const emptyRows = Math.max(0, VISIBLE_ROWS - totalRows);

  if (!internalOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClose}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)', zIndex: 10002,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: 1052, height: 600, backgroundColor: '#FFFFFF',
          borderRadius: 15, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10002,
        }}
      >
        <button onClick={handleClose} style={{ position: 'absolute', top: 20, right: 30, width: 14, height: 14, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <line x1="1.5" y1="1.5" x2="12.5" y2="12.5" stroke="#2D4059" strokeWidth="3" strokeLinecap="round" />
            <line x1="12.5" y1="1.5" x2="1.5" y2="12.5" stroke="#2D4059" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </button>
        <h2 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 24, fontWeight: 500, color: '#2D4059', margin: '30px 0 0', textAlign: 'center' }}>
          Выбор номенклатуры Zadel
        </h2>

        {/* Выпадающий фильтр */}
        <div ref={filterRef} style={{ padding: '0 50px', marginTop: 15, position: 'relative' }}>
          <motion.button
            whileHover={{ borderColor: 'rgba(102, 110, 254, 0.3)' }}
            onClick={() => setFilterOpen(!filterOpen)}
            style={{
              width: '100%', height: 40, borderRadius: 10,
              backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '0 16px',
              fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059',
            }}
          >
            <span>Фильтр по характеристикам {mandatoryFilters.length > 0 ? `(${mandatoryFilters.length})` : ''}</span>
            <motion.span
              animate={{ rotate: filterOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ fontSize: 12 }}
            >
              ▼
            </motion.span>
          </motion.button>
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{
                  position: 'absolute', top: 44, left: 50, right: 50,
                  maxHeight: 250, overflowY: 'auto', overflowX: 'hidden',
                  backgroundColor: '#FFFFFF', borderRadius: 10,
                  border: '1px solid rgba(102, 110, 254, 0.15)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  zIndex: 10,
                }}
              >
                <div style={{ padding: 12 }}>
                  {filterOptions.length === 0 ? (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Нет данных для фильтрации</span>
                  ) : (
                    filterOptions.map((option, idx) => {
                      const isChecked = mandatoryFilters.some(f =>
                        f.type === option.type &&
                        f.charName === option.charName &&
                        f.charValue === option.charValue &&
                        f.value === option.value
                      );
                      return (
                        <motion.label
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.15, delay: idx * 0.02 }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '6px 8px', cursor: 'pointer',
                            borderRadius: 6,
                            backgroundColor: isChecked ? 'rgba(102, 110, 254, 0.08)' : 'transparent',
                            fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400, color: '#2D4059',
                            userSelect: 'none',
                          }}
                          whileHover={{ backgroundColor: isChecked ? 'rgba(102, 110, 254, 0.12)' : '#F8F9FC' }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleMandatoryFilter(option)}
                            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#666EFE' }}
                          />
                          {option.label}
                        </motion.label>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {filtering && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ textAlign: 'center', marginTop: 8, overflow: 'hidden' }}
            >
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Поиск совпадений...</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', marginTop: 15, alignSelf: 'center', position: 'relative', width: TABLE_WIDTH, height: TABLE_HEIGHT }}>
          <div style={{ width: '100%', height: '100%', backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 40, boxSizing: 'border-box', position: 'relative' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>НАИМЕНОВАНИЕ</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', right: 40 }}>РЕЛЕВАНТНОСТЬ</span>
            </div>
            <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {isLoading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#9CA3AF' }}>Загрузка...</span>
                </div>
              ) : data.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#9CA3AF' }}>Нет подходящих номенклатур</span>
                </motion.div>
              ) : (
                <>
                  {renderTree(data)}
                  {Array.from({ length: emptyRows }).map((_, i) => (
                    <div key={`empty-${i}`} style={{ height: ROW_HEIGHT, backgroundColor: '#FFFFFF', boxSizing: 'border-box', borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5' }} />
                  ))}
                </>
              )}
            </div>
          </div>
          {hasScroll && (
            <div style={{ width: 10, height: TABLE_HEIGHT, paddingTop: HEADER_HEIGHT, marginLeft: 10 }}>
              <CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CatalogSelectPopup;