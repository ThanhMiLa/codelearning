import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CreditCard, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/errorUtils';
import type { ApiResponse, PaymentDepositResponse } from '../../types';

const formatVND = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);

const DepositPage = () => {
  const { t } = useTranslation();
  const [depositAmount, setDepositAmount] = useState(50000);
  const [customAmountText, setCustomAmountText] = useState('');
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeposit = async () => {
    if (depositAmount < 10000 || isCreatingLink) return;
    setIsCreatingLink(true);
    setError(null);
    try {
      const res = await api.post<ApiResponse<PaymentDepositResponse>>('/payment/deposit', { amount: depositAmount });
      window.location.href = res.data.result.checkoutUrl;
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('coding.payment_error')));
    } finally {
      setIsCreatingLink(false);
    }
  };

  return (
    <div className="coding-payment">
      <Link to="/" className="coding-text-link"><ArrowLeft aria-hidden="true" />{t('donate.back_home')}</Link>
      <header className="coding-page-header">
        <div><h1>{t('coding.payment_title')}</h1><p>{t('coding.payment_description')}</p></div>
        <CreditCard size={28} className="coding-page-symbol" aria-hidden="true" />
      </header>
      <form className="coding-panel coding-payment-form" onSubmit={(event) => { event.preventDefault(); void handleDeposit(); }}>
        <fieldset disabled={isCreatingLink}>
          <legend className="coding-payment-label">{t('donate.select_amount')}</legend>
          <div className="coding-payment-amounts">
            {[20000, 50000, 100000, 200000, 500000].map(amount => (
              <button key={amount} type="button" aria-pressed={depositAmount === amount} onClick={() => { setDepositAmount(amount); setCustomAmountText(amount.toString()); }}>
                {formatVND(amount)}
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="payment-amount" className="coding-payment-label">{t('donate.custom_amount')}</label>
          <div className="relative">
            <input id="payment-amount" inputMode="numeric" type="text" placeholder="150000" value={customAmountText} disabled={isCreatingLink}
              onChange={(event) => {
                const cleanVal = event.target.value.replace(/[^0-9]/g, '');
                setCustomAmountText(cleanVal);
                setDepositAmount(cleanVal ? Number(cleanVal) : 10000);
              }}
              className="coding-payment-input" aria-describedby="payment-minimum" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-code-muted">VND</span>
          </div>
          <p id="payment-minimum" className="coding-payment-note">{t('donate.min_amount')}</p>
        </div>
        {error && <p role="alert" className="coding-feedback">{error}</p>}
        <div className="border-t border-code-border pt-5">
          <div className="flex justify-between gap-4 mb-5 text-sm"><span className="text-code-muted">{t('coding.payment_total')}</span><strong className="font-medium">{formatVND(depositAmount)}</strong></div>
          <button type="submit" disabled={isCreatingLink || depositAmount < 10000} className="coding-button w-full">
            {isCreatingLink ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ArrowUpRight size={16} aria-hidden="true" />}
            {t(isCreatingLink ? 'donate.button_loading' : 'coding.payment_continue')}
          </button>
          <p className="coding-payment-note">{t('coding.payment_redirect')}</p>
        </div>
      </form>
    </div>
  );
};

export default DepositPage;
