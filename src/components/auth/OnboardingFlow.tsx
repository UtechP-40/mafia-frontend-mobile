import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../ui/Button';
import { User } from '../../types/user';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  content?: React.ReactNode;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  user: User | null;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  user,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: `Welcome to Mobile Mafia, ${user?.username || 'Player'}!`,
      description: 'Get ready to experience the classic social deduction game in a whole new way.',
      icon: 'game-controller',
    },
    {
      id: 'gameplay',
      title: 'How to Play',
      description: 'Mafia is a game of deception and deduction. Work with your team to eliminate the opposing faction.',
      icon: 'people',
      content: (
        <View style={styles.gameplayContent}>
          <View style={styles.roleCard}>
            <Ionicons name="shield" size={32} color="#22c55e" />
            <Text style={styles.roleTitle}>Villagers</Text>
            <Text style={styles.roleDescription}>Find and eliminate the Mafia members</Text>
          </View>
          <View style={styles.roleCard}>
            <Ionicons name="skull" size={32} color="#ef4444" />
            <Text style={styles.roleTitle}>Mafia</Text>
            <Text style={styles.roleDescription}>Eliminate villagers without being caught</Text>
          </View>
        </View>
      ),
    },
    {
      id: 'features',
      title: 'Amazing Features',
      description: 'Discover what makes Mobile Mafia special.',
      icon: 'star',
      content: (
        <View style={styles.featuresContent}>
          <View style={styles.featureItem}>
            <Ionicons name="mic" size={24} color="#6366f1" />
            <Text style={styles.featureText}>Voice Chat</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={24} color="#6366f1" />
            <Text style={styles.featureText}>Real-time Multiplayer</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="trophy" size={24} color="#6366f1" />
            <Text style={styles.featureText}>Rankings & Stats</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="sparkles" size={24} color="#6366f1" />
            <Text style={styles.featureText}>AI Assistance</Text>
          </View>
        </View>
      ),
    },
    {
      id: 'ready',
      title: 'You\'re All Set!',
      description: 'Ready to join your first game? Let\'s get started!',
      icon: 'checkmark-circle',
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      scrollViewRef.current?.scrollTo({
        x: newStep * screenWidth,
        animated: true,
      });
      
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: (newStep + 1) / steps.length,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      scrollViewRef.current?.scrollTo({
        x: newStep * screenWidth,
        animated: true,
      });
      
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: (newStep + 1) / steps.length,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const skipOnboarding = () => {
    onComplete();
  };

  React.useEffect(() => {
    // Initialize progress bar
    Animated.timing(progressAnim, {
      toValue: 1 / steps.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {steps.length}
          </Text>
        </View>
        
        <TouchableOpacity onPress={skipOnboarding} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scrollView}
      >
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepContainer}>
            <View style={styles.stepContent}>
              <View style={styles.iconContainer}>
                <Ionicons name={step.icon as any} size={80} color="#6366f1" />
              </View>
              
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
              
              {step.content && (
                <View style={styles.customContent}>
                  {step.content}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity onPress={prevStep} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#6366f1" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.nextButtonContainer}>
            <Button
              title={currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              onPress={nextStep}
              style={styles.nextButton}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progressContainer: {
    flex: 1,
    marginRight: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  progressText: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    width: screenWidth,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stepContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  stepDescription: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  customContent: {
    width: '100%',
  },
  gameplayContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  roleCard: {
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 16,
    flex: 0.45,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresContent: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 16,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 16,
    marginLeft: 8,
  },
  nextButtonContainer: {
    flex: 1,
    marginLeft: 16,
  },
  nextButton: {
    width: '100%',
  },
});