// NomenclaturePage.jsx — read-only версия для Zadel
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomScrollbar from '../../../components/CustomScrollbar';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import { useTabs } from '../../../context/TabContext';
import Icon1 from '../../../assets/References/Icon1.svg';
import Icon2 from '../../../assets/References/Icon2.svg';
import Icon3 from '../../../assets/References/Icon3.svg';
import Icon4 from '../../../assets/References/Icon4.svg';
import Icon5 from '../../../assets/References/Icon5.svg';
import Icon6 from '../../../assets/References/Icon6.svg';
import Icon7 from '../../../assets/References/Icon7.svg';
import Icon8 from '../../../assets/References/Icon8.svg';
import Icon9 from '../../../assets/References/Icon9.svg';
import Icon10 from '../../../assets/References/Icon10.svg';
import Icon11 from '../../../assets/References/Icon11.svg';
import Icon12 from '../../../assets/References/Icon12.svg';
import Icon14 from '../../../assets/References/Icon14.svg';
import Icon15 from '../../../assets/References/Icon15.svg';
import Icon16 from '../../../assets/References/Icon16.svg';
import Icon17 from '../../../assets/References/Icon17.svg';
import Icon18 from '../../../assets/References/Icon18.svg';
import Icon20 from '../../../assets/References/Icon20.svg';
import Icon21 from '../../../assets/References/Icon21.svg';
import Icon22 from '../../../assets/References/Icon22.svg';
import Icon23 from '../../../assets/References/Icon23.svg';
import Icon24 from '../../../assets/References/Icon24.svg';
import Icon25 from '../../../assets/References/Icon25.svg';
import Popup1 from '../../../assets/References/popup1.svg';

