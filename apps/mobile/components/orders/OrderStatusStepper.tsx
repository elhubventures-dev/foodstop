import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Theme } from '@/constants/Theme';

interface OrderStatusStepperProps {
  status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered';
}

const STEPS = [
  { key: 'pending', label: 'Placed', icon: 'checkmark.circle.fill' },
  { key: 'preparing', label: 'Preparing', icon: 'flame.fill' },
  { key: 'ready', label: 'Ready', icon: 'bag.fill' },
  { key: 'out_for_delivery', label: 'On Way', icon: 'truck.fill' },
  { key: 'delivered', label: 'Delivered', icon: 'house.fill' },
];

export const OrderStatusStepper = ({ status }: OrderStatusStepperProps) => {
  const currentStepIndex = STEPS.findIndex(s => s.key === status);

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isUpcoming = index > currentStepIndex;

        return (
          <View key={step.key} style={styles.stepContainer}>
            <View style={styles.iconWrapper}>
               <View style={[
                 styles.dot, 
                 isCompleted && styles.dotCompleted,
                 isCurrent && styles.dotCurrent,
                 isUpcoming && styles.dotUpcoming
               ]}>
                 <IconSymbol 
                   size={14} 
                   name={step.icon as any} 
                   color={isUpcoming ? '#ccc' : 'white'} 
                 />
               </View>
               {index < STEPS.length - 1 && (
                 <View style={[
                   styles.line,
                   isCompleted && styles.lineCompleted
                 ]} />
               )}
            </View>
            <Text style={[
              styles.label,
              isCurrent && styles.labelCurrent,
              isUpcoming && styles.labelUpcoming
            ]}>{step.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    width: '100%',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dotCompleted: {
    backgroundColor: Theme.colors.success,
  },
  dotCurrent: {
    backgroundColor: Theme.colors.primary,
  },
  dotUpcoming: {
    backgroundColor: '#f1f5f9',
  },
  line: {
    position: 'absolute',
    top: 14,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: '#e2e8f0',
    zIndex: 0,
  },
  lineCompleted: {
    backgroundColor: Theme.colors.success,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  labelCurrent: {
    color: Theme.colors.primary,
  },
  labelUpcoming: {
    color: '#9ca3af',
  }
});

