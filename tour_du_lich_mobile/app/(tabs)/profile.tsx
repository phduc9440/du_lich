import React from 'react';
import { StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function ProfileScreen() {
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');

  const MenuItem = ({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) => (
    <TouchableOpacity style={[styles.menuItem, { backgroundColor: cardBg }]}>
      <MaterialIcons name={icon as any} size={24} color={primaryColor} />
      <ThemedView style={styles.menuText} backgroundColorName="card">
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        {subtitle && <ThemedText type="caption">{subtitle}</ThemedText>}
      </ThemedView>
      <MaterialIcons name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView style={styles.header}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' }} 
            style={styles.avatar} 
          />
          <ThemedText type="title" style={styles.name}>John Doe</ThemedText>
          <ThemedText type="caption">Travel Enthusiast</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statsContainer}>
          <ThemedView style={styles.stat} backgroundColorName="background">
            <ThemedText type="subtitle">12</ThemedText>
            <ThemedText type="caption">Trips</ThemedText>
          </ThemedView>
          <ThemedView style={styles.stat} backgroundColorName="background">
            <ThemedText type="subtitle">48</ThemedText>
            <ThemedText type="caption">Photos</ThemedText>
          </ThemedView>
          <ThemedView style={styles.stat} backgroundColorName="background">
            <ThemedText type="subtitle">5</ThemedText>
            <ThemedText type="caption">Reviews</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.menuContainer}>
          <MenuItem icon="person-outline" title="Personal Information" subtitle="Name, Email, Phone" />
          <MenuItem icon="history" title="Trip History" subtitle="Your past adventures" />
          <MenuItem icon="favorite-border" title="Wishlist" subtitle="Places you want to visit" />
          <MenuItem icon="settings" title="Settings" subtitle="Notifications, Privacy" />
          <MenuItem icon="help-outline" title="Help & Support" />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.round,
    marginBottom: Spacing.m,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.l,
    marginHorizontal: Spacing.l,
    borderRadius: BorderRadius.l,
  },
  stat: {
    alignItems: 'center',
  },
  menuContainer: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.l,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.l,
    marginBottom: Spacing.m,
    borderRadius: BorderRadius.l,
    elevation: 1,
  },
  menuText: {
    flex: 1,
    marginLeft: Spacing.m,
  },
});