const NomenclaturePage = () => {
  const navigate = useNavigate();
  const { activeTabId } = useTabs();
  const tabIdRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const breadcrumbsRef = useRef(null);
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false);
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [hoveredCrumb, setHoveredCrumb] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const TABLE_WIDTH = 1720;
  const TABLE_HEIGHT = 638;
  const ROW_HEIGHT = 58;
  const HEADER_HEIGHT = 58;
  const VISIBLE_ROWS = 10;

  const COL_NAME = 85;
  const COL_CODE = 470;
  const COL_ARTICLE = 580;
  const COL_ACCOUNT_GROUP = 735;
  const COL_NOMENCLATURE_GROUP = 920;
  const COL_NOMENCLATURE_TYPE = 1270;

  const MAX_BREADCRUMBS_WIDTH = 500;

  useEffect(() => {
    tabIdRef.current = activeTabId;
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

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

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const response = await AxiosService.get(ConstantInfo.restApiNomenclatureTree);
        setTreeData(response.data);
      } catch (error) {
        console.error('Ошибка загрузки дерева:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTree();
  }, []);

  const rootNode = treeData.length > 0 ? treeData[0] : null;

  const getNodeByPath = (path) => {
    if (!rootNode) return null;
    if (path.length === 0) return rootNode;
    let level = rootNode.children || [];
    let result = null;
    for (const uid of path) {
      const found = level.find(n => n.uid === uid);
      if (!found) return null;
      result = found;
      level = found.children || [];
    }
    return result;
  };

  const currentNode = getNodeByPath(currentPath);

  const findMaterialById = (nodes, uid) => {
    for (const node of nodes) {
      if (node.materials) {
        const found = node.materials.find(m => m.uid === uid);
        if (found) return found;
      }
      if (node.children) {
        const found = findMaterialById(node.children, uid);
        if (found) return found;
      }
    }
    return null;
  };

  const handleContextMenu = (e, uid, name, type) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, uid, name, type });
  };

  const handleContextOpen = () => {
    if (!contextMenu) return;
    const { uid, type } = contextMenu;
    setContextMenu(null);
    if (type === 'folder') {
      enterFolder(uid);
    } else {
      const material = findMaterialById(treeData, uid);
      const code = material?.code || '';
      const path = `/references/nomenclature/edit/${uid}/${code}`;
      navigate(path);
    }
  };

  const getBreadcrumbs = () => {
    if (!rootNode) return [];
    const crumbs = [rootNode];
    let level = rootNode.children || [];
    for (const uid of currentPath) {
      const found = level.find(n => n.uid === uid);
      if (found) { crumbs.push(found); level = found.children || []; }
      else break;
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  useEffect(() => {
    const checkWidth = () => {
      const container = breadcrumbsRef.current;
      if (!container) return;
      setIsCollapsed(container.scrollWidth > MAX_BREADCRUMBS_WIDTH);
    };
    
    checkWidth();
    
    const ro = new ResizeObserver(checkWidth);
    if (breadcrumbsRef.current) {
      ro.observe(breadcrumbsRef.current);
    }
    
    return () => ro.disconnect();
  }, [breadcrumbs]);

  const enterFolder = (folderUid) => {
    setCurrentPath(prev => [...prev, folderUid]);
  };

  const goBack = () => {
    setCurrentPath(prev => prev.slice(0, -1));
  };

  const goToBreadcrumb = (index) => {
    if (index === breadcrumbs.length - 1) return;
    if (index === 0) setCurrentPath([]);
    else {
      const pathIndex = index - 1;
      if (pathIndex < currentPath.length) setCurrentPath(prev => prev.slice(0, pathIndex));
    }
  };

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setHasVerticalScroll(container.scrollHeight > container.clientHeight);
    setHasHorizontalScroll(container.scrollWidth > container.clientWidth);
  };

  useEffect(() => { const timer = setTimeout(checkScroll, 350); return () => clearTimeout(timer); }, [currentPath, treeData]);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    checkScroll();
    container.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll); ro.observe(container);
    return () => { container.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, []);

  const handleCellMouseEnter = (e, text) => {
    const el = e.currentTarget;
    if (el.scrollWidth > el.clientWidth) {
      const rect = el.getBoundingClientRect();
      setTooltip({
        text,
        x: rect.left + rect.width / 2,
        y: rect.bottom + 4,
      });
    }
  };

  const handleCellMouseLeave = () => {
    setTooltip(null);
  };

  const mutedButtonStyle = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, opacity: 0.4 };
  const mutedMediumButtonStyle = { height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'default', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0, opacity: 0.4 };

  const EmptySquare = () => (
    <div style={{ width: 18, height: 18, borderRadius: 2, border: '2px solid #2D4059', opacity: 0.5, flexShrink: 0, boxSizing: 'border-box', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
  );

  const EmptySquareHeader = () => (
    <div style={{ width: 18, height: 18, borderRadius: 2, border: '2px solid #FFFFFF', opacity: 0.5, flexShrink: 0, boxSizing: 'border-box', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
  );

  const contextMenuButtonStyle = { height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' };
  const contextMenuButtonMutedStyle = { ...contextMenuButtonStyle, opacity: 0.4, cursor: 'default' };

  const cellTextStyle = (left, maxWidth) => ({
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059',
    position: 'absolute',
    left: `${left}px`,
    maxWidth: `${maxWidth}px`,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  });

  const renderCurrentLevel = () => {
    if (!currentNode) return null;
    const items = [];
    const depth = currentPath.length;
    const shift = depth > 0 ? 20 : 0;

    if (depth > 0) {
      const parentNode = currentNode;
      items.push(
        <div key={parentNode.uid} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', userSelect: 'none', boxSizing: 'border-box', position: 'relative', borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5' }} onContextMenu={(e) => handleContextMenu(e, parentNode.uid, parentNode.name, 'folder')}>
          <div style={{ paddingLeft: 20, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 18, height: 18, flexShrink: 0 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: 19 }}>
            <img src={Icon12} alt="" style={{ width: 19, height: 16, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059', marginLeft: 10, maxWidth: 310, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{parentNode.name}</span>
            <button onClick={(e) => { e.stopPropagation(); goBack(); }} style={{ marginLeft: 18, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }}><img src={Icon17} alt="Назад" style={{ width: 18, height: 18 }} /></button>
          </div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: `${COL_CODE}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: `${COL_ARTICLE - COL_CODE - 20}px` }}>{parentNode.code !== null && parentNode.code !== undefined ? String(parentNode.code).padStart(5, '0') : '—'}</span>
        </div>
      );
    }

    const folders = currentNode.children || [];
    folders.forEach(folder => {
      items.push(
        <div key={folder.uid} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', cursor: 'pointer', userSelect: 'none', boxSizing: 'border-box', position: 'relative', borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5' }} onContextMenu={(e) => handleContextMenu(e, folder.uid, folder.name, 'folder')}>
          <div style={{ paddingLeft: 20, display: 'flex', alignItems: 'center' }}><EmptySquare /></div>
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: shift + 19 }} onClick={() => enterFolder(folder.uid)}>
            <img src={Icon11} alt="" style={{ width: 18, height: 16, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059', marginLeft: 10, maxWidth: `${COL_CODE - COL_NAME - shift - 60}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
          </div>
          <span style={{ ...cellTextStyle(COL_CODE, COL_ARTICLE - COL_CODE - 20) }}>{folder.code !== null && folder.code !== undefined ? String(folder.code).padStart(5, '0') : '—'}</span>
        </div>
      );
    });

    const materials = currentNode.materials || [];
    materials.forEach(material => {
      const nameText = material.name || '—';
      const codeText = material.code || '—';
      const articleText = material.article || '—';
      const typeMainText = material.typeMainName || '—';
      const typePurposeText = material.typePurposeName || '—';
      const typeProductText = material.typeProductName || '—';

      items.push(
        <div key={material.uid} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', position: 'relative', cursor: 'pointer', boxSizing: 'border-box', borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5' }} onContextMenu={(e) => handleContextMenu(e, material.uid, nameText, 'material')}>
          <div style={{ paddingLeft: 20, display: 'flex', alignItems: 'center' }}><EmptySquare /></div>
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: shift + 19 }}>
            <img src={Popup1} alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
            <span
              onMouseEnter={(e) => handleCellMouseEnter(e, nameText)}
              onMouseLeave={handleCellMouseLeave}
              style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', marginLeft: 10, maxWidth: `${COL_CODE - COL_NAME - shift - 60}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >{nameText}</span>
          </div>
          <span onMouseEnter={(e) => handleCellMouseEnter(e, String(codeText))} onMouseLeave={handleCellMouseLeave} style={cellTextStyle(COL_CODE, COL_ARTICLE - COL_CODE - 20)}>{codeText}</span>
          <span onMouseEnter={(e) => handleCellMouseEnter(e, articleText)} onMouseLeave={handleCellMouseLeave} style={cellTextStyle(COL_ARTICLE, COL_ACCOUNT_GROUP - COL_ARTICLE - 20)}>{articleText}</span>
          <span onMouseEnter={(e) => handleCellMouseEnter(e, typeMainText)} onMouseLeave={handleCellMouseLeave} style={cellTextStyle(COL_ACCOUNT_GROUP, COL_NOMENCLATURE_GROUP - COL_ACCOUNT_GROUP - 20)}>{typeMainText}</span>
          <span onMouseEnter={(e) => handleCellMouseEnter(e, typePurposeText)} onMouseLeave={handleCellMouseLeave} style={cellTextStyle(COL_NOMENCLATURE_GROUP, COL_NOMENCLATURE_TYPE - COL_NOMENCLATURE_GROUP - 20)}>{typePurposeText}</span>
          <span onMouseEnter={(e) => handleCellMouseEnter(e, typeProductText)} onMouseLeave={handleCellMouseLeave} style={cellTextStyle(COL_NOMENCLATURE_TYPE, TABLE_WIDTH - COL_NOMENCLATURE_TYPE - 60)}>{typeProductText}</span>
        </div>
      );
    });

    return items;
  };

  const totalItems = (currentPath.length > 0 ? 1 : 0) + (currentNode?.children?.length || 0) + (currentNode?.materials?.length || 0);
  const emptyRows = Math.max(0, VISIBLE_ROWS - totalItems);

  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC' }}>
      <style>{`
        @keyframes crumbFadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes crumbTextIn {
          from { opacity: 0; max-width: 0; }
          to { opacity: 1; max-width: 200px; }
        }
        @keyframes crumbTextOut {
          from { opacity: 1; max-width: 200px; }
          to { opacity: 0; max-width: 0; }
        }
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .crumb-item {
          animation: crumbFadeIn 0.3s ease-out both;
        }
        .crumb-text-enter {
          animation: crumbTextIn 0.25s ease-out both;
          overflow: hidden;
          white-space: nowrap;
        }
        .crumb-text-leave {
          animation: crumbTextOut 0.25s ease-out both;
          overflow: hidden;
          white-space: nowrap;
        }
        .crumb-tooltip {
          animation: tooltipIn 0.2s ease-out both;
        }
      `}</style>

      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 700, color: '#2D4059', margin: 0, lineHeight: '29px', height: 29 }}>Справочник: Номенклатура</h1>
      </div>

      <div 
        ref={breadcrumbsRef}
        style={{ position: 'absolute', top: 79, left: 60, right: 40, height: 17, display: 'flex', alignItems: 'center', overflow: 'hidden' }}
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const showOnlyIcon = isCollapsed && !isLast;
          const showText = !showOnlyIcon;

          return (
            <React.Fragment key={crumb.uid}>
              {index > 0 && (
                <span className="crumb-item" style={{ display: 'flex', alignItems: 'center', animationDelay: `${index * 0.05}s`, flexShrink: 0 }}>
                  <span style={{ width: 15, flexShrink: 0 }} />
                  <img src={Icon15} alt="" style={{ width: 7, height: 11, flexShrink: 0 }} />
                  <span style={{ width: 15, flexShrink: 0 }} />
                </span>
              )}
              <div
                className="crumb-item"
                onMouseEnter={() => showOnlyIcon && setHoveredCrumb(index)}
                onMouseLeave={() => setHoveredCrumb(null)}
                style={{ display: 'flex', alignItems: 'center', position: 'relative', cursor: isLast ? 'default' : 'pointer', animationDelay: `${index * 0.05}s`, flexShrink: isLast ? 1 : (showOnlyIcon ? 0 : 1), minWidth: 0 }}
                onClick={() => !isLast && goToBreadcrumb(index)}
              >
                <img src={index === 0 ? Icon14 : Icon16} alt="" style={{ width: index === 0 ? 18 : 17, height: 15, flexShrink: 0 }} />
                {showText ? (
                  <>
                    <span style={{ width: 7, flexShrink: 0 }} />
                    <span className="crumb-text-enter" style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: 'rgba(45, 64, 89, 0.67)', lineHeight: '17px', height: 17, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isLast ? 'none' : 200 }}>{crumb.name}</span>
                  </>
                ) : null}
                {showOnlyIcon && hoveredCrumb === index && (
                  <div className="crumb-tooltip" style={{
                    position: 'absolute',
                    top: 22,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#2D4059',
                    color: '#FFFFFF',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 12,
                    fontWeight: 400,
                    padding: '4px 8px',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                    zIndex: 10000,
                    pointerEvents: 'none'
                  }}>
                    {crumb.name}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Верхний блок кнопок — всё замучено */}
      <div style={{ position: 'absolute', top: 110, left: 55, right: 55, height: 40, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 15 }}>
          <button style={mutedButtonStyle}><img src={Icon1} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={mutedButtonStyle}><img src={Icon2} alt="" style={{ width: 20, height: 14 }} /></button>
          <button style={mutedButtonStyle}><img src={Icon3} alt="" style={{ width: 18, height: 18 }} /></button>
        </div>
        <div style={{ position: 'absolute', left: 586, display: 'flex', gap: 15 }}>
          <button style={{ ...mutedMediumButtonStyle, width: 124 }}><img src={Icon4} alt="" style={{ width: 16, height: 16, marginLeft: 12 }} /><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 15 }}>Создать</span></button>
          <button style={{ ...mutedMediumButtonStyle, width: 186 }}><img src={Icon5} alt="" style={{ width: 20, height: 20, marginLeft: 15 }} /><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 15 }}>Создать каталог</span></button>
          <button style={mutedButtonStyle}><img src={Icon18} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={mutedButtonStyle}><img src={Icon6} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={mutedButtonStyle}><img src={Icon7} alt="" style={{ width: 18, height: 18 }} /></button>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 15 }}>
          <button style={mutedButtonStyle}><img src={Icon8} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={mutedButtonStyle}><img src={Icon9} alt="" style={{ width: 14, height: 18 }} /></button>
          <button style={mutedButtonStyle}><img src={Icon10} alt="" style={{ width: 18, height: 16 }} /></button>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 162, left: 40 }}>
        <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', position: 'relative', paddingLeft: 20, paddingRight: 40, boxSizing: 'border-box' }}>
            <EmptySquareHeader />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: `${COL_NAME}px` }}>НАИМЕНОВАНИЕ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: `${COL_CODE}px` }}>КОД</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: `${COL_ARTICLE}px` }}>АРТИКУЛ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: `${COL_ACCOUNT_GROUP}px` }}>ГРУППА УЧЕТА</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: `${COL_NOMENCLATURE_GROUP}px` }}>ГРУППА НОМЕНКЛАТУРЫ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: `${COL_NOMENCLATURE_TYPE}px` }}>ВИД НОМЕНКЛАТУРЫ</span>
          </div>
          <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div style={{ minWidth: TABLE_WIDTH - 40 }}>
              {renderCurrentLevel()}
              {Array.from({ length: emptyRows }).map((_, i) => (
                <div key={`empty-${i}`} style={{ height: ROW_HEIGHT, backgroundColor: '#FFFFFF', boxSizing: 'border-box', display: 'flex', alignItems: 'center', paddingLeft: 20, borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5' }}><EmptySquare /></div>
              ))}
            </div>
          </div>
        </div>
        {hasVerticalScroll && (<div style={{ position: 'absolute', right: -25, top: HEADER_HEIGHT, height: TABLE_HEIGHT - HEADER_HEIGHT, width: 10 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} /></div>)}
        {hasHorizontalScroll && (<div style={{ position: 'absolute', bottom: -21, left: 0, width: TABLE_WIDTH, height: 10 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="horizontal" trackSize={TABLE_WIDTH} /></div>)}
      </div>

      {/* Тултип для ячеек */}
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

      {/* Контекстное меню */}
      {contextMenu && (
        <div style={{ 
          position: 'fixed', 
          top: contextMenu.y, 
          left: contextMenu.x, 
          width: contextMenu.type === 'folder' ? 244 : 174, 
          backgroundColor: '#FFFFFF', 
          borderRadius: 6, 
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', 
          zIndex: 10001, 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '8px 0' 
        }} onClick={e => e.stopPropagation()}>
          {contextMenu.type === 'folder' ? (
            <>
              <button style={contextMenuButtonStyle} onClick={handleContextOpen}>
                <img src={Icon20} alt="" style={{ width: 18, height: 18, marginRight: 16 }} />
                Открыть
              </button>
              <button style={{ ...contextMenuButtonMutedStyle, width: 244 }}>
                <img src={Icon20} alt="" style={{ width: 18, height: 18, marginRight: 16, opacity: 0.4 }} />
                Создать номенклатуру
              </button>
              <button style={{ ...contextMenuButtonMutedStyle, width: 244 }}>
                <img src={Icon21} alt="" style={{ width: 16, height: 14, marginRight: 17, opacity: 0.4 }} />
                Создать каталог
              </button>
              <button style={{ ...contextMenuButtonMutedStyle, width: 244 }}>
                <img src={Icon22} alt="" style={{ width: 16, height: 14, marginRight: 17, opacity: 0.4 }} />
                Переместить
              </button>
              <button style={{ ...contextMenuButtonMutedStyle, width: 244 }}>
                <img src={Icon23} alt="" style={{ width: 16, height: 15, marginRight: 17, opacity: 0.4 }} />
                Переименовать
              </button>
              <button style={{ ...contextMenuButtonMutedStyle, width: 244 }}>
                <img src={Icon24} alt="" style={{ width: 16, height: 16, marginRight: 17, opacity: 0.4 }} />
                Скопировать
              </button>
              <button style={{ ...contextMenuButtonMutedStyle, width: 244 }}>
                <img src={Icon25} alt="" style={{ width: 18, height: 18, marginRight: 16, opacity: 0.4 }} />
                Удалить
              </button>
            </>
          ) : (
            <>
              <button style={contextMenuButtonStyle} onClick={handleContextOpen}>
                <img src={Icon20} alt="" style={{ width: 18, height: 18, marginRight: 16 }} />
                Открыть
              </button>
              <button style={contextMenuButtonMutedStyle}>
                <img src={Icon22} alt="" style={{ width: 16, height: 14, marginRight: 17, opacity: 0.4 }} />
                Переместить
              </button>
              <button style={contextMenuButtonMutedStyle}>
                <img src={Icon24} alt="" style={{ width: 16, height: 16, marginRight: 17, opacity: 0.4 }} />
                Скопировать
              </button>
              <button style={contextMenuButtonMutedStyle}>
                <img src={Icon25} alt="" style={{ width: 18, height: 18, marginRight: 16, opacity: 0.4 }} />
                Удалить
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NomenclaturePage;