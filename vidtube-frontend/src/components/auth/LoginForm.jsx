import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import useAuth from '../../hooks/useAuth.js';
import { loginResolver } from '../../validators/auth.validator.js';
import { handleApiError, handleApiSuccess } from '../../utils/apiErrorHandler.js';

export default function LoginForm() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: loginResolver,
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
      handleApiSuccess('Logged in successfully');
      navigate(from, { replace: true });
    } catch (error) {
      handleApiError(error, { defaultMessage: 'Failed to login. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
      
      <div className="mt-6 text-center text-sm text-textSecondary">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </>
  );
}


