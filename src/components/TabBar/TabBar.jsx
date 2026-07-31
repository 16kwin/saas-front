// components/TabBar/TabBar.jsx
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useTabs } from '../../context/TabContext';
import Logo from '../../assets/Menu/Logo.svg';
import Arrow from '../../assets/Menu/Arrow.svg';
import { motion, AnimatePresence } from 'framer-motion';

const TabBar = () => {
  const { tabs, activeTabId, closeTab, switchTab } = useTabs();
  const [showDropdown, setShowDropdown] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState([]);
  const [tabWidths, setTabWidths] = useState([]);
  const [hoveredTabId, setHoveredTabId] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
  const [shouldAnimateTooltip, setShouldAnimateTooltip] = useState(true);
  const [indicatorY, setIndicatorY] = useState(0);
  const [hoveredDropdownTabId, setHoveredDropdownTabId] = useState(null);
  const [dropdownTooltip, setDropdownTooltip] = useState(null);

  const tabsContainerRef = useRef(null);
  const rootContainerRef = useRef(null);
  const counterButtonRef = useRef(null);
  const dropdownRef = useRef(null);
  const dropdownInnerRef = useRef(null);
  const tabRefs = useRef(new Map());
  const tooltipTimeoutRef = useRef(null);
  const prevActiveTabId = useRef(null);
  const rafRef = useRef(null);
  const currentIndicatorY = useRef(0);
  const targetIndicatorY = useRef(0);
  const dropdownTooltipTimeoutRef = useRef(null);
  const textRefs = useRef(new Map());

  const prevVisibleTabsRef = useRef('');
  const prevTabWidthsRef = useRef('');
  const prevTabsLengthRef = useRef(0);

  const MIN_TAB_WIDTH = 100;
  const MAX_TAB_WIDTH = 150;
  const LOGO_WIDTH = 132;
  const COUNTER_WIDTH = 64;
  const GAP_BETWEEN_LOGO_COUNTER = 15;
  const GAP_BETWEEN_COUNTER_TABS = 7;
  const GAP_BETWEEN_TABS = 7;
  const HORIZONTAL_PADDING = 20;

  const ROW_GAP = 15;
  const TEXT_HEIGHT = 18;
  const ROW_FULL_HEIGHT = TEXT_HEIGHT + ROW_GAP;
  const ROW_TOP_PADDING = 15;
  const INDICATOR_LEFT = 10;
  const INDICATOR_WIDTH = 2;
  const INDICATOR_HEIGHT = 22;
  const TEXT_MAX_WIDTH = 205;

  const canCloseTab = (tab) => {
    if (tabs.length > 1) return true;
    if (tabs.length === 1 && tab.path !== '/main') return true;
    return false;
  };

  const calculateVisibleTabs = useCallback(() => {
    if (!rootContainerRef.current || tabs.length === 0) {
      setVisibleTabs([]);
      setTabWidths([]);
      prevVisibleTabsRef.current = '';
      prevTabWidthsRef.current = '';
      return;
    }

    const totalWidth = rootContainerRef.current.clientWidth;
    const fixedWidth = HORIZONTAL_PADDING + LOGO_WIDTH + GAP_BETWEEN_LOGO_COUNTER + COUNTER_WIDTH + GAP_BETWEEN_COUNTER_TABS + HORIZONTAL_PADDING;
    const availableWidth = totalWidth - fixedWidth;

    if (availableWidth <= MIN_TAB_WIDTH) {
      setVisibleTabs([]);
      setTabWidths([]);
      prevVisibleTabsRef.current = '[]';
      prevTabWidthsRef.current = '[]';
      return;
    }

    const naturalWidths = tabs.map(() => MAX_TAB_WIDTH);
    const totalGaps = (tabs.length - 1) * GAP_BETWEEN_TABS;
    const totalNaturalWidth = naturalWidths.reduce((sum, w) => sum + w, 0);
    const totalNeeded = totalNaturalWidth + totalGaps;

    let newVisibleTabs;
    let newTabWidths;

    if (totalNeeded <= availableWidth) {
      newVisibleTabs = [...tabs];
      newTabWidths = naturalWidths;
    } else {
      let bestCount = 0;
      let bestWidths = [];
      const maxCount = Math.min(tabs.length, Math.floor((availableWidth + GAP_BETWEEN_TABS) / (MIN_TAB_WIDTH + GAP_BETWEEN_TABS)));

      for (let count = maxCount; count >= 1; count--) {
        const candidateTabs = tabs.slice(-count);
        const candidateWidths = naturalWidths.slice(-count);
        const gaps = (count - 1) * GAP_BETWEEN_TABS;
        const totalNatural = candidateWidths.reduce((sum, w) => sum + w, 0);

        if (totalNatural + gaps <= availableWidth) {
          bestCount = count;
          bestWidths = candidateWidths;
          break;
        }

        const available = availableWidth - gaps;
        if (available > 0) {
          const scale = available / totalNatural;
          const compressed = candidateWidths.map(w => Math.max(MIN_TAB_WIDTH, Math.min(MAX_TAB_WIDTH, w * scale)));
          if (compressed.reduce((sum, w) => sum + w, 0) + gaps <= availableWidth + 0.5) {
            bestCount = count;
            bestWidths = compressed;
            break;
          }
        }
      }

      if (bestCount > 0) {
        newVisibleTabs = tabs.slice(-bestCount);
        newTabWidths = bestWidths;
      } else {
        newVisibleTabs = [tabs[tabs.length - 1]];
        newTabWidths = [MIN_TAB_WIDTH];
      }
    }

    const newVisibleStr = JSON.stringify(newVisibleTabs.map(t => t.id));
    const newWidthsStr = JSON.stringify(newTabWidths);

    if (prevVisibleTabsRef.current !== newVisibleStr || prevTabWidthsRef.current !== newWidthsStr) {
      setVisibleTabs(newVisibleTabs);
      setTabWidths(newTabWidths);
      prevVisibleTabsRef.current = newVisibleStr;
      prevTabWidthsRef.current = newWidthsStr;
    }
  }, [tabs]);

  useLayoutEffect(() => {
    if (tabs.length !== prevTabsLengthRef.current) {
      prevTabsLengthRef.current = tabs.length;
      calculateVisibleTabs();
    } else if (tabs.length === 0) {
      setVisibleTabs([]);
      setTabWidths([]);
      prevVisibleTabsRef.current = '';
      prevTabWidthsRef.current = '';
    }
  }, [tabs.length, calculateVisibleTabs]);

  useEffect(() => {
    let ro = null;
    if (rootContainerRef.current) {
      ro = new ResizeObserver(() => calculateVisibleTabs());
      ro.observe(rootContainerRef.current);
    }
    return () => { if (ro) ro.disconnect(); };
  }, [calculateVisibleTabs]);

  const getIndicatorTarget = useCallback((index) => {
    return ROW_TOP_PADDING + index * ROW_FULL_HEIGHT + (TEXT_HEIGHT - INDICATOR_HEIGHT) / 2;
  }, []);

  const runAnimation = useCallback((from, to) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const duration = Math.max(Math.abs(to - from) / ROW_FULL_HEIGHT * 120, 150);
    const startTime = performance.now();
    const startFrom = from;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = startFrom + (to - startFrom) * eased;

      currentIndicatorY.current = value;
      setIndicatorY(value);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        currentIndicatorY.current = to;
        setIndicatorY(to);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useLayoutEffect(() => {
    if (showDropdown) {
      const idx = tabs.findIndex(t => t.id === activeTabId);
      if (idx !== -1) {
        const target = getIndicatorTarget(idx);
        currentIndicatorY.current = target;
        targetIndicatorY.current = target;
        setIndicatorY(target);
        prevActiveTabId.current = activeTabId;
      }
    }
  }, [showDropdown]);

  useEffect(() => {
    if (showDropdown) {
      const idx = tabs.findIndex(t => t.id === activeTabId);
      if (idx !== -1) {
        const target = getIndicatorTarget(idx);
        if (target !== targetIndicatorY.current) {
          targetIndicatorY.current = target;
          runAnimation(currentIndicatorY.current, target);
        }
      }
    }
  }, [tabs.length, showDropdown, activeTabId, getIndicatorTarget, runAnimation]);

  useEffect(() => {
    if (!showDropdown) return;
    if (!prevActiveTabId.current) {
      prevActiveTabId.current = activeTabId;
      return;
    }
    if (prevActiveTabId.current === activeTabId) return;

    const fromIdx = tabs.findIndex(t => t.id === prevActiveTabId.current);
    const toIdx = tabs.findIndex(t => t.id === activeTabId);

    if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
      const target = getIndicatorTarget(toIdx);
      targetIndicatorY.current = target;
      runAnimation(currentIndicatorY.current, target);
    }

    prevActiveTabId.current = activeTabId;
  }, [activeTabId]);

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const updateTooltipPosition = (tabId) => {
    const el = tabRefs.current.get(tabId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTooltipPosition({ left: rect.left + rect.width / 2, top: rect.bottom + 4 });
    }
  };

  const handleTabMouseEnter = (tabId) => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    tooltipTimeoutRef.current = setTimeout(() => {
      setShouldAnimateTooltip(true);
      setHoveredTabId(tabId);
      updateTooltipPosition(tabId);
    }, 300);
  };

  const handleTabMouseLeave = () => {
    if (tooltipTimeoutRef.current) { clearTimeout(tooltipTimeoutRef.current); tooltipTimeoutRef.current = null; }
    setShouldAnimateTooltip(true);
    setHoveredTabId(null);
  };

  useEffect(() => {
    if (!hoveredTabId) return;
    const update = () => updateTooltipPosition(hoveredTabId);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [hoveredTabId]);

  useEffect(() => {
    const handler = (e) => {
      if (counterButtonRef.current && !counterButtonRef.current.contains(e.target) &&
          dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCloseTab = (tabId) => {
    if (dropdownTooltipTimeoutRef.current) { clearTimeout(dropdownTooltipTimeoutRef.current); dropdownTooltipTimeoutRef.current = null; }
    setDropdownTooltip(null);
    setHoveredDropdownTabId(null);
    
    if (tooltipTimeoutRef.current) { clearTimeout(tooltipTimeoutRef.current); tooltipTimeoutRef.current = null; }
    setHoveredTabId(null);

    const currentIndex = tabs.findIndex(t => t.id === tabId);
    
    if (activeTabId === tabId) {
      if (currentIndex > 0) {
        const upperTab = tabs[currentIndex - 1];
        switchTab(upperTab.id);
      } else if (tabs.length > 1) {
        const lowerTab = tabs[1];
        switchTab(lowerTab.id);
      }
    }
    
    setTimeout(() => {
      closeTab(tabId);
    }, 0);
  };

  const checkTextOverflow = (tabId) => {
    const el = textRefs.current.get(tabId);
    if (el) {
      return el.scrollWidth > el.clientWidth;
    }
    return false;
  };

  const handleDropdownMouseEnter = (tabId, index) => {
    setHoveredDropdownTabId(tabId);
    
    if (dropdownTooltipTimeoutRef.current) clearTimeout(dropdownTooltipTimeoutRef.current);
    
    dropdownTooltipTimeoutRef.current = setTimeout(() => {
      const isOverflow = checkTextOverflow(tabId);
      if (isOverflow) {
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
          const rowTop = ROW_TOP_PADDING + index * ROW_FULL_HEIGHT;
          setDropdownTooltip({ text: tab.label, top: rowTop + TEXT_HEIGHT + 4 });
        }
      }
    }, 400);
  };

  const handleDropdownMouseLeave = () => {
    setHoveredDropdownTabId(null);
    if (dropdownTooltipTimeoutRef.current) { clearTimeout(dropdownTooltipTimeoutRef.current); dropdownTooltipTimeoutRef.current = null; }
    setDropdownTooltip(null);
  };

  const getIndicatorColor = (tabId, index) => {
    if (!showDropdown) return 'rgba(45, 64, 89, 0.5)';
    
    const target = getIndicatorTarget(index);
    const currentIndicatorCenter = indicatorY + INDICATOR_HEIGHT / 2;
    const rowCenter = target + INDICATOR_HEIGHT / 2;
    const distance = Math.abs(currentIndicatorCenter - rowCenter);
    const threshold = TEXT_HEIGHT / 2 + 2;
    
    if (distance <= threshold) return '#666EFE';
    if (hoveredDropdownTabId === tabId) return '#2D4059';
    
    return 'rgba(45, 64, 89, 0.5)';
  };

  const displayCount = tabs.length > 99 ? '99+' : tabs.length;
  const totalHeight = tabs.length * ROW_FULL_HEIGHT + ROW_TOP_PADDING * 2 - ROW_GAP;
  const dropdownMaxHeight = Math.min(totalHeight, 500);

  return (
    <>
      <div ref={rootContainerRef} className="flex items-center h-[35px] w-full relative"
        style={{ paddingLeft: HORIZONTAL_PADDING, paddingRight: HORIZONTAL_PADDING }}>
        
        <div className="flex-shrink-0 flex items-center justify-center" style={{ width: LOGO_WIDTH, height: 30 }}>
          <img src={Logo} alt="Logo" className="h-full w-auto object-contain" draggable={false}
            style={{ pointerEvents: 'none', userSelect: 'none' }} />
        </div>

        <div style={{ width: GAP_BETWEEN_LOGO_COUNTER, flexShrink: 0 }} />

        <div className="relative flex-shrink-0">
          <div ref={counterButtonRef} onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center cursor-pointer transition-all duration-300 hover:shadow-md"
            style={{ width: COUNTER_WIDTH, height: 34, backgroundColor: '#FFFFFF', borderRadius: 10 }}>
            <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', marginLeft: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: '#2D4059' }}>{displayCount}</span>
            </div>
            <div style={{ width: 8, flexShrink: 0 }} />
            <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', perspective: '200px' }}>
              <motion.div animate={{ rotateX: showDropdown ? 180 : 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ width: 10, height: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transformStyle: 'preserve-3d' }}>
                <img src={Arrow} alt="arrow" style={{ width: 10, height: 8 }} />
              </motion.div>
            </div>
          </div>

          <AnimatePresence>
            {showDropdown && tabs.length > 0 && (
              <motion.div ref={dropdownRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="absolute z-20"
                style={{
                  left: '50%', transform: 'translateX(-50%)', top: '100%', marginTop: 4,
                  width: 274, maxHeight: dropdownMaxHeight, backgroundColor: '#FFFFFF',
                  borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #E5E7EB',
                  overflowY: 'auto', overflowX: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none',
                }}>
                <style>{`div[style*="overflowY: auto"]::-webkit-scrollbar { display: none; }`}</style>

                <div ref={dropdownInnerRef} style={{ position: 'relative', paddingTop: ROW_TOP_PADDING, paddingBottom: ROW_TOP_PADDING, overflow: 'visible' }}>
                  <div style={{
                    position: 'absolute', left: INDICATOR_LEFT, top: 0,
                    width: INDICATOR_WIDTH, height: INDICATOR_HEIGHT,
                    backgroundColor: '#666EFE', borderRadius: 999, zIndex: 1, pointerEvents: 'none',
                    transform: `translateY(${indicatorY}px)`,
                  }} />

                  <AnimatePresence>
                    {tabs.map((tab, index) => {
                      const showCloseButton = canCloseTab(tab);
                      const indicatorColor = getIndicatorColor(tab.id, index);

                      return (
                        <motion.div
                          key={tab.id}
                          layout
                          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                          animate={{ opacity: 1, height: TEXT_HEIGHT, marginBottom: index < tabs.length - 1 ? ROW_GAP : 0 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 40, duration: 0.35 }}
                          onMouseEnter={() => handleDropdownMouseEnter(tab.id, index)}
                          onMouseLeave={handleDropdownMouseLeave}
                          style={{
                            display: 'flex', alignItems: 'center',
                            cursor: 'pointer', backgroundColor: 'transparent', position: 'relative',
                            overflow: 'hidden',
                          }}>
                          <span
                            ref={el => { if (el) textRefs.current.set(tab.id, el); else textRefs.current.delete(tab.id); }}
                            onClick={() => switchTab(tab.id)}
                            style={{
                              fontSize: 15, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: indicatorColor,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              marginLeft: 20, marginRight: showCloseButton ? 36 : 27,
                              flex: 1, transition: 'color 0.1s ease', maxWidth: TEXT_MAX_WIDTH,
                              lineHeight: `${TEXT_HEIGHT}px`, cursor: 'pointer',
                            }}>{tab.label}</span>
                          {showCloseButton && (
                            <button onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                              style={{
                                position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)',
                                width: 9, height: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                              }}>
                              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                                <path d="M1 1L8 8M8 1L1 8" stroke={indicatorColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ width: GAP_BETWEEN_COUNTER_TABS, flexShrink: 0 }} />

        <div ref={tabsContainerRef} className="flex items-center flex-1 min-w-0 overflow-hidden" style={{ gap: GAP_BETWEEN_TABS }}>
          {visibleTabs.map((tab, index) => {
            const isActive = activeTabId === tab.id;
            const tabWidth = tabWidths[index] || MAX_TAB_WIDTH;
            const showCloseButton = canCloseTab(tab);
            const textColor = isActive ? '#2D4059' : '#9CA3AF';

            return (
              <motion.div key={tab.id} layout
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                transition={{ type: "spring", stiffness: 500, damping: 40, duration: 0.3 }}
                className="flex-shrink-0" style={{ width: tabWidth }}>
                <div ref={el => { if (el) tabRefs.current.set(tab.id, el); else tabRefs.current.delete(tab.id); }}
                  onMouseEnter={() => handleTabMouseEnter(tab.id)}
                  onMouseLeave={handleTabMouseLeave}
                  className="relative flex items-center"
                  style={{
                    height: 35, width: '100%', borderRadius: 6, backgroundColor: '#FFFFFF',
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  }}>
                  <div style={{ position: 'absolute', left: 0, width: 4, height: 22, borderTopRightRadius: 3, borderBottomRightRadius: 3, backgroundColor: '#666EFE' }} />
                  <div onClick={() => switchTab(tab.id)}
                    style={{
                      position: 'absolute', left: 15, right: showCloseButton ? 31 : 15,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      color: textColor, fontSize: 15, fontWeight: 500, cursor: 'pointer',
                      lineHeight: '35px', height: '100%',
                    }}>{tab.label}</div>
                  {showCloseButton && (
                    <motion.button initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }} transition={{ duration: 0.2 }}
                      onClick={e => { e.stopPropagation(); handleCloseTab(tab.id); }}
                      className="absolute flex items-center justify-center"
                      style={{ right: 11, width: 8, height: 8, top: '50%', marginTop: -4, cursor: 'pointer', zIndex: 2 }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 1L7 7M7 1L1 7" stroke={isActive ? "#2D4059" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          style={{ transition: 'stroke 0.2s ease', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.setAttribute('stroke', '#2D4059')}
                          onMouseLeave={e => e.currentTarget.setAttribute('stroke', isActive ? "#2D4059" : "#9CA3AF")} />
                      </svg>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {hoveredTabId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: shouldAnimateTooltip ? 0.2 : 0 } }}
            transition={{ duration: shouldAnimateTooltip ? 0.2 : 0 }}
            style={{
              position: 'fixed', left: tooltipPosition.left, top: tooltipPosition.top, transform: 'translateX(-50%)',
              backgroundColor: '#FFFFFF', color: '#2D4059', padding: '6px 12px', borderRadius: 8,
              fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', zIndex: 9999, pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #E5E7EB',
            }}>
            {tabs.find(t => t.id === hoveredTabId)?.label}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dropdownTooltip && dropdownRef.current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              left: dropdownRef.current.getBoundingClientRect().left + 20,
              top: dropdownRef.current.getBoundingClientRect().top + dropdownTooltip.top,
              backgroundColor: '#2D4059',
              color: '#FFFFFF',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap',
              zIndex: 9999,
              pointerEvents: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {dropdownTooltip.text}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TabBar;