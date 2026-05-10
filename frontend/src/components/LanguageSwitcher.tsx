import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'uk' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-lg bg-cardHover text-textPrimary hover:bg-card border border-white/10"
    >
      <Globe size={16} />
      <span>{i18n.language.toUpperCase()}</span>
    </button>
  );
};
