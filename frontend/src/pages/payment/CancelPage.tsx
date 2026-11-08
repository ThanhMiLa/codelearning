import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CancelPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get('orderCode') || searchParams.get('transactionCode') || 'N/A';

  return (
    <div className="coding-payment">
      <div className="flex items-center gap-2 text-code-error"><X size={20} aria-hidden="true" /><span>{t('donate.cancel_status')}</span></div>
      <header className="coding-page-header">
        <div><h1>{t('donate.cancel_title')}</h1><p>{t('donate.cancel_desc')}</p></div>
      </header>
      <dl className="coding-panel coding-payment-details">
        <div><dt>{t('donate.transaction_id')}</dt><dd>{orderCode}</dd></div>
        <div><dt>{t('donate.status')}</dt><dd className="text-code-error">{t('donate.cancel_status')}</dd></div>
      </dl>
      <div className="coding-payment-actions">
        <Link to="/deposit" className="coding-button">{t('donate.button_retry')}<ArrowUpRight size={16} aria-hidden="true" /></Link>
        <Link to="/" className="coding-button coding-button-secondary"><ArrowLeft size={16} aria-hidden="true" />{t('donate.back_home')}</Link>
      </div>
    </div>
  );
};

export default CancelPage;
