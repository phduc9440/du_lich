import React from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  Image, 
  TextInput, 
  FlatList, 
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MOCK_TOURS, CATEGORIES, Tour } from '@/services/mockData';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

export default function HomeScreen() {
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const secondaryBg = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'text');

  const renderCategory = ({ item }: { item: typeof CATEGORIES[0] }) => (
    <TouchableOpacity style={[styles.categoryCard, { backgroundColor: cardBg }]}>
      <MaterialIcons name={item.icon as any} size={24} color={primaryColor} />
      <ThemedText style={styles.categoryName}>{item.name}</ThemedText>
    </TouchableOpacity>
  );

  const renderTourCard = ({ item }: { item: Tour }) => (
    <TouchableOpacity style={[styles.tourCard, { backgroundColor: cardBg }]}>
      <Image source={{ uri: item.image }} style={styles.tourImage} />
      <ThemedView style={styles.tourInfo} backgroundColorName="card">
        <ThemedText type="subtitle" numberOfLines={1}>{item.title}</ThemedText>
        <ThemedView style={styles.locationContainer} backgroundColorName="card">
          <MaterialIcons name="location-on" size={14} color={primaryColor} />
          <ThemedText type="caption" style={styles.locationText}>{item.location}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.priceRow} backgroundColorName="card">
          <ThemedText type="defaultSemiBold" style={{ color: primaryColor }}>
            ${item.price}
            <ThemedText type="caption"> / person</ThemedText>
          </ThemedText>
          <ThemedView style={styles.ratingContainer} backgroundColorName="card">
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <ThemedText type="defaultSemiBold" style={styles.ratingText}>{item.rating}</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <ThemedView style={styles.header}>
          <ThemedText type="title">Find your next{"\n"}Adventure</ThemedText>
          <ThemedView style={[styles.searchContainer, { backgroundColor: secondaryBg }]}>
            <MaterialIcons name="search" size={20} color="#888" />
            <TextInput 
              placeholder="Search destinations..." 
              placeholderTextColor="#888"
              style={[styles.searchInput, { color: textColor }]}
            />
          </ThemedView>
        </ThemedView>

        {/* Categories Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Categories</ThemedText>
          <FlatList
            data={CATEGORIES}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </ThemedView>

        {/* Popular Section */}
        <ThemedView style={styles.section}>
          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Popular Destinations</ThemedText>
            <TouchableOpacity>
              <ThemedText style={{ color: primaryColor }}>See all</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          <FlatList
            data={MOCK_TOURS}
            renderItem={renderTourCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toursList}
            snapToInterval={CARD_WIDTH + Spacing.l}
            decelerationRate="fast"
          />
        </ThemedView>

        {/* Just for you / Recommendation Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Recommended for you</ThemedText>
          {MOCK_TOURS.slice(2).map(tour => (
             <TouchableOpacity key={tour.id} style={[styles.recommendationCard, { backgroundColor: cardBg }]}>
                <Image source={{ uri: tour.image }} style={styles.recommendationImage} />
                <ThemedView style={styles.recommendationInfo} backgroundColorName="card">
                  <ThemedText type="defaultSemiBold">{tour.title}</ThemedText>
                  <ThemedText type="caption" numberOfLines={2}>{tour.description}</ThemedText>
                  <ThemedText type="defaultSemiBold" style={{ color: primaryColor, marginTop: 4 }}>${tour.price}</ThemedText>
                </ThemedView>
             </TouchableOpacity>
          ))}
        </ThemedView>
        
        <ThemedView style={{ height: Spacing.huge }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.l,
    paddingTop: Spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.l,
    paddingHorizontal: Spacing.m,
    height: 50,
    borderRadius: BorderRadius.l,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.s,
    fontSize: 16,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.m,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.m,
  },
  categoriesList: {
    paddingHorizontal: Spacing.l,
  },
  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.m,
    marginRight: Spacing.m,
    borderRadius: BorderRadius.l,
    width: 100,
    height: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryName: {
    marginTop: Spacing.s,
    fontSize: 12,
    fontWeight: '600',
  },
  toursList: {
    paddingHorizontal: Spacing.l,
  },
  tourCard: {
    width: CARD_WIDTH,
    marginRight: Spacing.l,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tourImage: {
    width: '100%',
    height: 200,
  },
  tourInfo: {
    padding: Spacing.m,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  locationText: {
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.m,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
  },
  recommendationCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.l,
    marginBottom: Spacing.m,
    borderRadius: BorderRadius.l,
    overflow: 'hidden',
    elevation: 2,
  },
  recommendationImage: {
    width: 100,
    height: 100,
  },
  recommendationInfo: {
    flex: 1,
    padding: Spacing.m,
    justifyContent: 'center',
  }
});
