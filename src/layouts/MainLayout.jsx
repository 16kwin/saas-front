// layouts/MainLayout.jsx
import { useLocation } from 'react-router-dom';
import FloatingMenu from '../components/Menu/FloatingMenu';
import TabBar from '../components/TabBar/TabBar';
import { useTabs } from '../context/TabContext';
import { useEffect, useState, useRef } from 'react';
import OrdersPage from '../components/AnalyticsPage/OrdersPage';
import OrderCreatePage from '../components/AnalyticsPage/OrderCreatePage';
import TkpPage from '../components/AnalyticsPage/TkpPage';
import TkpCreatePage from '../components/AnalyticsPage/TkpCreatePage';
import AccountPage from '../components/AccountPage/AccountPage';
import NomenclaturePage from '../components/ReferencesPage/NomenclaturePage/NomenclaturePage';
import NomenclatureCreatePage from '../components/ReferencesPage/NomenclaturePage/NomenclatureCreatePage';
import CustomersPage from '../components/ReferencesPage/CustomersPage/CustomersPage';
import CustomerCreatePage from '../components/ReferencesPage/CustomersPage/CustomerCreatePage';
import AxiosService from '../services/AxiosService';
import ConstantInfo from '../info/ConstantInfo';

const nomenclatureInfoCache = new Map();
const customerInfoCache = new Map();

const fetchNomenclatureName = async (uid) => {
  if (nomenclatureInfoCache.has(uid)) return nomenclatureInfoCache.get(uid);
  try {
    const response = await AxiosService.get(ConstantInfo.restApiNomenclatureGetMaterial(uid));
    const name = response.data?.name || uid;
    nomenclatureInfoCache.set(uid, name);
    return name;
  } catch {
    nomenclatureInfoCache.set(uid, uid);
    return uid;
  }
};

const fetchCustomerName = async (uid) => {
  if (customerInfoCache.has(uid)) return customerInfoCache.get(uid);
  try {
    const response = await AxiosService.get(ConstantInfo.restApiCustomerGet(uid));
    const name = response.data?.name || uid;
    customerInfoCache.set(uid, name);
    return name;
  } catch {
    customerInfoCache.set(uid, uid);
    return uid;
  }
};

const staticComponents = {
  '/orders': <OrdersPage />,
  '/tkp': <TkpPage />,
  '/account': <AccountPage />,
  '/references/nomenclature': <NomenclaturePage />,
  '/references/customers': <CustomersPage />,
};

const isChildPath = (path) => {
  return path.startsWith('/references/nomenclature/create/') ||
    path.startsWith('/references/nomenclature/edit/') ||
    path.startsWith('/references/customers/create/') ||
    path.startsWith('/references/customers/edit/') ||
    path.match(/^\/orders\/[^/]+\/tkp\/create$/) !== null ||
    path.match(/^\/orders\/[^/]+$/) !== null ||
    path.match(/^\/tkp\/[^/]+$/) !== null;
};

const getComponentByPath = (path) => {
  if (staticComponents[path] !== undefined) return staticComponents[path];
  if (path.startsWith('/references/nomenclature/create/')) return <NomenclatureCreatePage />;
  if (path.startsWith('/references/nomenclature/edit/')) return <NomenclatureCreatePage />;
  if (path.startsWith('/references/customers/create/')) return <CustomerCreatePage />;
  if (path.startsWith('/references/customers/edit/')) return <CustomerCreatePage />;
  if (path.match(/^\/orders\/[^/]+\/tkp\/create$/)) return <TkpCreatePage />;
  if (path.match(/^\/orders\/[^/]+$/)) return <OrderCreatePage />;
  if (path.match(/^\/tkp\/[^/]+$/)) return <TkpCreatePage />;
  return null;
};

const getLabelByPath = (path) => {
  const staticLabels = {
    '/orders': 'Заказы',
    '/tkp': 'ТКП',
    '/account': 'Аккаунт',
    '/references/nomenclature': 'Справочник: Номенклатура',
    '/references/customers': 'Справочник: Заказчики',
  };
  if (staticLabels[path]) return staticLabels[path];
  if (path.startsWith('/references/nomenclature/create/')) {
    const code = path.split('/').pop();
    return `Номенклатура: ${code}`;
  }
  if (path.startsWith('/references/nomenclature/edit/')) {
    const segments = path.split('/');
    const uid = segments[segments.length - 2];
    return nomenclatureInfoCache.get(uid) || 'Номенклатура';
  }
  if (path.startsWith('/references/customers/create/')) {
    const code = path.split('/').pop();
    return `Заказчик: ${code}`;
  }
  if (path.startsWith('/references/customers/edit/')) {
    const uid = path.split('/').pop() || '';
    return customerInfoCache.get(uid) || 'Заказчик';
  }
  if (path.match(/^\/orders\/[^/]+\/tkp\/create$/)) {
    const segments = path.split('/');
    const uid = segments[1];
    return `ТКП (Заказ ${uid?.slice(0, 8)})`;
  }
  if (path.match(/^\/orders\/[^/]+$/)) {
    const uid = path.split('/').pop();
    return `Заказ ${uid?.slice(0, 8)}`;
  }
  if (path.match(/^\/tkp\/[^/]+$/)) {
    const uid = path.split('/').pop();
    return `ТКП ${uid?.slice(0, 8)}`;
  }
  return 'Заказы';
};

