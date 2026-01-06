import { useForm } from 'react-hook-form';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import useAuth from '../../hooks/useAuth.js';

export default function LoginForm() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      identifier: '',
      password: '',
      remember: false,
    },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      await login({
        email: values.identifier.includes('@') ? values.identifier : undefined,
        username: !values.identifier.includes('@')
          ? values.identifier
          : undefined,
        password: values.password,
      });
      toast.success('Logged in successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email or Username"
        placeholder="you@example.com"
        {...register('identifier', { required: 'Email or username is required' })}
        error={errors.identifier?.message}
      />

      <Input
        label="Password"
        type="password"
        {...register('password', { required: 'Password is required' })}
        error={errors.password?.message}
      />

      <div className="flex items-center justify-between text-sm">
        <label className="inline-flex items-center space-x-2 text-textSecondary">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-700 bg-surface text-primary focus:ring-primary"
            {...register('remember')}
          />
          <span>Remember me</span>
        </label>
      </div>

      <Button type="submit" className="w-full" isLoading={loading}>
        Sign in
      </Button>
    </form>
  );
}


