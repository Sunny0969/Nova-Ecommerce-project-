import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/axios';
import { apiMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const profileSchema = yup.object({
  name: yup.string().trim().required('Name is required').max(120),
  email: yup.string().trim().email('Valid email required').required('Email is required'),
  phone: yup.string().trim().max(40).default('')
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Required'),
  newPassword: yup
    .string()
    .min(6, 'At least 6 characters')
    .required('Required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Required')
});

export default function Profile() {
  const { user, checkAuth, updateProfile } = useAuth();
  const fileRef = useRef(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [preview, setPreview] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: { name: '', email: '', phone: '' }
  });

  const pwForm = useForm({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user, reset]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const uploadAvatarFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    const fd = new FormData();
    fd.append('avatar', file);
    setAvatarBusy(true);
    try {
      const res = await authAPI.uploadAvatar(fd);
      const u = res.data?.user;
      if (u) updateProfile(u);
      await checkAuth();
      toast.success('Profile photo updated');
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      toast.error(apiMessage(err, 'Upload failed'));
    } finally {
      setAvatarBusy(false);
    }
  };

  const onProfileSubmit = async (values) => {
    try {
      const res = await authAPI.updateProfile(values);
      const u = res.data?.user;
      if (u) updateProfile(u);
      await checkAuth();
      toast.success('Profile saved');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save profile'));
    }
  };

  const onPasswordSubmit = async (values) => {
    try {
      await authAPI.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      toast.success('Password updated');
      pwForm.reset();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not update password'));
    }
  };

  const displaySrc = preview || user?.avatar;
  const letter = String(user?.name || user?.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="account-page account-profile">
      <h2 className="account-page__title">Profile</h2>

      <div className="account-profile__avatar-block card-like">
        <button
          type="button"
          className="account-profile__avatar-btn"
          onClick={() => fileRef.current?.click()}
          disabled={avatarBusy}
        >
          {displaySrc ? (
            <img
              src={displaySrc}
              alt=""
              className="account-profile__avatar-img"
              width={120}
              height={120}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="account-profile__avatar-letter">{letter}</span>
          )}
          <span className="account-profile__avatar-hint">
            {avatarBusy ? 'Uploading…' : 'Change photo'}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadAvatarFile(f);
          }}
        />
        <p className="account-profile__avatar-help">
          JPG or PNG, up to 2MB. Uses Cloudinary when configured on the server.
        </p>
      </div>

      <form className="account-form card-like" onSubmit={handleSubmit(onProfileSubmit)} noValidate>
        <h3 className="account-subheading">Personal details</h3>
        <div className="account-form__row">
          <label className="account-form__label" htmlFor="profile-name">
            Name
          </label>
          <input
            id="profile-name"
            className="account-form__input"
            {...register('name')}
            autoComplete="name"
          />
          {errors.name && (
            <p className="account-form__error" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>
        <div className="account-form__row">
          <label className="account-form__label" htmlFor="profile-email">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            className="account-form__input"
            {...register('email')}
            autoComplete="email"
          />
          {errors.email && (
            <p className="account-form__error" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>
        <div className="account-form__row">
          <label className="account-form__label" htmlFor="profile-phone">
            Phone
          </label>
          <input
            id="profile-phone"
            type="tel"
            className="account-form__input"
            {...register('phone')}
            autoComplete="tel"
          />
          {errors.phone && (
            <p className="account-form__error" role="alert">
              {errors.phone.message}
            </p>
          )}
        </div>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <form
        className="account-form card-like account-profile__password"
        onSubmit={pwForm.handleSubmit(onPasswordSubmit)}
        noValidate
      >
        <h3 className="account-subheading">Change password</h3>
        <div className="account-form__row">
          <label className="account-form__label" htmlFor="pw-current">
            Current password
          </label>
          <input
            id="pw-current"
            type="password"
            className="account-form__input"
            autoComplete="current-password"
            {...pwForm.register('currentPassword')}
          />
          {pwForm.formState.errors.currentPassword && (
            <p className="account-form__error" role="alert">
              {pwForm.formState.errors.currentPassword.message}
            </p>
          )}
        </div>
        <div className="account-form__row">
          <label className="account-form__label" htmlFor="pw-new">
            New password
          </label>
          <input
            id="pw-new"
            type="password"
            className="account-form__input"
            autoComplete="new-password"
            {...pwForm.register('newPassword')}
          />
          {pwForm.formState.errors.newPassword && (
            <p className="account-form__error" role="alert">
              {pwForm.formState.errors.newPassword.message}
            </p>
          )}
        </div>
        <div className="account-form__row">
          <label className="account-form__label" htmlFor="pw-confirm">
            Confirm new password
          </label>
          <input
            id="pw-confirm"
            type="password"
            className="account-form__input"
            autoComplete="new-password"
            {...pwForm.register('confirmPassword')}
          />
          {pwForm.formState.errors.confirmPassword && (
            <p className="account-form__error" role="alert">
              {pwForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
        <button type="submit" className="btn btn-outline" disabled={pwForm.formState.isSubmitting}>
          {pwForm.formState.isSubmitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
