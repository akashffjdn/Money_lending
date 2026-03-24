import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  onStepPress?: (stepIndex: number) => void;
}

interface ConnectorProps {
  completed: boolean;
  active: boolean;
  colors: {
    primary: string;
    border: string;
    success: string;
  };
}

const Connector: React.FC<ConnectorProps> = ({ completed, active, colors }) => {
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    if (completed) {
      fillWidth.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    } else if (active) {
      fillWidth.value = withTiming(0.5, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      fillWidth.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [completed, active]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value * 100}%` as any,
  }));

  const fillColor = completed ? colors.success : colors.primary;

  return (
    <View style={[styles.connector, { backgroundColor: colors.border }]}>
      <Animated.View
        style={[
          styles.connectorFill,
          { backgroundColor: fillColor },
          fillStyle,
        ]}
      />
    </View>
  );
};

const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  onStepPress,
}) => {
  const { colors } = useTheme();

  const handleStepPress = (index: number) => {
    if (index < currentStep && onStepPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onStepPress(index);
    }
  };

  const renderStep = (label: string, index: number) => {
    const isCompleted = index < currentStep;
    const isActive = index === currentStep;
    const isUpcoming = index > currentStep;

    return (
      <React.Fragment key={index}>
        {index > 0 && (
          <Connector
            completed={isCompleted}
            active={isActive}
            colors={{
              primary: colors.primary,
              border: colors.border,
              success: '#10B981',
            }}
          />
        )}
        <Pressable
          onPress={() => handleStepPress(index)}
          disabled={!isCompleted}
          style={styles.stepContainer}
        >
          <View
            style={[
              styles.circle,
              isCompleted && styles.completedCircle,
              isActive && [styles.activeCircle, { backgroundColor: colors.primary }],
              isUpcoming && [styles.upcomingCircle, { borderColor: colors.border }],
            ]}
          >
            {isCompleted ? (
              <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.stepNumber,
                  isActive && styles.activeStepNumber,
                  isUpcoming && { color: colors.textMuted },
                ]}
              >
                {index + 1}
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.stepLabel,
              { color: isUpcoming ? colors.textMuted : colors.text },
              isActive && { color: colors.primary, fontWeight: '600' },
            ]}
            numberOfLines={2}
          >
            {label}
          </Text>
        </Pressable>
      </React.Fragment>
    );
  };

  return (
    <View style={styles.container}>
      {steps.map((label, index) => renderStep(label, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  stepContainer: {
    alignItems: 'center',
    maxWidth: 60,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCircle: {
    backgroundColor: '#10B981',
  },
  activeCircle: {
    backgroundColor: '#F59E0B',
  },
  upcomingCircle: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeStepNumber: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 60,
  },
  connector: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    marginHorizontal: 4,
    marginBottom: 18,
    overflow: 'hidden',
  },
  connectorFill: {
    height: '100%',
    borderRadius: 1,
  },
});

export default StepIndicator;
