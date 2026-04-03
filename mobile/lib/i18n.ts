import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import es from '../locales/es.json';
import en from '../locales/en.json';

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'es';
const supportedLocales = ['es', 'en'];
const lng = supportedLocales.includes(deviceLocale) ? deviceLocale : 'es';

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng,
  fallbackLng: 'es',
  interpolation: {
    // React already escapes values — no need for i18next escaping
    escapeValue: false,
  },
});

export default i18n;
