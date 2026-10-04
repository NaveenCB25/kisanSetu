import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import hi from './hi.json';
import mr from './mr.json';
import kn from './kn.json';
import te from './te.json';
import ta from './ta.json';
import pa from './pa.json';
import gu from './gu.json';
import bn from './bn.json';

const savedLang = localStorage.getItem('kisansetu_lang') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    kn: { translation: kn },
    hi: { translation: hi },
    mr: { translation: mr },
    te: { translation: te },
    ta: { translation: ta },
    pa: { translation: pa },
    gu: { translation: gu },
    bn: { translation: bn },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
