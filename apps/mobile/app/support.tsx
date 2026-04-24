import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/Theme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';

export default function SupportScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setupChat();
  }, []);

  const setupChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Initial fetch
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);

    // Subscription
    const channel = supabase
      .channel('support-chat')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setMessages((current) => [...current, payload.new]);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !userId) return;

    const newMessage = {
      user_id: userId,
      sender_role: 'customer',
      content: inputText.trim(),
    };

    const { error } = await supabase
      .from('support_messages')
      .insert(newMessage);

    if (!error) {
      setInputText('');
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_role === 'customer';
    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
        {!isMe && (
          <View style={styles.supportAvatar}>
            <IconSymbol size={16} name="headphones" color="white" />
          </View>
        )}
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
          <ThemedText style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
            {item.content}
          </ThemedText>
          <ThemedText style={styles.timestamp}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol size={24} name="chevron.left" color={Theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
           <ThemedText type="subtitle">Live Support</ThemedText>
           <View style={styles.onlineIndicator}>
              <View style={styles.dot} />
              <ThemedText style={styles.onlineText}>Typically replies in 5m</ThemedText>
           </View>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]} 
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <IconSymbol size={20} name="paperplane.fill" color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerInfo: {
    alignItems: 'center',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.success,
  },
  onlineText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  backButton: {
    padding: 8,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  myMessageRow: {
    alignSelf: 'flex-end',
  },
  otherMessageRow: {
    alignSelf: 'flex-start',
  },
  supportAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: Theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: Theme.colors.text,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
    opacity: 0.6,
    color: 'inherit',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: Theme.colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
