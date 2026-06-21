import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type {
  FitnessGoal,
  FitnessLevel,
  Gender,
  OnboardingData,
  PreferredUnits,
} from './OnboardingContext';
import { API_URL } from '@/config';

export type UserProfile = {
  email: string;
  isOnboarded: boolean;
} & Partial<OnboardingData>;

type AuthContextValue = {
  user: UserProfile | null;
  token: string | null;
  pendingEmail: string | null;
  setPendingEmail: (email: string | null) => void;
  signUp: (email: string, password: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<boolean>; // Returns true if verified (logged in), false if needs verification
  verifyOtp: (email: string, otp: string) => Promise<boolean>; // Returns true if onboarded, false if needs onboarding
  resendOtp: (email: string) => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // Helper to map backend user data format to frontend UserProfile model
  const mapBackendUser = useCallback((backendUser: any): UserProfile => {
    const profile = backendUser.profile || {};
    const isOnboarded = !!(profile.name && profile.name.trim().length > 0);
    
    return {
      email: backendUser.email,
      isOnboarded,
      name: profile.name || '',
      age: profile.age !== undefined ? profile.age.toString() : '',
      gender: (profile.gender as Gender) || null,
      height: profile.height !== undefined ? profile.height.toString() : '',
      weight: profile.weight !== undefined ? profile.weight.toString() : '',
      units: (profile.units as PreferredUnits) || 'metric',
      fitnessLevel: (profile.fitnessLevel as FitnessLevel) || null,
      goal: (profile.goal as FitnessGoal) || null,
      emergencyContactName: profile.emergencyContactName || '',
      emergencyContactPhone: profile.emergencyContactPhone || '',
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }
  }, []);

  const logIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      // If the backend specifically indicates unverified status, return false to trigger OTP screen
      if (response.status === 400 && data.error && data.error.includes('verify')) {
        return false;
      }
      throw new Error(data.error || 'Login failed');
    }

    setToken(data.token);
    setUser(mapBackendUser(data.user));
    setPendingEmail(null);
    return true;
  }, [mapBackendUser]);

  const verifyOtp = useCallback(async (email: string, otp: string): Promise<boolean> => {
    const response = await fetch(`${API_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'OTP verification failed');
    }

    setToken(data.token);
    const mappedUser = mapBackendUser(data.user);
    setUser(mappedUser);
    setPendingEmail(null);
    return mappedUser.isOnboarded;
  }, [mapBackendUser]);

  const resendOtp = useCallback(async (email: string) => {
    const response = await fetch(`${API_URL}/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to resend verification code');
    }
  }, []);

  const completeOnboarding = useCallback(async (onboardingData: OnboardingData) => {
    if (!token) {
      throw new Error('No authorization token available');
    }

    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: onboardingData.name,
        age: onboardingData.age ? parseInt(onboardingData.age, 10) : undefined,
        gender: onboardingData.gender,
        height: onboardingData.height ? parseFloat(onboardingData.height) : undefined,
        weight: onboardingData.weight ? parseFloat(onboardingData.weight) : undefined,
        units: onboardingData.units,
        fitnessLevel: onboardingData.fitnessLevel,
        goal: onboardingData.goal,
        emergencyContactName: onboardingData.emergencyContactName,
        emergencyContactPhone: onboardingData.emergencyContactPhone,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save onboarding data');
    }

    setUser(mapBackendUser(data));
  }, [token, mapBackendUser]);

  const signOut = useCallback(() => {
    setUser(null);
    setToken(null);
    setPendingEmail(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      pendingEmail,
      setPendingEmail,
      signUp,
      logIn,
      verifyOtp,
      resendOtp,
      completeOnboarding,
      signOut,
    }),
    [
      user,
      token,
      pendingEmail,
      signUp,
      logIn,
      verifyOtp,
      resendOtp,
      completeOnboarding,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export type { FitnessGoal, FitnessLevel, Gender };
