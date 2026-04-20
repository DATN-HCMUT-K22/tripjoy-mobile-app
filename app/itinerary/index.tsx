import React, { useState, useMemo } from 'react';
import { View, FlatList, RefreshControl, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useItineraries } from '@/hooks/useItineraries';
import { ItineraryCard } from '@/components/group/ItineraryCard';
import { StatusBadge } from '@/components/itinerary/StatusBadge';
import { NoItinerariesEmpty, NoSearchResultsEmpty } from '@/components/shared/EmptyState';
import { ItineraryCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { ITINERARY_STATUS } from '@/services/itineraries';
import type { ItineraryTab } from '@/types/itinerary';
import type { Itinerary } from '@/types/group';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function resolveItineraryTab(itinerary: Itinerary): ItineraryTab {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(itinerary.startDate);
  const end = new Date(itinerary.endDate);
  const endIncl = new Date(end);
  endIncl.setHours(23, 59, 59, 999);

  // Check if dates are invalid
  if (Number.isNaN(start.getTime()) && Number.isNaN(end.getTime())) {
    return 'draft';
  }

  // Future trip
  if (!Number.isNaN(start.getTime()) && start > today) {
    return 'draft';
  }

  // Past trip
  if (!Number.isNaN(endIncl.getTime()) && endIncl < today) {
    return 'completed';
  }

  // Ongoing
  return 'ongoing';
}

export default function ItineraryListScreen() {
  const router = useRouter();
  const { data: itineraries = [], isLoading, refetch, isRefetching } = useItineraries();
  const [activeTab, setActiveTab] = useState<ItineraryTab>('ongoing');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filter itineraries by active tab and search
  const filteredItineraries = useMemo(() => {
    let filtered = itineraries.filter(it => resolveItineraryTab(it) === activeTab);

    if (debouncedSearch) {
      filtered = filtered.filter(it =>
        it.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    return filtered;
  }, [itineraries, activeTab, debouncedSearch]);

  // Count for each tab
  const tabCounts = useMemo(() => {
    const counts = { ongoing: 0, completed: 0, draft: 0 };
    itineraries.forEach(it => {
      const tab = resolveItineraryTab(it);
      counts[tab]++;
    });
    return counts;
  }, [itineraries]);

  const handleCreateNew = () => {
    router.push('/create');
  };

  const handleItineraryPress = (itinerary: Itinerary) => {
    router.push(`/itinerary/${itinerary.id}`);
  };

  const renderItineraryItem = ({ item }: { item: Itinerary }) => (
    <ItineraryCard
      itinerary={item}
      onPress={() => handleItineraryPress(item)}
    />
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'ongoing' && styles.activeTab]}
        onPress={() => setActiveTab('ongoing')}
        accessibilityRole="button"
        accessibilityLabel="Đang diễn ra"
      >
        <View style={styles.tabContent}>
          <View style={styles.tabLabelRow}>
            <View style={[styles.tabLabel, activeTab === 'ongoing' && styles.activeTabLabel]}>
              Đang diễn ra
            </View>
            {tabCounts.ongoing > 0 && (
              <View style={[styles.badge, activeTab === 'ongoing' && styles.activeBadge]}>
                <View style={styles.badgeText}>{tabCounts.ongoing}</View>
              </View>
            )}
          </View>
          {activeTab === 'ongoing' && <View style={styles.indicator} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
        onPress={() => setActiveTab('completed')}
        accessibilityRole="button"
        accessibilityLabel="Đã xong"
      >
        <View style={styles.tabContent}>
          <View style={styles.tabLabelRow}>
            <View style={[styles.tabLabel, activeTab === 'completed' && styles.activeTabLabel]}>
              Đã xong
            </View>
            {tabCounts.completed > 0 && (
              <View style={[styles.badge, activeTab === 'completed' && styles.activeBadge]}>
                <View style={styles.badgeText}>{tabCounts.completed}</View>
              </View>
            )}
          </View>
          {activeTab === 'completed' && <View style={styles.indicator} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'draft' && styles.activeTab]}
        onPress={() => setActiveTab('draft')}
        accessibilityRole="button"
        accessibilityLabel="Nháp"
      >
        <View style={styles.tabContent}>
          <View style={styles.tabLabelRow}>
            <View style={[styles.tabLabel, activeTab === 'draft' && styles.activeTabLabel]}>
              Nháp
            </View>
            {tabCounts.draft > 0 && (
              <View style={[styles.badge, activeTab === 'draft' && styles.activeBadge]}>
                <View style={styles.badgeText}>{tabCounts.draft}</View>
              </View>
            )}
          </View>
          {activeTab === 'draft' && <View style={styles.indicator} />}
        </View>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderTabBar()}
        <ItineraryCardSkeleton />
        <ItineraryCardSkeleton />
      </View>
    );
  }

  const emptyComponent = debouncedSearch ? (
    <NoSearchResultsEmpty />
  ) : (
    <NoItinerariesEmpty onCreateNew={handleCreateNew} />
  );

  return (
    <View style={styles.container}>
      {renderTabBar()}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm lịch trình..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredItineraries}
        renderItem={renderItineraryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredItineraries.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={emptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={['#2BB673']}
            tintColor="#2BB673"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB - Create New Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateNew}
        accessibilityRole="button"
        accessibilityLabel="Tạo lịch trình mới"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    // Active state handled by indicator
  },
  tabContent: {
    alignItems: 'center',
    width: '100%',
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabLabel: {
    color: '#2BB673',
  },
  badge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '80%',
    backgroundColor: '#2BB673',
    borderRadius: 2,
  },
  listContent: {
    paddingVertical: 16,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2BB673',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
