// services/navigate.js
let navigator = null;

export const setNavigator = (nav) => {
  navigator = nav;
};

export const navigateTo = (to) => {
  if (navigator) {
    navigator(to);
  } else {
    console.warn('Navigator is not initialized');
  }
};