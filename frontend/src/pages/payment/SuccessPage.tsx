import { useEffect, useEffectEvent, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import type { ApiResponse, UserBalanceResponse } from '../../types';

const SuccessPage = () => {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [syncing, setSyncing] = useState(true);
  const initialBalanceRef = useRef(user?.balance);
  const refreshAccount = useEffectEvent(async () => {
    await refreshProfile();
  });
  const orderCode = searchParams.get('orderCode') || searchParams.get('transactionCode') || 'N/A';

  // Sync wallet balance
  useEffect(() => {
    if (!user?.id) return;

    let isSubscribed = true;
    const initialBalance = initialBalanceRef.current;
    const startTime = Date.now();
    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    const pollBalance = async () => {
      if (!isSubscribed) return;
      try {
        const response = await api.get<ApiResponse<UserBalanceResponse>>('/users/me/balance');
        if (!isSubscribed) return;

        const latestBalance = response.data.result.balance;

        if (latestBalance !== initialBalance) {
          await refreshAccount();
          if (isSubscribed) {
            setSyncing(false);
            clearInterval(intervalId);
          }
          return;
        }

        if (Date.now() - startTime >= FIVE_MINUTES_MS) {
          console.warn('Wallet balance polling timed out after 5 minutes.');
          if (isSubscribed) {
            setSyncing(false);
            clearInterval(intervalId);
          }
        }
      } catch (error) {
        console.error('Error polling wallet balance:', error);
      }
    };

    const intervalId = setInterval(pollBalance, 1000);
    pollBalance();

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, [user?.id]);


  return (
    <div className="coding-payment">
      <div className="coding-payment-state"><Check size={20} aria-hidden="true" /><span>{t('donate.success')}</span></div>
      <header className="coding-page-header">
        <div><h1>{t('coding.payment_received')}</h1><p>{t('donate.thank_you_desc')}</p></div>
      </header>
      <dl className="coding-panel coding-payment-details">
        <div><dt>{t('donate.transaction_id')}</dt><dd>{orderCode}</dd></div>
        <div><dt>{t('donate.status')}</dt><dd className="text-code-success">{t('donate.success')}</dd></div>
        {syncing && <div role="status"><dt>{t('coding.payment_verifying')}</dt><dd className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" aria-hidden="true" />{t('coding.payment_checking')}</dd></div>}
      </dl>
      <div className="coding-payment-actions">
        <Link to="/oj/practice" className="coding-button">{t('home.hero.practice')}<ArrowUpRight size={16} aria-hidden="true" /></Link>
        <Link to="/" className="coding-button coding-button-secondary"><ArrowLeft size={16} aria-hidden="true" />{t('donate.back_home')}</Link>
      </div>
    </div>
  );
};

export default SuccessPage;
