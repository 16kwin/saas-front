// info/ConstantInfo.js
const ConstantInfo = {
  // База
  apiBaseUrl: 'http://localhost:8086',
  fileDir: 'http://localhost:8086/',

  // Авторизация
  restApiLogin: '/v1/auth/login',
  restApiCheckAuth: '/v1/auth/check',
  restApiLogout: '/v1/auth/logout',
  restApiCheckPassword: '/v1/auth/check_password',
  inactivityTimeout: 5 * 60 * 1000,
  warningTimeout: 30 * 1000,

  // Заказы
  restApiOrdersActive: '/v1/orders?status=active',
  restApiOrdersClosed: '/v1/orders?status=closed',
  restApiOrderGet: (orderUid) => `/v1/orders/${orderUid}`,

  // ТКП
  restApiTkpActive: '/v1/tkp?status=active',
  restApiTkpClosed: '/v1/tkp?status=closed',
  restApiTkpGet: (tkpUid) => `/v1/tkp/${tkpUid}`,

  // Номенклатура
  restApiNomenclatureTree: '/api/nomenclature/tree',
  restApiNomenclatureGetMaterial: (uid) => `/api/nomenclature/${uid}`,
  restApiNomenclatureImages: (materialUid) => `/api/nomenclature/${materialUid}/images`,
  restApiNomenclatureBlueprints: (materialUid) => `/api/nomenclature/${materialUid}/blueprints`,
  restApiNomenclatureCharacteristics: (materialUid) => `/api/nomenclature/${materialUid}/characteristics`,
  restApiNomenclatureAnalogs: (materialUid) => `/api/nomenclature/${materialUid}/analogs`,
  restApiNomenclatureRatings: (materialUid) => `/api/nomenclature/${materialUid}/ratings`,
  restApiNomenclatureRatingsAverage: (materialUid) => `/api/nomenclature/${materialUid}/ratings/average`,
  restApiNomenclatureIntegrations: (materialUid) => `/api/nomenclature/${materialUid}/integrations`,
  restApiNomenclaturePrices: (materialUid) => `/api/nomenclature/${materialUid}/prices`,
  restApiNomenclatureDocuments: (materialUid) => `/api/nomenclature/${materialUid}/documents`,
  restApiNomenclatureEvents: (materialUid) => `/api/nomenclature/${materialUid}/events`,
  restApiNomenclatureSupply: (materialUid) => `/api/nomenclature/${materialUid}/supply`,
  restApiNomenclatureTypeMaterials: '/api/nomenclature/type-materials',
  restApiNomenclatureTypePurposes: '/api/nomenclature/type-purposes',
  restApiNomenclatureTypeProducts: '/api/nomenclature/type-products',
  restApiNomenclatureTypeAttributes: '/api/nomenclature/type-attributes',
  restApiNomenclatureMeasures: '/api/nomenclature/measures',
  restApiNomenclatureManufacturers: '/api/nomenclature/manufacturers',
  restApiNomenclatureBrands: '/api/nomenclature/brands',
  restApiNomenclatureModels: '/api/nomenclature/models',
  restApiNomenclatureCountries: '/api/nomenclature/countries',

  // Заказчики
  restApiCustomers: '/api/nomenclature/customers',
  restApiCustomersList: '/api/customers',
  restApiCustomerGet: (uid) => `/api/customers/${uid}`,
  restApiCustomerDelete: (uid) => `/api/customers/${uid}`,
  restApiCustomerImages: (customerUid) => `/api/customers/${customerUid}/images`,
  restApiCustomerDeleteImage: (uid) => `/api/customers/images/${uid}`,
};

export default ConstantInfo;