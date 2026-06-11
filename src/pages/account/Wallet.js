import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, Gift, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { walletAPI, publicAPI } from 'api';
import { useAuth } from '../../context/AuthContext';
import { apiMessage } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import WalletTopUpModal from '../../components/WalletTopUpModal';
import { formatPKR } from '../../utils/currency';

const REASON_LABELS = {
  top_up: 'Top-up',
  refund: 'Refund',
  cashback: 'Cashback',
  checkout: 'Order payment',
  order_cancel: 'Cancellation refund',
  admin_adjustment: 'Store credit'
};

function reasonLabel(reason) {
  return REASON_LABELS[reason] || reason || 'Transaction';
}

function WalletContent({ stripeEnabled }) {
  const { checkAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [topUpAmount, setTopUpAmount] = useState('1000');
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, txRes] = await Promise.all([
        walletAPI.getSummary(),
        walletAPI.getTransactions({ page: 1, limit: 30 })
      ]);
      setSummary(summaryRes.data?.data || null);
      setTransactions(Array.isArray(txRes.data?.data?.transactions) ? txRes.data.data.transactions : []);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not load wallet'));
      setSummary(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const balance = Number(summary?.balance ?? 0);
  const offer = summary?.cashbackOffer;
  const parsedTopUp = Math.round(Number(topUpAmount) * 100) / 100;
  const topUpValid = Number.isFinite(parsedTopUp) && parsedTopUp >= 100 && parsedTopUp <= 500000;

  const handleTopUpSuccess = async () => {
    await checkAuth();
    await load();
  };

  if (loading) {
    return <LoadingSpinner label="Loading wallet" />;
  }

  return (
    <div className="account-page account-wallet">
      <h2 className="account-page__title">My wallet</h2>
      <p className="account-wallet__lead">
        Store credit for refunds, rewards, and one-click checkout on Bazaar.
      </p>

      <div className="account-wallet__balance card-like">
        <div className="account-wallet__balance-icon" aria-hidden>
          <WalletIcon size={28} strokeWidth={1.75} />
        </div>
        <div className="account-wallet__balance-body">
          <span className="account-wallet__balance-label">Available balance</span>
          <strong className="account-wallet__balance-value">{formatPKR(balance)}</strong>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={load} aria-label="Refresh">
          <RefreshCw size={16} aria-hidden />
        </button>
      </div>

      {offer?.enabled ? (
        <div className="account-wallet__offer card-like">
          <Gift size={20} strokeWidth={1.75} aria-hidden />
          <p>
            Earn <strong>{formatPKR(offer.amount)}</strong> cashback on orders over{' '}
            <strong>{formatPKR(offer.minOrder)}</strong> — credited to your wallet when delivered.
          </p>
        </div>
      ) : null}

      <section className="account-wallet__topup card-like">
        <h3 className="account-wallet__section-title">Top up wallet</h3>
        <p className="account-wallet__hint">
          Recharge in advance for faster checkout. Minimum {formatPKR(100)}.
        </p>
        {stripeEnabled ? (
          <div className="account-wallet__topup-form">
            <label className="form-label" htmlFor="wallet-topup-amount">
              Amount (PKR)
            </label>
            <div className="account-wallet__topup-row">
              <input
                id="wallet-topup-amount"
                type="number"
                min={100}
                max={500000}
                step={100}
                className="form-control"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-gold"
                disabled={!topUpValid}
                onClick={() => setTopUpOpen(true)}
              >
                Add funds
              </button>
            </div>
            <div className="account-wallet__quick-amounts">
              {[500, 1000, 2500, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setTopUpAmount(String(amt))}
                >
                  {formatPKR(amt)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="account-wallet__hint account-wallet__hint--muted">
            Card top-up is not available right now. Refunds and cashback are still credited to your
            wallet automatically.
          </p>
        )}
      </section>

      <section className="account-wallet__uses">
        <h3 className="account-wallet__section-title">How it works</h3>
        <ul className="account-wallet__uses-list">
          <li>
            <strong>Refunds</strong> — Cancelled or out-of-stock orders are credited here instead of
            bank transfer.
          </li>
          <li>
            <strong>Cashback</strong> — Shopping rewards land in your wallet for your next order.
          </li>
          <li>
            <strong>Fast checkout</strong> — Apply wallet balance at checkout with cash on delivery.
          </li>
        </ul>
      </section>

      <section className="account-wallet__history">
        <div className="account-section-head">
          <h3>Recent activity</h3>
          <Link to="/shop" className="btn btn-outline btn-sm">
            Shop now
          </Link>
        </div>
        {transactions.length === 0 ? (
          <p className="empty-products-hint">No wallet activity yet.</p>
        ) : (
          <div className="account-table-wrap">
            <table className="account-table account-wallet__table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isCredit = tx.type === 'credit';
                  return (
                    <tr key={tx._id}>
                      <td>
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <span className="account-wallet__tx-reason">{reasonLabel(tx.reason)}</span>
                        {tx.description ? (
                          <span className="account-wallet__tx-desc">{tx.description}</span>
                        ) : null}
                      </td>
                      <td>
                        <span
                          className={`account-wallet__tx-amount${
                            isCredit ? ' account-wallet__tx-amount--credit' : ' account-wallet__tx-amount--debit'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft size={14} aria-hidden />
                          ) : (
                            <ArrowUpRight size={14} aria-hidden />
                          )}
                          {isCredit ? '+' : '−'}
                          {formatPKR(tx.amount)}
                        </span>
                      </td>
                      <td>{formatPKR(tx.balanceAfter)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {stripeEnabled ? (
        <WalletTopUpModal
          isOpen={topUpOpen}
          onClose={() => !topUpSubmitting && setTopUpOpen(false)}
          amount={parsedTopUp}
          onSuccess={handleTopUpSuccess}
          submitting={topUpSubmitting}
          setSubmitting={setTopUpSubmitting}
        />
      ) : null}
    </div>
  );
}

export default function Wallet() {
  const [stripeKey, setStripeKey] = useState('');
  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    publicAPI
      .getStripeConfig()
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data;
        if (data?.configured && data?.publishableKey) {
          setStripeKey(String(data.publishableKey).trim());
        } else {
          setStripeKey('');
        }
      })
      .catch(() => {
        if (!cancelled) setStripeKey('');
      })
      .finally(() => {
        if (!cancelled) setStripeReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stripePromise = useMemo(
    () => (stripeKey ? loadStripe(stripeKey) : null),
    [stripeKey]
  );

  if (!stripeReady) {
    return <LoadingSpinner label="Loading wallet" />;
  }

  if (stripePromise) {
    return (
      <Elements stripe={stripePromise}>
        <WalletContent stripeEnabled />
      </Elements>
    );
  }

  return <WalletContent stripeEnabled={false} />;
}
