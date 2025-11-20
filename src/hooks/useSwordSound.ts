import { useEffect, useRef } from 'react';
import { Audio, AVPlaybackStatusSuccess } from 'expo-av';

export const useSwordSound = () => {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/sword-clash.wav')
        );
        if (isMounted) {
          soundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch (error) {
        console.warn('Failed to load sword sound', error);
      }
    })();

    return () => {
      isMounted = false;
      soundRef.current?.unloadAsync().catch(() => undefined);
    };
  }, []);

  return async () => {
    try {
      const sound = soundRef.current;
      if (!sound) return;
      const status = (await sound.getStatusAsync()) as AVPlaybackStatusSuccess;
      if (status.isLoaded) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
    } catch (error) {
      console.warn('Failed to play sword sound', error);
    }
  };
};
