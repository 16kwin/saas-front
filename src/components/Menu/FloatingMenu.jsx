// components/Menu/FloatingMenu.jsx — с разными иконками и без Заказчиков
import { useState, useRef, useEffect } from 'react';
import { useTabs } from '../../context/TabContext';

import IconOrders from '../../assets/Menu/orders.svg';
import IconTkp from '../../assets/Menu/tkp.svg';
import IconReferences from '../../assets/Menu/3.svg';
import IconAccount from '../../assets/Menu/9.svg';
import ArrowIcon from '../../assets/Menu/Arrow2.svg';

const menuItems = [
  { path: '/orders', label: 'Заказы', icon: IconOrders, iconWidth: 30, iconHeight: 30},
  { path: '/tkp', label: 'ТКП', icon: IconTkp, iconWidth: 30, iconHeight: 30 },
  { path: '/references', label: 'Справочники', icon: IconReferences, hasPopup: true, iconWidth: 22, iconHeight: 24 },
  { path: '/account', label: 'Аккаунт', icon: IconAccount, iconWidth: 24, iconHeight: 24 },
];

const referencesItems = [
  { label: 'Номенклатура', path: '/references/nomenclature' },
];

const getPopupContent = (popupIndex) => {
  if (popupIndex === 2) return 'references';
  return null;
};

