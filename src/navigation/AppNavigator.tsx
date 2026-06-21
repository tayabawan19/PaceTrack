import { useEffect } from 'react';
import { CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useOnboarding } from '@/context/OnboardingContext';
import {
  HomeScreen,
  LoginScreen,
  OnboardingAgeGenderScreen,
  OnboardingHeightWeightScreen,
  OnboardingUnitsScreen,
  OnboardingFitnessLevelScreen,
  OnboardingGoalScreen,
  OnboardingNameScreen,
  OnboardingEmergencyContactScreen,
  OtpVerificationScreen,
  SignupScreen,
  WelcomeScreen,
  TrackRunScreen,
  RunSummaryScreen,
  ProfileScreen,
  PlanRouteScreen,
  AchievementsScreen,
} from '@/screens';
import type { RootStackParamList, RootStackScreenProps } from './types';
import {
  requestNotificationPermissions,
  scheduleStreakReminder,
  scheduleInactivityReminder,
} from '@/utils/notifications';

const Stack = createNativeStackNavigator<RootStackParamList>();

function WelcomeRoute({ navigation }: RootStackScreenProps<'Welcome'>) {
  return (
    <WelcomeScreen
      onSignUpPress={() => navigation.navigate('Signup')}
      onLogInPress={() => navigation.navigate('Login')}
    />
  );
}

function SignupRoute({ navigation }: RootStackScreenProps<'Signup'>) {
  const { signUp, setPendingEmail } = useAuth();

  return (
    <SignupScreen
      onBackPress={() => navigation.goBack()}
      onSignUpPress={async (email, password) => {
        try {
          await signUp(email, password);
          setPendingEmail(email);
          Alert.alert(
            'Verification Code Sent',
            `A 6-digit verification code was sent to ${email}. Please check your email to complete your registration.`,
          );
          navigation.navigate('OtpVerification', { email, flow: 'signup' });
        } catch (error: any) {
          Alert.alert('Signup Failed', error.message || 'An error occurred during signup.');
        }
      }}
      onLogInPress={() => navigation.replace('Login')}
    />
  );
}

function LoginRoute({ navigation }: RootStackScreenProps<'Login'>) {
  const { logIn, resendOtp, setPendingEmail } = useAuth();

  return (
    <LoginScreen
      onBackPress={() => navigation.goBack()}
      onLogInPress={async (email, password) => {
        try {
          const success = await logIn(email, password);
          
          if (!success) {
            // User is registered but not verified yet. Send a new OTP and redirect to verification.
            try {
              await resendOtp(email);
              Alert.alert(
                'Verify Your Account',
                `Please verify your email. A verification code has been resent to ${email}.`,
              );
            } catch (resendError: any) {
              console.error('[AppNavigator] Failed to auto-resend OTP:', resendError.message);
            }
            setPendingEmail(email);
            navigation.navigate('OtpVerification', { email, flow: 'signup' });
            return;
          }

          // User successfully logged in (and was already onboarded)
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            }),
          );
        } catch (error: any) {
          Alert.alert('Login Failed', error.message || 'Invalid email or password.');
        }
      }}
      onSignUpPress={() => navigation.replace('Signup')}
    />
  );
}

function OtpVerificationRoute({
  navigation,
  route,
}: RootStackScreenProps<'OtpVerification'>) {
  const { email, flow } = route.params;
  const { verifyOtp, resendOtp } = useAuth();

  return (
    <OtpVerificationScreen
      email={email}
      onBackPress={() => navigation.goBack()}
      onVerifyPress={async (code) => {
        if (code.length !== 6) {
          return;
        }

        try {
          const isOnboarded = await verifyOtp(email, code);

          if (isOnboarded) {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              }),
            );
          } else {
            // User needs to perform profile onboarding
            navigation.replace('OnboardingName');
          }
        } catch (error: any) {
          Alert.alert('Verification Error', error.message || 'Invalid verification code.');
        }
      }}
      onResendPress={async () => {
        try {
          await resendOtp(email);
          Alert.alert(
            'New Code Sent',
            `A new 6-digit verification code was sent to ${email}.`,
          );
        } catch (error: any) {
          Alert.alert('Failed to Resend', error.message || 'Could not resend code.');
        }
      }}
    />
  );
}

function OnboardingNameRoute({
  navigation,
}: RootStackScreenProps<'OnboardingName'>) {
  const { data, updateData } = useOnboarding();

  return (
    <OnboardingNameScreen
      initialName={data.name}
      onContinuePress={(name) => {
        updateData({ name });
        navigation.navigate('OnboardingAgeGender');
      }}
    />
  );
}

function OnboardingAgeGenderRoute({
  navigation,
}: RootStackScreenProps<'OnboardingAgeGender'>) {
  const { data, updateData } = useOnboarding();

  return (
    <OnboardingAgeGenderScreen
      initialAge={data.age}
      initialGender={data.gender}
      onContinuePress={(age, gender) => {
        updateData({ age, gender });
        navigation.navigate('OnboardingHeightWeight');
      }}
    />
  );
}

function OnboardingHeightWeightRoute({
  navigation,
}: RootStackScreenProps<'OnboardingHeightWeight'>) {
  const { data, updateData } = useOnboarding();

  return (
    <OnboardingHeightWeightScreen
      initialHeight={data.height}
      initialWeight={data.weight}
      onContinuePress={(height, weight) => {
        updateData({ height, weight });
        navigation.navigate('OnboardingUnits');
      }}
    />
  );
}