const MainLayout = () => {
  const [padding, setPadding] = useState(60);
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });
  const [isLoaded, setIsLoaded] = useState(false);
  const { tabs, activeTabId, openTab, updateTabComponent, updateTabLabel, switchTab } = useTabs();
  const location = useLocation();
  const prevPathRef = useRef('');

  const MIN_WIDTH = 1920;
  const MIN_HEIGHT = 900;
  const MAX_WIDTH = 1920;
  const MAX_HEIGHT = 1080;

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    let finalWidth = width;
    let finalHeight = height;
    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      finalWidth = MIN_WIDTH;
      finalHeight = MIN_HEIGHT;
    }
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      finalWidth = MAX_WIDTH;
      finalHeight = MAX_HEIGHT;
    }
    setWindowSize({ width: finalWidth, height: finalHeight });
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const fullPath = location.pathname + location.search;
    if (prevPathRef.current === fullPath) return;
    prevPathRef.current = fullPath;
    const existingTab = tabs.find(tab => tab.path === fullPath);
    if (existingTab) {
      if (activeTabId !== existingTab.id) switchTab(existingTab.id);
      if (existingTab.component === null) {
        const component = getComponentByPath(location.pathname);
        if (component) updateTabComponent(existingTab.id, component);
      }
      return;
    }
    const label = getLabelByPath(fullPath);
    const component = getComponentByPath(location.pathname);

    const parentTabId = isChildPath(location.pathname) ? (activeTabId ?? undefined) : undefined;
    const newTabId = openTab(fullPath, label, component, parentTabId);

    if (location.pathname.startsWith('/references/nomenclature/edit/')) {
      const segments = location.pathname.split('/');
      const uid = segments[segments.length - 2];
      fetchNomenclatureName(uid).then(name => updateTabLabel(newTabId, name));
    }
    if (location.pathname.startsWith('/references/customers/edit/')) {
      const uid = location.pathname.split('/').pop() || '';
      if (uid) {
        fetchCustomerName(uid).then(name => updateTabLabel(newTabId, name));
      }
    }
  }, [location.pathname, location.search, isLoaded]);

  useEffect(() => {
    const fullPath = location.pathname + location.search;
    const currentPathExists = tabs.some(tab => tab.path === fullPath);
    if (!currentPathExists) prevPathRef.current = '';
  }, [tabs, location.pathname, location.search]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const scaleX = width / windowSize.width;
      const scaleY = height / windowSize.height;
      const scale = Math.min(scaleX, scaleY);
      if (scale > 1) setPadding(60 * scale);
      else setPadding(60);
    };
    if (isLoaded) {
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [windowSize, isLoaded]);

  if (!isLoaded) return null;

  const tabBarHeight = 35;
  const topOffset = 20;
  const gapBetweenTabBarAndWhiteBlock = 5;

  return (
    <div className="w-full h-dvh relative overflow-auto" style={{ minWidth: `${windowSize.width}px`, minHeight: `${windowSize.height}px` }}>
      <div className="w-full h-full flex items-center justify-center">
        <div style={{ width: `${windowSize.width}px`, height: `${windowSize.height}px` }} className="relative">
          <div className="absolute left-0 right-0 flex justify-center" style={{ top: `${topOffset}px` }}>
            <div style={{ width: `${windowSize.width - padding * 2}px` }}><TabBar /></div>
          </div>
          <div style={{ position: 'absolute', left: `${padding}px`, right: `${padding}px`, top: `${topOffset + tabBarHeight + gapBetweenTabBarAndWhiteBlock}px`, bottom: `${padding}px`, backgroundColor: '#FAFBFC' }} className="rounded-[20px] shadow overflow-auto white-block relative">
            {tabs.map(tab => (
              <div key={tab.id} style={{ display: activeTabId === tab.id ? 'block' : 'none', height: '100%', overflow: 'auto' }}>
                {tab.component}
              </div>
            ))}
          </div>
        </div>
      </div>
      <FloatingMenu />
    </div>
  );
};

export default MainLayout;