const FloatingMenu = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [canHoverItems, setCanHoverItems] = useState(false);
  const [activePopup, setActivePopup] = useState(null);
  const [menuWidth, setMenuWidth] = useState(370);
  const [bridgeLeft, setBridgeLeft] = useState(0);
  const [popupClosing, setPopupClosing] = useState(false);
  const { openTab } = useTabs();
  const itemLeaveTimeoutRef = useRef(null);
  const collapseTimeoutRef = useRef(null);
  const hoverEnableTimeoutRef = useRef(null);
  const popupTimeoutRef = useRef(null);
  const popupCloseTimeoutRef = useRef(null);
  const popupCloseAnimationRef = useRef(null);
  const itemRefs = useRef([]);
  const expandedMenuRef = useRef(null);
  const menuFullyClosedRef = useRef(true);
  const prevActivePopupRef = useRef(null);

  useEffect(() => {
    const checkVisibility = () => {
      const whiteBlock = document.querySelector('.white-block');
      if (whiteBlock) {
        const rect = whiteBlock.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const isFullyVisible = rect.bottom <= windowHeight;
        setIsVisible(isFullyVisible);
      }
    };

    checkVisibility();
    window.addEventListener('scroll', checkVisibility);
    window.addEventListener('resize', checkVisibility);
    
    return () => {
      window.removeEventListener('scroll', checkVisibility);
      window.removeEventListener('resize', checkVisibility);
    };
  }, []);

  useEffect(() => {
    if (isHovered && expandedMenuRef.current) {
      const rect = expandedMenuRef.current.getBoundingClientRect();
      setMenuWidth(rect.width);
    } else {
      setMenuWidth(370);
    }
  }, [isHovered]);

  const calculateBridgePosition = (index) => {
    const item = itemRefs.current[index];
    const menu = expandedMenuRef.current;
    if (!item || !menu) return;
    
    const itemRect = item.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const itemCenter = itemRect.left + itemRect.width / 2;
    const leftOffset = itemCenter - menuRect.left - 30;
    
    setBridgeLeft(leftOffset);
  };

  const collapseMenu = () => {
    setIsHovered(false);
    setCanHoverItems(false);
    menuFullyClosedRef.current = true;
    setHoveredItem(null);
  };

  const closePopupOnly = () => {
    if (activePopup !== null && !popupClosing) {
      prevActivePopupRef.current = activePopup;
      setPopupClosing(true);
      
      popupCloseAnimationRef.current = setTimeout(() => {
        setPopupClosing(false);
        setActivePopup(null);
      }, 300);
    }
  };

  const enableHoverWithDelay = () => {
    if (hoverEnableTimeoutRef.current) {
      clearTimeout(hoverEnableTimeoutRef.current);
    }
    setCanHoverItems(false);
    menuFullyClosedRef.current = false;
    hoverEnableTimeoutRef.current = setTimeout(() => {
      setCanHoverItems(true);
    }, 500);
  };

  const handleMouseEnter = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsHovered(true);

    if (menuFullyClosedRef.current || !canHoverItems) {
      enableHoverWithDelay();
    }
  };

  const handleMouseLeave = () => {
    if (hoverEnableTimeoutRef.current) {
      clearTimeout(hoverEnableTimeoutRef.current);
      hoverEnableTimeoutRef.current = null;
    }
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }

    collapseTimeoutRef.current = setTimeout(() => {
      collapseMenu();
    }, 700);
  };

  const handleItemMouseEnter = (index) => {
    const item = menuItems[index];

    if (itemLeaveTimeoutRef.current) {
      clearTimeout(itemLeaveTimeoutRef.current);
      itemLeaveTimeoutRef.current = null;
    }
    setHoveredItem(index);
    
    if (item.hasPopup) {
      if (popupCloseTimeoutRef.current) {
        clearTimeout(popupCloseTimeoutRef.current);
        popupCloseTimeoutRef.current = null;
      }
      if (popupCloseAnimationRef.current) {
        clearTimeout(popupCloseAnimationRef.current);
        popupCloseAnimationRef.current = null;
      }
      
      if (activePopup !== null && !popupClosing) {
        calculateBridgePosition(index);
        prevActivePopupRef.current = activePopup;
        setActivePopup(index);
      } else if (activePopup === null || popupClosing) {
        setPopupClosing(false);
        prevActivePopupRef.current = null;
        if (popupTimeoutRef.current) {
          clearTimeout(popupTimeoutRef.current);
        }
        popupTimeoutRef.current = setTimeout(() => {
          calculateBridgePosition(index);
          setActivePopup(index);
        }, 700);
      }
    } else if (canHoverItems) {
      if (popupCloseTimeoutRef.current) {
        clearTimeout(popupCloseTimeoutRef.current);
        popupCloseTimeoutRef.current = null;
      }
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }
      closePopupOnly();
    }
  };

  const handleItemMouseLeave = () => {
    itemLeaveTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 100);

    if (activePopup !== null) {
      popupCloseTimeoutRef.current = setTimeout(() => {
        closePopupOnly();
      }, 300);
    }
  };

  const handlePopupMouseEnter = (index) => {
    if (popupCloseTimeoutRef.current) {
      clearTimeout(popupCloseTimeoutRef.current);
      popupCloseTimeoutRef.current = null;
    }
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }
    if (popupCloseAnimationRef.current) {
      clearTimeout(popupCloseAnimationRef.current);
      popupCloseAnimationRef.current = null;
    }
    if (itemLeaveTimeoutRef.current) {
      clearTimeout(itemLeaveTimeoutRef.current);
    }
    setPopupClosing(false);
    setActivePopup(index);
  };

  const handlePopupMouseLeave = () => {
    closePopupOnly();
  };

  const handlePopupItemClick = (path, label) => {
    if (!path) return;
    openTab(path, label, null);
    setHoveredItem(null);
    closePopupOnly();
    collapseMenu();
  };

  useEffect(() => {
    return () => {
      if (itemLeaveTimeoutRef.current) clearTimeout(itemLeaveTimeoutRef.current);
      if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
      if (hoverEnableTimeoutRef.current) clearTimeout(hoverEnableTimeoutRef.current);
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
      if (popupCloseTimeoutRef.current) clearTimeout(popupCloseTimeoutRef.current);
      if (popupCloseAnimationRef.current) clearTimeout(popupCloseAnimationRef.current);
    };
  }, []);

  const handleNavigate = (path, label) => {
    openTab(path, label, null);
    setHoveredItem(null);
    closePopupOnly();
    collapseMenu();
  };

  if (!isVisible) return null;

  const isSamePopup = prevActivePopupRef.current !== null && 
    activePopup !== null && 
    prevActivePopupRef.current !== activePopup;

  const showPopup = activePopup !== null || popupClosing;
  const displayIndex = popupClosing ? prevActivePopupRef.current : activePopup;
  const popupType = displayIndex !== null ? getPopupContent(displayIndex) : null;

  return (
    <>
      {activePopup !== null && (
        <div 
          className="fixed inset-0 z-40 transition-opacity duration-300"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            opacity: popupClosing ? 0 : 1,
          }}
        />
      )}
      
      <div 
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 px-4 flex justify-center"
        style={{ width: 'auto', minWidth: '370px' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="transition-all duration-1000 ease-out relative"
          style={{ display: 'inline-block', width: 'auto', minWidth: '370px' }}
        >
          {isHovered && showPopup && displayIndex !== null && (
            <div 
              className={`absolute left-1/2 -translate-x-1/2 ${
                popupClosing ? 'animate-popupOut' : isSamePopup ? '' : 'animate-popupIn'
              }`}
              style={{
                width: `${menuWidth}px`,
                bottom: '104px',
              }}
              onMouseEnter={() => !popupClosing && displayIndex !== null && handlePopupMouseEnter(displayIndex)}
              onMouseLeave={handlePopupMouseLeave}
            >
              <div 
                style={{
                  width: '100%',
                  height: '436px',
                  backgroundColor: '#3F3E3F',
                  borderRadius: '40px',
                  marginBottom: '-1px',
                  padding: '30px 40px',
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <h2 style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  margin: 0,
                  alignSelf: 'center',
                }}>
                  {menuItems[displayIndex].label}
                </h2>

                <div style={{
                  width: '280px',
                  height: '2px',
                  backgroundColor: '#FFFFFF',
                  marginTop: '11px',
                  alignSelf: 'center',
                }} />

                {popupType === 'references' && (
                  <div style={{ marginTop: '30px', paddingLeft: '40px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {referencesItems.map((item, i) => (
                      <div
                        key={i}
                        onClick={() => handlePopupItemClick(item.path, `Справочник: ${item.label}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#FFFFFF',
                          flexShrink: 0,
                        }} />
                        <span style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '15px',
                          fontWeight: 400,
                          color: '#FFFFFF',
                        }}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div 
                style={{
                  marginLeft: `${bridgeLeft}px`,
                  width: '60px',
                  height: '7px',
                  backgroundColor: '#3F3E3F',
                  transition: isSamePopup ? 'margin-left 0.3s ease-out' : 'none',
                  WebkitMaskImage: 'radial-gradient(circle 3.5px at 0px 3.5px, transparent 3.5px, black 3.5px), radial-gradient(circle 3.5px at 60px 3.5px, transparent 3.5px, black 3.5px)',
                  maskImage: 'radial-gradient(circle 3.5px at 0px 3.5px, transparent 3.5px, black 3.5px), radial-gradient(circle 3.5px at 60px 3.5px, transparent 3.5px, black 3.5px)',
                  WebkitMaskComposite: 'source-in',
                  maskComposite: 'intersect',
                }}
              />
            </div>
          )}
          
          <div 
            ref={expandedMenuRef}
            className={`transition-all duration-1000 ease-out ${
              isHovered 
                ? '-translate-y-10 rounded-[30px] bg-[#3F3E3F] shadow-xl' 
                : 'translate-y-[30px] rounded-[30px] bg-[#3F3E3F]'
            } flex items-center justify-center px-4 cursor-pointer relative`}
            style={{
              height: isHovered ? 'auto' : '60px',
              minHeight: isHovered ? '64px' : '60px',
              paddingTop: isHovered ? '17px' : '0',
              paddingBottom: isHovered ? '17px' : '0',
              width: isHovered ? 'auto' : '370px',
              minWidth: '370px',
              transformOrigin: 'center',
            }}
          >
            {!isHovered && (
              <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '10px' }}>
                <img src={ArrowIcon} alt="arrow" className="w-5 h-auto" />
              </div>
            )}

            {isHovered && (
              <div className="flex items-center animate-fadeIn">
                {menuItems.map((item, index) => {
                  const isItemHovered = hoveredItem === index;
                  const isPopup = item.hasPopup;
                  const isFirst = index === 0;
                  const isLast = index === menuItems.length - 1;
                  
                  return (
                    <div 
                      key={index}
                      className="flex items-center justify-center transition-all duration-700 ease-out"
                      style={{ 
                        paddingLeft: isFirst ? '20px' : '25px',
                        paddingRight: isLast ? '20px' : '25px',
                      }}
                      onMouseEnter={() => handleItemMouseEnter(index)}
                      onMouseLeave={() => handleItemMouseLeave()}
                      onClick={() => !isPopup && handleNavigate(item.path, item.label)}
                    >
                      <div
                        ref={(el) => { itemRefs.current[index] = el; }}
                        className="relative flex items-center justify-center transition-all duration-700 ease-out"
                        style={{
                          width: isPopup ? '30px' : (isItemHovered && canHoverItems ? '120px' : '30px'),
                          height: '30px',
                          borderRadius: '30px',
                          transition: 'all 0.7s cubic-bezier(0.34, 1.2, 0.64, 1)',
                          cursor: 'pointer',
                        }}
                      >
                        {!isPopup && (
                          <span 
                            className="absolute text-white text-sm font-medium whitespace-nowrap transition-all duration-700 ease-out"
                            style={{
                              opacity: isItemHovered && canHoverItems ? 1 : 0,
                              transform: isItemHovered && canHoverItems ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.8)',
                              left: '50%',
                              top: '50%',
                            }}
                          >
                            {item.label}
                          </span>
                        )}
                        <img 
                          src={item.icon} 
                          alt={item.label} 
                          className="transition-all duration-700 ease-out"
                          style={{
                            width: `${item.iconWidth}px`,
                            height: `${item.iconHeight}px`,
                            opacity: isPopup ? 1 : (isItemHovered && canHoverItems ? 0 : 1),
                            transform: isPopup ? 'scale(1)' : (isItemHovered && canHoverItems ? 'scale(0)' : 'scale(1)'),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes popupIn {
          0% { opacity: 0; transform: translate(-50%, 20px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-popupIn {
          animation: popupIn 0.3s ease-out forwards;
        }
        @keyframes popupOut {
          0% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, 20px); }
        }
        .animate-popupOut {
          animation: popupOut 0.3s ease-in forwards;
        }
      `}</style>
    </>
  );
};

export default FloatingMenu;