function OnboardingUnitsRoute({
  navigation,
}: RootStackScreenProps<'OnboardingUnits'>) {
  const { data, updateData } = useOnboarding();

  return (
    <OnboardingUnitsScreen
      initialUnits={data.units}
      onContinuePress={(units) => {
        updateData({ units });
        navigation.navigate('OnboardingFitnessLevel');
      }}
    />
  );
}

function OnboardingFitnessLevelRoute({
  navigation,
}: RootStackScreenProps<'OnboardingFitnessLevel'>) {
  const { data, updateData } = useOnboarding();

  return (
    <OnboardingFitnessLevelScreen
      initialLevel={data.fitnessLevel}
      onContinuePress={(fitnessLevel) => {
        updateData({ fitnessLevel });
        navigation.navigate('OnboardingGoal');
      }}
    />
  );
}

function OnboardingGoalRoute({
  navigation,
}: RootStackScreenProps<'OnboardingGoal'>) {
  const { data, updateData } = useOnboarding();

  return (
    <OnboardingGoalScreen
      initialGoal={data.goal}
      onContinuePress={(goal) => {
        updateData({ goal });
        navigation.navigate('OnboardingEmergencyContact');
      }}
    />
  );
}

function OnboardingEmergencyContactRoute({
  navigation,
}: RootStackScreenProps<'OnboardingEmergencyContact'>) {
  const { data, updateData, resetData } = useOnboarding();
  const { completeOnboarding } = useAuth();

  const handleFinish = async (contactName: string, contactPhone: string) => {
    const finalData = {
      ...data,
      emergencyContactName: contactName,
      emergencyContactPhone: contactPhone,
    };
    updateData({
      emergencyContactName: contactName,
      emergencyContactPhone: contactPhone,
    });
    
    try {
      await completeOnboarding(finalData);
      resetData();
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        }),
      );
    } catch (error: any) {
      Alert.alert(
        'Save Profile Failed',
        error.message || 'Could not save profile details to the backend.'
      );
    }
  };

  return (
    <OnboardingEmergencyContactScreen
      initialName={data.emergencyContactName}
      initialPhone={data.emergencyContactPhone}
      onFinishPress={handleFinish}
      onSkipPress={() => handleFinish('', '')}
    />
  );
}

function HomeRoute({ navigation }: RootStackScreenProps<'Home'>) {
  const { user } = useAuth();

  return (
    <HomeScreen
      userName={user?.name ?? 'Runner'}
      onStartRunPress={() => navigation.navigate('PlanRoute')}
    />
  );
}

function PlanRouteRoute({ navigation }: RootStackScreenProps<'PlanRoute'>) {
  return (
    <PlanRouteScreen
      onBackPress={() => navigation.goBack()}
    />
  );
}

function TrackRunRoute({ navigation, route }: RootStackScreenProps<'TrackRun'>) {
  return (
    <TrackRunScreen
      onBackPress={() => navigation.goBack()}
      onFinishRun={(runData) => {
        navigation.navigate('RunSummary', { runData });
      }}
      plannedRoute={route.params?.plannedRoute}
      plannedDistanceKm={route.params?.plannedDistanceKm}
    />
  );
}

function RunSummaryRoute({ navigation, route }: RootStackScreenProps<'RunSummary'>) {
  const { runData, isReadOnly } = route.params;

  const handleFinish = () => {
    if (isReadOnly) {
      navigation.goBack();
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        }),
      );
    }
  };

  return (
    <RunSummaryScreen
      runData={runData}
      isReadOnly={isReadOnly}
      onSaveSuccess={handleFinish}
      onDiscardPress={handleFinish}
    />
  );
}

function ProfileRoute({ navigation }: RootStackScreenProps<'Profile'>) {
  return (
    <ProfileScreen
      onBackPress={() => navigation.goBack()}
    />
  );
}

function AchievementsRoute({ navigation }: RootStackScreenProps<'Achievements'>) {
  return (
    <AchievementsScreen
      onBackPress={() => navigation.goBack()}
    />
  );
}

export function AppNavigator() {
  const { user, token } = useAuth();
  const initialRoute = user?.isOnboarded ? 'Home' : 'Welcome';

  useEffect(() => {
    if (token) {
      (async () => {
        const granted = await requestNotificationPermissions();
        if (granted) {
          await scheduleStreakReminder();
          await scheduleInactivityReminder(token);
        }
      })();
    }
  }, [token]);

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Welcome" component={WelcomeRoute} />
      <Stack.Screen name="Signup" component={SignupRoute} />
      <Stack.Screen name="Login" component={LoginRoute} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationRoute} />
      <Stack.Screen name="OnboardingName" component={OnboardingNameRoute} />
      <Stack.Screen
        name="OnboardingAgeGender"
        component={OnboardingAgeGenderRoute}
      />
      <Stack.Screen
        name="OnboardingHeightWeight"
        component={OnboardingHeightWeightRoute}
      />
      <Stack.Screen
        name="OnboardingUnits"
        component={OnboardingUnitsRoute}
      />
      <Stack.Screen
        name="OnboardingFitnessLevel"
        component={OnboardingFitnessLevelRoute}
      />
      <Stack.Screen name="OnboardingGoal" component={OnboardingGoalRoute} />
      <Stack.Screen
        name="OnboardingEmergencyContact"
        component={OnboardingEmergencyContactRoute}
      />
      <Stack.Screen name="Home" component={HomeRoute} />
      <Stack.Screen name="PlanRoute" component={PlanRouteRoute} />
      <Stack.Screen name="TrackRun" component={TrackRunRoute} />
      <Stack.Screen name="RunSummary" component={RunSummaryRoute} />
      <Stack.Screen name="Profile" component={ProfileRoute} />
      <Stack.Screen name="Achievements" component={AchievementsRoute} />
    </Stack.Navigator>
  );
}
