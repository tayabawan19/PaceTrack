import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RunSummaryData } from '@/screens';

export type AuthFlow = 'signup' | 'login';

export type RootStackParamList = {
  Welcome: undefined;
  Signup: undefined;
  Login: undefined;
  OtpVerification: { email: string; flow: AuthFlow };
  OnboardingName: undefined;
  OnboardingAgeGender: undefined;
  OnboardingHeightWeight: undefined;
  OnboardingUnits: undefined;
  OnboardingFitnessLevel: undefined;
  OnboardingGoal: undefined;
  OnboardingEmergencyContact: undefined;
  Home: undefined;
  PlanRoute: undefined;
  TrackRun: { plannedRoute?: { latitude: number; longitude: number }[]; plannedDistanceKm?: number } | undefined;
  RunSummary: { runData: RunSummaryData; isReadOnly?: boolean };
  Profile: undefined;
  Achievements: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
