import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { BorderRadius, Layout, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { CATEGORIES, CategoryName } from '@/constants/categories';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppInput } from '@/components/ui/AppInput';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { CampaignCard } from '@/components/campaign/CampaignCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Campaign } from '@/types/campaign';

type SortOption = 'featured' | 'most_funded' | 'ending_soon' | 'newest';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryName>('All');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const { data: campaigns, isLoading, refetch, isRefetching } = useCampaigns({
    category: selectedCategory,
    searchQuery,
    sortBy,
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortBy('featured');
  };

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Featured', value: 'featured' },
    { label: 'Most Funded', value: 'most_funded' },
    { label: 'Ending Soon', value: 'ending_soon' },
    { label: 'Newest', value: 'newest' },
  ];

  const renderHeader = () => (
    <View style={styles.headerArea}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Explore Campaigns</Text>
        <Text style={styles.subtitle}>
          Discover verified messages seeking community-funded amplification.
        </Text>
      </View>

      {/* Search Input */}
      <AppInput
        placeholder="Search title, creator, or topic..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftIcon={<Ionicons name="search-outline" size={18} color={Palette.neutral400} />}
        rightIcon={
          searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Palette.neutral400} />
            </Pressable>
          ) : undefined
        }
        containerStyle={styles.searchContainer}
      />

      {/* Horizontal Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
        style={styles.categoryScrollWrapper}>
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat}
            label={cat}
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
          />
        ))}
      </ScrollView>

      {/* Sort Bar & Result Counter */}
      <View style={styles.filterMetaRow}>
        <Text style={styles.countText}>
          {campaigns ? `${campaigns.length} ${campaigns.length === 1 ? 'campaign' : 'campaigns'}` : ''}
        </Text>

        <View style={styles.sortPills}>
          {sortOptions.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setSortBy(opt.value)}
              accessibilityRole="button"
              accessibilityLabel={`Sort by ${opt.label}`}
              style={[
                styles.sortPill,
                sortBy === opt.value && styles.sortPillActive,
              ]}>
              <Text
                style={[
                  styles.sortPillText,
                  sortBy === opt.value && styles.sortPillTextActive,
                ]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer
      scrollable={false}
      paddingHorizontal={false}
      backgroundColor={Palette.warmWhite}>
      <FlatList
        data={campaigns || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <CampaignCard campaign={item} />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.cardWrapper}>
              <LoadingSkeleton count={2} />
            </View>
          ) : (
            <View style={styles.cardWrapper}>
              <EmptyState
                iconName="search-outline"
                title="No campaigns found"
                description={
                  searchQuery.length > 0
                    ? `No campaigns matched "${searchQuery}". Try adjusting your keywords or clearing the category filter.`
                    : 'There are no campaigns matching this filter criteria at the moment.'
                }
                actionTitle="Reset Filters"
                onAction={handleResetFilters}
              />
            </View>
          )
        }
        contentContainerStyle={styles.flatListContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flatListContent: {
    paddingBottom: Spacing.xl,
  },
  headerArea: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingTop: Spacing.sm,
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  titleRow: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Palette.navy950,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    marginTop: 2,
  },
  searchContainer: {
    marginBottom: Spacing.sm,
  },
  categoryScrollWrapper: {
    marginBottom: Spacing.sm,
    marginHorizontal: -Layout.screenPaddingHorizontal,
  },
  categoryScroll: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingVertical: 2,
  },
  filterMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
    flexWrap: 'wrap',
    gap: 8,
  },
  countText: {
    ...Typography.caption,
    color: Palette.neutral500,
    fontWeight: '600',
  },
  sortPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: Palette.pureWhite,
    borderWidth: 1,
    borderColor: Palette.neutral200,
  },
  sortPillActive: {
    backgroundColor: Palette.neutral100,
    borderColor: Palette.navy700,
  },
  sortPillText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  sortPillTextActive: {
    color: Palette.navy950,
    fontWeight: '700',
  },
  cardWrapper: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
});
