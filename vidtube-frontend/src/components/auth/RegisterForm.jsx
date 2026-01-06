import { useForm } from 'react-hook-form';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import useAuth from '../../hooks/useAuth.js';

export default function RegisterForm() {
  const { register: registerUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      password: '',
      terms: false,
    },
  });

  const onSubmit = async (values) => {
    if (!values.terms) {
      toast.error('You must accept the terms and conditions');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('fullName', values.fullName);
      formData.append('username', values.username);
      formData.append('email', values.email);
      formData.append('password', values.password);
      if (values.avatar?.[0]) {
        formData.append('avatar', values.avatar[0]);
      }
      if (values.coverImage?.[0]) {
        formData.append('coverImage', values.coverImage[0]);
      }

      await registerUser(formData);
      toast.success('Registered successfully. You can now login.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const avatarFile = watch('avatar');
  const coverFile = watch('coverImage');

  // Simple previews
  if (avatarFile && avatarFile[0] && !avatarPreview) {
    const url = URL.createObjectURL(avatarFile[0]);
    setAvatarPreview(url);
  }
  if (coverFile && coverFile[0] && !coverPreview) {
    const url = URL.createObjectURL(coverFile[0]);
    setCoverPreview(url);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Full name"
        {...register('fullName', { required: 'Full name is required' })}
        error={errors.fullName?.message}
      />

      <Input
        label="Username"
        {...register('username', { required: 'Username is required' })}
        error={errors.username?.message}
      />

      <Input
        label="Email"
        type="email"
        {...register('email', {
          required: 'Email is required',
          pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
        })}
        error={errors.email?.message}
      />

      <Input
        label="Password"
        type="password"
        {...register('password', {
          required: 'Password is required',
          minLength: { value: 6, message: 'At least 6 characters' },
        })}
        error={errors.password?.message}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-textSecondary mb-1">
            Avatar
          </label>
          <input
            type="file"
            accept="image/*"
            {...register('avatar')}
            className="block w-full text-sm text-textSecondary file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-zinc-700"
          />
          {avatarPreview && (
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="mt-2 h-16 w-16 rounded-full object-cover"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-textSecondary mb-1">
            Cover image
          </label>
          <input
            type="file"
            accept="image/*"
            {...register('coverImage')}
            className="block w-full text-sm text-textSecondary file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-zinc-700"
          />
          {coverPreview && (
            <img
              src={coverPreview}
              alt="Cover preview"
              className="mt-2 h-16 w-full rounded-md object-cover"
            />
          )}
        </div>
      </div>

      <label className="flex items-start space-x-2 text-sm text-textSecondary">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-zinc-700 bg-surface text-primary focus:ring-primary"
          {...register('terms')}
        />
        <span>
          I agree to the{' '}
          <span className="text-primary underline">terms and conditions</span>.
        </span>
      </label>

      <Button type="submit" className="w-full" isLoading={loading}>
        Create account
      </Button>
    </form>
  );
}


