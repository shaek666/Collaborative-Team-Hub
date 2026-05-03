import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../app/(auth)/login/page';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

jest.mock('../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/link', () => {
  const React = require('react');

  return {
    __esModule: true,
    default: ({ href, children, ...props }) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

jest.mock('react-hot-toast', () => {
  const toast = jest.fn();
  toast.success = jest.fn();
  toast.error = jest.fn();
  return {
    __esModule: true,
    default: toast,
  };
}, { virtual: true });

jest.mock('framer-motion', () => {
  const React = require('react');

  return {
    motion: {
      div: ({ children, initial, animate, transition, ...props }) => (
        <div {...props}>{children}</div>
      ),
    },
  };
}, { virtual: true });

describe('Login form', () => {
  const mockLogin = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.mockImplementation((selector) => selector({ login: mockLogin }));
    useRouter.mockReturnValue({ push: mockPush });
  });

  it('renders email and password fields', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows validation error if submitted empty', async () => {
    const user = userEvent.setup();

    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Email and password are required.');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls authStore.login on valid submit', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ id: 'user-1' });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'teammate@example.com');
    await user.type(screen.getByLabelText(/password/i), 'correct-password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('teammate@example.com', 'correct-password');
    });
    expect(toast.success).toHaveBeenCalledWith('Welcome back!');
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows error toast on wrong credentials', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce({
      response: {
        data: { error: 'Invalid credentials' },
      },
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'bad-password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
