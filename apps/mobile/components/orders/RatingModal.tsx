import React, { useState } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Theme } from '@/constants/Theme';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';

interface RatingModalProps {
  isVisible: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

export function RatingModal({ isVisible, onClose, orderId, onSuccess }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a star rating.');
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update the order with the rider rating
    const { error } = await supabase
      .from('orders')
      .update({ 
        rider_rating: rating,
        rider_review: comment,
        updated_at: new Date() 
      })
      .eq('id', orderId);

    if (!error) {
      Alert.alert('Success', 'Thank you for your feedback!');
      onSuccess();
      onClose();
    } else {
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Rate Your Delivery</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol name="xmark" size={24} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.description}>How was your experience with the rider for order #{orderId.slice(0, 8)}?</ThemedText>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setRating(s)}>
                <IconSymbol 
                  name={s <= rating ? 'star.fill' : 'star'} 
                  size={40} 
                  color={s <= rating ? '#f59e0b' : '#cbd5e1'} 
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Add a comment (optional)"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            value={comment}
            onChangeText={setComment}
          />

          <TouchableOpacity 
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            <ThemedText style={styles.submitBtnText}>
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 15,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: Theme.colors.text,
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 24,
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  submitBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});


