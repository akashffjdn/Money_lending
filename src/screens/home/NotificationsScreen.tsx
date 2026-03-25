import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MotiView } from '../../utils/MotiCompat';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { HomeStackParamList } from '../../types/navigation';
import { useNotificationStore } from '../../store/notificationStore';
import { formatRelativeTime } from '../../utils/formatDate';
import type { Notification, NotificationType } from '../../types/notification';

import ScreenWrapper from '../../components/layout/ScreenWrapper';
import AppChip from '../../components/ui/AppChip';
import EmptyState from '../../components/feedback/EmptyState';

type Props = NativeStackScreenProps<HomeStackParamList, 'Notifications'>;

// --- Filter types ---
type FilterType = 'all' | NotificationType;

interface FilterOption {
  key: FilterType;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

const FILTERS: FilterOption[] = [
  { key: 'all', label: 'All', icon: 'bell-outline' },
  { key: 'loan', label: 'Loans', icon: 'cash-multiple' },
  { key: 'payment', label: 'Payments', icon: 'credit-card-check' },
  { key: 'alert', label: 'Alerts', icon: 'alert-circle-outline' },
  { key: 'promo', label: 'Promos', icon: 'gift-outline' },
];

// --- Notification type metadata ---
const TYPE_META: Record<
  NotificationType,
  {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    color: string;
    borderColor: string;
    iconBg: string;
  }
> = {
  loan: {
    icon: 'cash-multiple',
    color: '#C8850A',
    borderColor: '#C8850A',
    iconBg: 'rgba(200, 133, 10, 0.12)',
  },
  payment: {
    icon: 'credit-card-check',
    color: '#22C55E',
    borderColor: '#22C55E',
    iconBg: 'rgba(34, 197, 94, 0.12)',
  },
  alert: {
    icon: 'alert-circle',
    color: '#EF4444',
    borderColor: '#EF4444',
    iconBg: 'rgba(239, 68, 68, 0.12)',
  },
  promo: {
    icon: 'gift',
    color: '#3B82F6',
    borderColor: '#3B82F6',
    iconBg: 'rgba(59, 130, 246, 0.12)',
  },
};

const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();

  // Store
  const notifications = useNotificationStore((s) => s.notifications);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const loadNotifications = useNotificationStore((s) => s.loadNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);

  // State
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Filtered data
  const filteredNotifications =
    selectedFilter === 'all'
      ? notifications
      : notifications.filter((n) => n.type === selectedFilter);

  // Handlers
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markAllRead();
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      markAsRead(notification.id);
    }
  };

  const handleDelete = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteNotification(id);
  };

  const handleFilterPress = async (key: FilterType) => {
    await Haptics.selectionAsync();
    setSelectedFilter(key);
  };

  // --- Render notification item ---
  const renderNotificationItem = ({
    item,
    index,
  }: {
    item: Notification;
    index: number;
  }) => {
    const meta = TYPE_META[item.type];
    const unreadBg = !item.read ? 'rgba(200, 133, 10, 0.06)' : 'transparent';

    return (
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350, delay: index * 40 }}
        style={styles.notifItemOuter}
      >
        <Pressable
          onPress={() => handleNotificationPress(item)}
          style={({ pressed }) => [
            styles.notifCard,
            {
              backgroundColor: !item.read ? unreadBg : colors.card,
              borderColor: !item.read ? meta.borderColor + '30' : colors.border,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          {/* Left colored border accent */}
          <View
            style={[
              styles.notifLeftBorder,
              { backgroundColor: meta.borderColor },
            ]}
          />

          {/* Icon circle */}
          <View
            style={[
              styles.notifIconCircle,
              { backgroundColor: meta.iconBg },
            ]}
          >
            <MaterialCommunityIcons
              name={meta.icon}
              size={20}
              color={meta.color}
            />
          </View>

          {/* Content */}
          <View style={styles.notifContent}>
            <View style={styles.notifTitleRow}>
              <Text
                style={[
                  styles.notifTitle,
                  {
                    color: colors.text,
                    fontWeight: !item.read ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.read && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
              )}
            </View>
            <Text
              style={[styles.notifDescription, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
            <Text style={[styles.notifTimestamp, { color: colors.textMuted }]}>
              {formatRelativeTime(item.timestamp)}
            </Text>
          </View>

          {/* Delete button */}
          <Pressable
            onPress={() => handleDelete(item.id)}
            hitSlop={10}
            style={({ pressed }) => [
              styles.deleteBtn,
              { opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <MaterialCommunityIcons
              name="close"
              size={16}
              color={colors.textMuted}
            />
          </Pressable>
        </Pressable>
      </MotiView>
    );
  };

  // --- Right header action ---
  const markAllReadAction = (
    <Pressable
      onPress={handleMarkAllRead}
      hitSlop={8}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Text style={[styles.markAllText, { color: colors.primary }]}>Read all</Text>
    </Pressable>
  );

  return (
    <ScreenWrapper
      headerTitle="Notifications"
      onBack={() => navigation.goBack()}
      rightAction={markAllReadAction}
      scrollable={false}
    >
      {/* Filter chips */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((filter) => (
            <View key={filter.key} style={styles.chipWrapper}>
              <AppChip
                label={filter.label}
                selected={selectedFilter === filter.key}
                onPress={() => handleFilterPress(filter.key)}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Notification list */}
      <FlatList<Notification>
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400 }}
          >
            <EmptyState
              icon="bell-off-outline"
              title="No notifications"
              description={
                selectedFilter === 'all'
                  ? 'You\'re all caught up! Check back later.'
                  : `No ${selectedFilter} notifications yet.`
              }
            />
          </MotiView>
        }
        ItemSeparatorComponent={() => null}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  // Filter
  filterContainer: {
    paddingTop: 4,
    paddingBottom: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chipWrapper: {
    marginRight: 0,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  // Notification item
  notifItemOuter: {
    marginBottom: 10,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingRight: 14,
    paddingLeft: 18,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  notifLeftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  notifIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  notifContent: {
    flex: 1,
    marginLeft: 12,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 14,
    flex: 1,
    letterSpacing: -0.1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 8,
  },
  notifDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    letterSpacing: 0.1,
  },
  notifTimestamp: {
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 0.2,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 4,
    marginTop: 0,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

export default NotificationsScreen;
