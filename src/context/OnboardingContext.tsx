import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Gender = 'male' | 'female' | 'other';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type FitnessGoal =
  | 'lose_weight'
  | 'build_endurance'
  | 'train_race'
  | 'stay_active';
export type PreferredUnits = 'metric' | 'imperial';

export type OnboardingData = {
  name: string;
  age: string;
  gender: Gender | null;
  height: string;
  weight: string;
  units: PreferredUnits;
  fitnessLevel: FitnessLevel | null;
  goal: FitnessGoal | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

type OnboardingContextValue = {
  data: OnboardingData;
  updateData: (patch: Partial<OnboardingData>) => void;
  resetData: () => void;
};

const initialData: OnboardingData = {
  name: '',
  age: '',
  gender: null,
  height: '',
  weight: '',
  units: 'metric',
  fitnessLevel: null,
  goal: null,
  emergencyContactName: '',
  emergencyContactPhone: '',
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(initialData);

  const updateData = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetData = useCallback(() => {
    setData(initialData);
  }, []);

  const value = useMemo(
    () => ({ data, updateData, resetData }),
    [data, updateData, resetData],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
