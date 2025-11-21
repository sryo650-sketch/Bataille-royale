import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'hasCompletedOnboarding';
const USER_DATA_KEY = 'userData';

export interface UserData {
  username: string;
  email: string;
  avatar?: string;
  countryCode: string;
  createdAt: string;
}

export const checkOnboardingStatus = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

export const getUserData = async (): Promise<UserData | null> => {
  try {
    const data = await AsyncStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const updateUserData = async (updates: Partial<UserData>): Promise<void> => {
  try {
    const currentData = await getUserData();
    if (currentData) {
      const newData = { ...currentData, ...updates };
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(newData));
    }
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};

export const resetOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    await AsyncStorage.removeItem(USER_DATA_KEY);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    throw error;
  }
};
