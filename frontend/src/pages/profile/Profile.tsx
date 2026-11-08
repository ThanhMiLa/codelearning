import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Lock,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/errorUtils';
import type { ApiResponse, UserResponse } from '../../types';

const Profile: React.FC = () => {
  const { user, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Profile Form States
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmNewPass, setShowConfirmNewPass] = useState(false);

  // Validation States
  const [profileErrors, setProfileErrors] = useState<{ displayName?: string; phoneNumber?: string }>({});
  const [passwordErrors, setPasswordErrors] = useState<{ oldPassword?: string; newPassword?: string; confirmNewPassword?: string }>({});

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Profile submit handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);
    setProfileErrors({});

    const errors: typeof profileErrors = {};
    if (!displayName.trim() || displayName.length < 4) {
      errors.displayName = 'Display name must be at least 4 characters';
    }
    if (phoneNumber && !/^0\d{9}$/.test(phoneNumber)) {
      errors.phoneNumber = 'Phone number must be 10 digits starting with 0';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setIsProfileUpdating(true);
    try {
      const formData = new FormData();
      formData.append('displayName', displayName);
      if (phoneNumber) {
        formData.append('phoneNumber', phoneNumber);
      }
      if (avatarFile) {
        formData.append('avatarFile', avatarFile);
      }

      await api.patch<ApiResponse<UserResponse>>('/users/me', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await refreshProfile();
      setProfileSuccess('Profile updated successfully!');
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
    } catch (err: any) {
      setProfileError(getErrorMessage(err));
    } finally {
      setIsProfileUpdating(false);
    }
  };

  // Password submit handler
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);
    setPasswordErrors({});

    const errors: typeof passwordErrors = {};
    if (!oldPassword || oldPassword.length < 4) {
      errors.oldPassword = 'Old password must be at least 4 characters';
    }
    if (!newPassword || newPassword.length < 4) {
      errors.newPassword = 'New password must be at least 4 characters';
    }
    if (newPassword !== confirmNewPassword) {
      errors.confirmNewPassword = 'Confirm password does not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsPasswordUpdating(true);
    try {
      await api.put<ApiResponse<void>>('/users/me/password', {
        oldPassword,
        newPassword,
        confirmNewPassword,
      });

      setPasswordSuccess('Password changed successfully! You will be automatically logged out in a few seconds...');

      // Auto logout after 3 seconds
      setTimeout(async () => {
        await logout();
        navigate('/login', { replace: true });
      }, 3000);

    } catch (err: any) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  return (
    <div className="coding-page">
      <header className="coding-page-header">
        <div>
          <h1>{t('coding.profile_title')}</h1>
          <p>{t('coding.profile_description')}</p>
        </div>
        <User size={28} className="coding-page-symbol" aria-hidden="true" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Card Showcase */}
        <div className="lg:col-span-1">
          <div className="p-8 rounded-sm bg-code-panel border-code-border text-center flex flex-col items-center border">
            <img
              src={user?.avatarUrl || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
              alt={user?.displayName}
              className="h-24 w-24 rounded-sm object-cover mb-6 border-4 border-code-accent"
            />
            <h2 className="text-xl font-medium text-code-text">{user?.displayName}</h2>
            <p className="text-sm text-code-muted mt-1">@{user?.username || 'user'}</p>

            <div className="w-full h-[1px] bg-code-elevated my-6"></div>

            <div className="w-full space-y-4 text-left">
              <div className="flex items-center space-x-3 text-sm text-code-muted">
                <Mail className="h-4.5 w-4.5 text-code-accent" />
                <span className="truncate">{user?.email}</span>
              </div>
              {user?.phoneNumber && (
                <div className="flex items-center space-x-3 text-sm text-code-muted">
                  <Phone className="h-4.5 w-4.5 text-code-accent" />
                  <span>{user?.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Forms Grid */}
        <div className="lg:col-span-2 space-y-8 min-w-0">
          {/* Edit Profile Form */}
          <div
            className="p-8 rounded-sm bg-code-panel border-code-border border "
          >
            <h3 className="text-lg font-medium text-code-text mb-6 flex items-center">
              <User className="h-5 w-5 mr-2 text-code-accent" />
              <span>Personal Information</span>
            </h3>

            {profileSuccess && (
              <div className="flex items-center space-x-2 p-4 mb-6 rounded-sm bg-code-success-surface border-code-success-border text-sm text-code-success border">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="flex items-center space-x-2 p-4 mb-6 rounded-sm bg-code-error-surface border-code-error-border text-sm text-code-error border">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex items-center space-x-4 mb-6">
                <img
                  src={avatarPreviewUrl || user?.avatarUrl || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
                  alt="Avatar Preview"
                  className="h-16 w-16 rounded-sm object-cover border-2 border-code-accent "
                />
                <div className="flex-grow min-w-0">
                  <label htmlFor="avatarFileInput" className="block text-xs font-semibold text-code-muted mb-1.5">
                    Profile Picture
                  </label>
                  <input
                    id="avatarFileInput"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="block w-full text-xs text-code-muted file:mr-4 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-code-accent-surface file:text-code-accent hover:file:bg-code-accent-surface file:cursor-pointer cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Display Name Input */}
                <div>
                  <label htmlFor="displayNameInput" className="block text-xs font-semibold text-code-muted mb-1.5">
                    Display Name
                  </label>
                  <div className="relative">
                    <input
                      id="displayNameInput"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className={`block w-full px-4 py-2.5 rounded-sm bg-code-bg/80 text-sm placeholder-code-muted focus:outline-none focus:ring-2 focus:ring-code-accent focus:border-code-accent border-code-border transition-all border ${
                        profileErrors.displayName ? 'border-code-error-border border' : 'border-code-border border'
                      }`}
                    />
                  </div>
                  {profileErrors.displayName && (
                    <p className="mt-1.5 text-xs text-code-error font-medium">{profileErrors.displayName}</p>
                  )}
                </div>

                {/* Phone Number Input */}
                <div>
                  <label htmlFor="phoneNumberInput" className="block text-xs font-semibold text-code-muted mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      id="phoneNumberInput"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={`block w-full px-4 py-2.5 rounded-sm bg-code-bg/80 text-sm placeholder-code-muted focus:outline-none focus:ring-2 focus:ring-code-accent focus:border-code-accent border-code-border transition-all border ${
                        profileErrors.phoneNumber ? 'border-code-error-border border' : 'border-code-border border'
                      }`}
                      placeholder="Not updated"
                    />
                  </div>
                  {profileErrors.phoneNumber && (
                    <p className="mt-1.5 text-xs text-code-error font-medium">{profileErrors.phoneNumber}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isProfileUpdating}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-5 border border-transparent text-sm font-semibold rounded-sm text-code-bg bg-code-accent hover:bg-code-accent-hover focus:outline-none transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isProfileUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div
            className="p-8 rounded-sm bg-code-panel border-code-border border "
          >
            <h3 className="text-lg font-medium text-code-text mb-6 flex items-center">
              <Lock className="h-5 w-5 mr-2 text-code-accent" />
              <span>Change Password</span>
            </h3>

            {passwordSuccess && (
              <div className="flex items-center space-x-2 p-4 mb-6 rounded-sm bg-code-success-surface border-code-success-border text-sm text-code-success border">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="flex items-center space-x-2 p-4 mb-6 rounded-sm bg-code-error-surface border-code-error-border text-sm text-code-error border">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {/* Old Password */}
              <div>
                <label htmlFor="oldPasswordInput" className="block text-xs font-semibold text-code-muted mb-1.5">
                  Old Password
                </label>
                <div className="relative">
                  <input
                    id="oldPasswordInput"
                    autoComplete="current-password"
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className={`block w-full pl-4 pr-11 py-2.5 rounded-sm bg-code-bg/80 text-sm placeholder-code-muted focus:outline-none focus:ring-2 focus:ring-code-accent focus:border-code-accent border-code-border transition-all border ${
                      passwordErrors.oldPassword ? 'border-code-error-border border' : 'border-code-border border'
                    }`}
                  />
                  <button
                    type="button"
                    aria-label={t(showOldPass ? 'coding.hide_password' : 'coding.show_password')}
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-code-muted hover:text-code-muted transition-colors"
                  >
                    {showOldPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {passwordErrors.oldPassword && (
                  <p className="mt-1.5 text-xs text-code-error font-medium">{passwordErrors.oldPassword}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* New Password */}
                <div>
                  <label htmlFor="newPasswordInput" className="block text-xs font-semibold text-code-muted mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPasswordInput"
                      autoComplete="new-password"
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`block w-full pl-4 pr-11 py-2.5 rounded-sm bg-code-bg/80 text-sm placeholder-code-muted focus:outline-none focus:ring-2 focus:ring-code-accent focus:border-code-accent border-code-border transition-all border ${
                        passwordErrors.newPassword ? 'border-code-error-border border' : 'border-code-border border'
                      }`}
                    />
                    <button
                      type="button"
                      aria-label={t(showNewPass ? 'coding.hide_password' : 'coding.show_password')}
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-code-muted hover:text-code-muted transition-colors"
                    >
                      {showNewPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1.5 text-xs text-code-error font-medium">{passwordErrors.newPassword}</p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label htmlFor="confirmNewPasswordInput" className="block text-xs font-semibold text-code-muted mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmNewPasswordInput"
                      autoComplete="new-password"
                      type={showConfirmNewPass ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className={`block w-full pl-4 pr-11 py-2.5 rounded-sm bg-code-bg/80 text-sm placeholder-code-muted focus:outline-none focus:ring-2 focus:ring-code-accent focus:border-code-accent border-code-border transition-all border ${
                        passwordErrors.confirmNewPassword ? 'border-code-error-border border' : 'border-code-border border'
                      }`}
                    />
                    <button
                      type="button"
                      aria-label={t(showConfirmNewPass ? 'coding.hide_password' : 'coding.show_password')}
                      onClick={() => setShowConfirmNewPass(!showConfirmNewPass)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-code-muted hover:text-code-muted transition-colors"
                    >
                      {showConfirmNewPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                  {passwordErrors.confirmNewPassword && (
                    <p className="mt-1.5 text-xs text-code-error font-medium">{passwordErrors.confirmNewPassword}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isPasswordUpdating}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-5 border border-transparent text-sm font-semibold rounded-sm text-code-bg bg-code-accent hover:bg-code-accent-hover focus:outline-none transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isPasswordUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
