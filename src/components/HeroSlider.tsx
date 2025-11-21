import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useThemeColor } from '../contexts/ThemeContext';
import { ThemeColors } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_HEIGHT = 200;

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image: any; // Using require() for local images or uri object
  action?: () => void;
  cta?: string;
}

interface HeroSliderProps {
  slides: Slide[];
  autoScrollInterval?: number;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  slides,
  autoScrollInterval = 5000,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const colors = useThemeColor();
  const styles = createStyles(colors);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % slides.length;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * (SCREEN_WIDTH - 32), // 32 is paddingHorizontal * 2
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [activeIndex, slides.length, autoScrollInterval]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== activeIndex) {
      setActiveIndex(roundIndex);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH - 32}
      >
        {slides.map((slide) => (
          <TouchableOpacity
            key={slide.id}
            activeOpacity={0.9}
            onPress={slide.action}
            style={styles.slideWrapper}
          >
            <View style={styles.slideContainer}>
              <ImageBackground
                source={slide.image}
                style={styles.imageBackground}
                imageStyle={styles.imageStyle}
              >
                <View style={styles.overlay}>
                  <View style={styles.textContainer}>
                    <Text style={styles.title}>{slide.title}</Text>
                    <Text style={styles.subtitle}>{slide.subtitle}</Text>
                    {slide.cta && (
                      <View style={styles.ctaButton}>
                        <Text style={styles.ctaText}>{slide.cta}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </ImageBackground>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeIndex && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    scrollContent: {
      paddingHorizontal: 0, // Handled by snapToInterval logic if needed, but here we want full width cards usually or padded
    },
    slideWrapper: {
      width: SCREEN_WIDTH - 32, // Full width minus padding
      height: SLIDE_HEIGHT,
      marginRight: 16, // Gap between slides if we want to see next one, but for pagingEnabled usually 0. 
      // Let's adjust: We want a carousel look.
    },
    slideContainer: {
      flex: 1,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: colors.surfaceAlt,
    },
    imageBackground: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    imageStyle: {
      borderRadius: 20,
      opacity: 0.8,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'flex-end',
      padding: 20,
    },
    textContainer: {
      gap: 4,
    },
    title: {
      color: '#FFFFFF',
      fontSize: 24,
      fontWeight: '800',
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
    },
    subtitle: {
      color: '#E2E8F0',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    ctaButton: {
      backgroundColor: colors.gold,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    ctaText: {
      color: colors.black,
      fontWeight: '700',
      fontSize: 12,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 12,
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surfaceAlt,
    },
    activeDot: {
      backgroundColor: colors.gold,
      width: 24,
    },
  });
