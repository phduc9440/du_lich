import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function ExploreScreen() {
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <MaterialIcons name="explore" size={80} color={primaryColor} style={styles.icon} />
        <ThemedText type="title">Explore</ThemedText>
        <ThemedText style={styles.description}>
          Discover new places and hidden gems around the world.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  icon: {
    marginBottom: Spacing.l,
  },
  description: {
    textAlign: 'center',
    marginTop: Spacing.m,
    opacity: 0.7,
  },
});
