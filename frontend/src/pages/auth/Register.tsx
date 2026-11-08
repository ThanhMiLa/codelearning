import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, Mail, Phone, Eye, EyeOff, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorUtils';
import { useTranslation } from 'react-i18next';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    displayName?: string;
    username?: string;
    email?: string;
    phoneNumber?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const errors: typeof validationErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^0\d{9}$/;

    if (!displayName.trim() || displayName.length < 4) {
      errors.displayName = t('register.validation.displayName_len');
    }
    if (!username.trim() || username.length < 4) {
      errors.username = t('register.validation.username_len');
    }
    if (!email.trim()) {
      errors.email = t('register.validation.email_required');
    } else if (!emailRegex.test(email)) {
      errors.email = t('register.validation.email_invalid');
    }
    if (phoneNumber.trim() && !phoneRegex.test(phoneNumber)) {
      errors.phoneNumber = t('register.validation.phone_invalid');
    }
    if (!password || password.length < 4) {
      errors.password = t('register.validation.password_len');
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = t('register.validation.confirmPassword_match');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setIsLoadingState(true);
    try {
      await register({
        displayName,
        username,
        email,
        phoneNumber: phoneNumber || null,
        password,
        confirmPassword
      });
      navigate('/profile', { replace: true });
    } catch (err: any) {
      setError(getErrorMessage(err, t('register.error_failed')));
    } finally {
      setIsLoadingState(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-code-bg transition-colors duration-200">
      <div
        className="w-full max-w-lg space-y-8 p-8 sm:p-10 rounded-sm bg-code-panel border-code-border border "
      >
        <div className="text-center">
          <h2 className="text-3xl font-medium tracking-tight text-code-text">
            {t('register.title')}
          </h2>
          <p className="mt-2.5 text-sm text-code-muted">
            {t('register.subtitle')}
          </p>
        </div>

        {error && (
          <div
            className="flex items-start space-x-2.5 p-4 rounded-sm bg-code-error-surface border-code-error-border text-sm text-code-error border"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-xs font-semibold text-code-muted mb-1.5">
                {t('register.displayName_label')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-code-muted">
                  <User className="h-4.5 w-4.5" />
                </div>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (validationErrors.displayName) setValidationErrors(prev => ({ ...prev, displayName: undefined }));
                  }}
                  className={`block w-full pl-11 pr-4 py-3 rounded-sm bg-code-bg/80 text-sm placeholder-code-muted focus:outline-none focus:ring-2 focus:border-code-accent border-code-border focus:ring-code-accent transition-all border ${
                    validationErrors.displayName ? 'border-code-error-border focus:border-code-error-border border' : 'border-code-border border'
                  }`}
                  placeholder={t('placeholders.displayName')}
                />
              </div>
              {validationErrors.displayName && (
                <p className="mt-1.5 text-xs text-code-error font-medium">{validationErrors.displayName}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-code-muted mb-1.5">
                {t('login.username_label')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-code-muted">
                  <User className="h-4.5 w-4.5" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (validationErrors.username) setValidationErrors(prev => ({ ...prev, username: undefined }));
                  }}
                  className={`block w-full pl-11 pr-4 py-3 rounded-sm bg-code-bg/80 text-sm placeholder-code-muted focus:outline-none focus:ring-2 focus:border-code-accent border-code-border focus:ring-code-accent transition-all border ${
                    validationErrors.username ? 'border-code-error-border focus:border-code-error-border border' : 'border-code-border border'
                  }`}
                  placeholder={t('placeholders.username')}
                />
              </div>
              {validationErrors.username && (
                <p className="mt-1.5 text-xs text-code-error font-medium">{validationErrors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-code-muted mb-1.5">
                {t('register.email_label')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-code-muted">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  className={`block w-full pl-11 pr-4 py-3 rounded-sm bg-code-bg/80 text-sm placeholder-code-muted focus:outline-none focus:ring-2 focus:border-code-accent border-code-border focus:ring-code-accent transition-all border ${
                    validationErrors.email ? 'border-code-error-border focus:border-code-error-border border' : 'border-code-border border'
                  }`}
                  placeholder={t('placeholders.email')}
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1.5 text-xs text-code-error font-medium">{validationErrors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-xs font-semibold text-code-muted mb-1.5">
                {t('register.phone_label')} <span className="text-code-muted font-normal">({t('register.optional')})</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-code-muted">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <input
                  id="phoneNumber"
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (validationErrors.phoneNumber) setValidationErrors(prev => ({ ...prev, phoneNumber: undefined }));
                  }}
                  className={`block w-full pl-11 pr-4 py-3 rounded-sm bg-code-bg/80 text-sm placeholder-code-muted focus:outline-none focus:ring-2 focus:border-code-accent border-code-border focus:ring-code-accent transition-all border ${
                    validationErrors.phoneNumber ? 'border-code-error-border focus:border-code-error-border border' : 'border-code-border border'
                  }`}
                  placeholder={t('placeholders.phone')}
                />
              </div>
              {validationErrors.phoneNumber && (
                <p className="mt-1.5 text-xs text-code-error font-medium">{validationErrors.phoneNumber}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-code-muted mb-1.5">
                {t('login.password_label')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-code-muted">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) setValidationErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  className={`block w-full pl-11 pr-11 py-3 rounded-sm bg-code-bg/80 text-sm placeholder-code-muted focus:outline-none focus:ring-2 focus:border-code-accent border-code-border focus:ring-code-accent transition-all border ${
                    validationErrors.password ? 'border-code-error-border focus:border-code-error-border border' : 'border-code-border border'
                  }`}
                  placeholder={t('placeholders.password_placeholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-code-muted hover:text-code-muted transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1.5 text-xs text-code-error font-medium">{validationErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-code-muted mb-1.5">
                {t('register.confirmPassword_label')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-code-muted">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (validationErrors.confirmPassword) setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }}
                  className={`block w-full pl-11 pr-11 py-3 rounded-sm bg-code-bg/80 text-sm placeholder-code-muted focus:outline-none focus:ring-2 focus:border-code-accent border-code-border focus:ring-code-accent transition-all border ${
                    validationErrors.confirmPassword ? 'border-code-error-border focus:border-code-error-border border' : 'border-code-border border'
                  }`}
                  placeholder={t('placeholders.confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-code-muted hover:text-code-muted transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="mt-1.5 text-xs text-code-error font-medium">{validationErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoadingState}
              className="relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-sm text-code-bg bg-code-accent hover:bg-code-accent-hover focus:outline-none focus:ring-2 focus:ring-code-accent transition-all disabled:opacity-50 "
            >
              {isLoadingState ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                t('buttons.register')
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-2 text-sm text-code-muted">
          {t('register.already_account')}{' '}
          <Link to="/login" className="font-semibold hover:text-code-accent text-code-accent hover:underline">
            {t('login.login_now')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
