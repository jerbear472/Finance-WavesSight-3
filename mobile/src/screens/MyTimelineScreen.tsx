import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import TrendStorageService from '../services/TrendStorageService';
import { TrendData } from '../types/trend.types';
import { supabase } from '../config/supabase';
import { useAuth } from '../hooks/useAuth';

interface MyTimelineScreenProps {
  onBack?: () => void;
}

const MyTimelineScreen: React.FC<MyTimelineScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  useEffect(() => {
    if (user?.id) {
      loadTrends();
    }
  }, [user]);

  const loadTrends = async () => {
    try {
      // Load from Supabase logged_trends table
      const { data: loggedTrends, error } = await supabase
        .from('logged_trends')
        .select('*')
        .eq('user_id', user?.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Also load local trends for backward compatibility
      const localTrends = await TrendStorageService.getAllTrends();

      // Convert logged trends to TrendData format
      const supabaseTrends: TrendData[] = (loggedTrends || []).map(trend => ({
        id: trend.id,
        url: trend.notes || `Trend in ${trend.category}`,
        title: trend.emoji ? `${trend.emoji} ${trend.category}` : trend.category,
        description: trend.notes || '',
        platform: trend.category === 'audio' ? 'tiktok' : 
                 trend.category === 'fashion' ? 'instagram' : 
                 trend.category === 'tech' ? 'youtube' : 
                 trend.category === 'meme' ? 'twitter' : 'other',
        createdAt: trend.timestamp || trend.created_at,
        metadata: {
          hashtags: [],
          category: trend.category,
          emoji: trend.emoji,
          verified: trend.verified,
          verificationCount: trend.verification_count || 0,
        },
      }));

      // Combine and deduplicate trends
      const allTrends = [...supabaseTrends, ...localTrends];
      const uniqueTrends = allTrends.filter((trend, index, self) => 
        index === self.findIndex(t => t.id === trend.id)
      );
      
      // Sort by creation date (newest first)
      const sortedTrends = uniqueTrends.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTrends(sortedTrends);
    } catch (error) {
      console.error('Error loading trends:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTrends();
    setIsRefreshing(false);
  };

  const handleDeleteTrend = (trendId: string) => {
    Alert.alert(
      'Delete Trend',
      'Are you sure you want to delete this trend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from Supabase if it's a logged trend
              const { error } = await supabase
                .from('logged_trends')
                .delete()
                .eq('id', trendId)
                .eq('user_id', user?.id);
              
              if (error && error.code !== 'PGRST116') {
                console.error('Error deleting from Supabase:', error);
              }
              
              // Also try to delete from local storage
              await TrendStorageService.deleteTrend(trendId);
              
              loadTrends();
            } catch (error) {
              console.error('Error deleting trend:', error);
            }
          },
        },
      ]
    );
  };

  const filteredTrends = selectedPlatform === 'all' 
    ? trends 
    : trends.filter(trend => trend.platform === selectedPlatform);

  const platformCounts = {
    all: trends.length,
    tiktok: trends.filter(t => t.platform === 'tiktok').length,
    instagram: trends.filter(t => t.platform === 'instagram').length,
    youtube: trends.filter(t => t.platform === 'youtube').length,
    twitter: trends.filter(t => t.platform === 'twitter').length,
    other: trends.filter(t => t.platform === 'other').length,
  };

  const renderTrendItem = (trend: TrendData) => {
    const date = new Date(trend.createdAt);
    const timeAgo = getTimeAgo(date);

    return (
      <TouchableOpacity 
        key={trend.id} 
        style={styles.trendItem}
        onLongPress={() => handleDeleteTrend(trend.id)}
        activeOpacity={0.8}>
        
        <View style={styles.trendHeader}>
          <View style={[styles.platformBadge, { backgroundColor: getPlatformColor(trend.platform) }]}>
            <Text style={styles.platformIcon}>
              {trend.platform === 'tiktok' ? '♪' : 
               trend.platform === 'instagram' ? '📷' :
               trend.platform === 'youtube' ? '▶️' :
               trend.platform === 'twitter' ? '𝕏' : '🔗'}
            </Text>
            <Text style={styles.platformName}>
              {trend.platform.charAt(0).toUpperCase() + trend.platform.slice(1)}
            </Text>
          </View>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>

        <Text style={styles.trendTitle} numberOfLines={2}>
          {trend.title}
        </Text>
        
        {trend.metadata?.creator && (
          <Text style={styles.creatorText}>
            {trend.metadata.creator}
          </Text>
        )}

        {(trend.metadata?.caption || trend.description) && (
          <Text style={styles.trendDescription} numberOfLines={3}>
            {trend.metadata?.caption || trend.description}
          </Text>
        )}
        
        {trend.metadata && (trend.metadata.likes || trend.metadata.comments || trend.metadata.views) && (
          <View style={styles.engagementContainer}>
            {trend.metadata.likes !== undefined && (
              <View style={styles.engagementItem}>
                <Text style={styles.engagementIcon}>❤️</Text>
                <Text style={styles.engagementText}>{formatEngagementNumber(trend.metadata.likes)}</Text>
              </View>
            )}
            {trend.metadata.comments !== undefined && (
              <View style={styles.engagementItem}>
                <Text style={styles.engagementIcon}>💬</Text>
                <Text style={styles.engagementText}>{formatEngagementNumber(trend.metadata.comments)}</Text>
              </View>
            )}
            {trend.metadata.shares !== undefined && (
              <View style={styles.engagementItem}>
                <Text style={styles.engagementIcon}>🔁</Text>
                <Text style={styles.engagementText}>{formatEngagementNumber(trend.metadata.shares)}</Text>
              </View>
            )}
            {trend.metadata.views !== undefined && (
              <View style={styles.engagementItem}>
                <Text style={styles.engagementIcon}>👀</Text>
                <Text style={styles.engagementText}>{formatEngagementNumber(trend.metadata.views)}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.trendFooter}>
          <Text style={styles.trendUrl} numberOfLines={1}>
            {trend.url}
          </Text>
          
          {trend.metadata.hashtags && trend.metadata.hashtags.length > 0 && (
            <View style={styles.hashtagsContainer}>
              {trend.metadata.hashtags.slice(0, 3).map((tag, index) => (
                <Text key={index} style={styles.hashtag}>{tag}</Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.trendDate}>
          <Text style={styles.dateText}>
            {date.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const formatEngagementNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };
  
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getPlatformColor = (platform: string): string => {
    switch (platform) {
      case 'tiktok': return 'rgba(255, 0, 80, 0.2)';
      case 'instagram': return 'rgba(214, 41, 118, 0.2)';
      case 'youtube': return 'rgba(255, 0, 0, 0.2)';
      case 'twitter': return 'rgba(29, 161, 242, 0.2)';
      default: return 'rgba(0, 102, 255, 0.2)';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>⭐ My Timeline</Text>
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{trends.length}</Text>
              <Text style={styles.statLabel}>Trends</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{platformCounts.tiktok}</Text>
              <Text style={styles.statLabel}>TikTok</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{platformCounts.instagram}</Text>
              <Text style={styles.statLabel}>Instagram</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Platform Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}>
        {Object.entries(platformCounts).map(([platform, count]) => (
          count > 0 && (
            <TouchableOpacity
              key={platform}
              style={[
                styles.filterChip,
                selectedPlatform === platform && styles.filterChipActive
              ]}
              onPress={() => setSelectedPlatform(platform)}>
              <Text style={[
                styles.filterText,
                selectedPlatform === platform && styles.filterTextActive
              ]}>
                {platform === 'all' ? 'All' : platform.charAt(0).toUpperCase() + platform.slice(1)}
              </Text>
              <Text style={[
                styles.filterCount,
                selectedPlatform === platform && styles.filterCountActive
              ]}>
                {count}
              </Text>
            </TouchableOpacity>
          )
        ))}
      </ScrollView>

      {/* Timeline */}
      <ScrollView
        style={styles.timeline}
        contentContainerStyle={styles.timelineContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#0066ff"
          />
        }>
        
        {filteredTrends.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>⭐</Text>
            </View>
            <Text style={styles.emptyTitle}>No trends captured yet</Text>
            <Text style={styles.emptyText}>
              Share content from TikTok or Instagram{'\n'}to build your personal trend timeline
            </Text>
            <TouchableOpacity style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Learn How →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.trendsContainer}>
            {filteredTrends.map(renderTrendItem)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTop: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 20,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#333',
    marginHorizontal: 20,
  },
  filterContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#0066ff',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  filterTextActive: {
    color: '#fff',
  },
  filterCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterCountActive: {
    color: '#fff',
  },
  timeline: {
    flex: 1,
  },
  timelineContent: {
    paddingVertical: 20,
  },
  trendsContainer: {
    paddingHorizontal: 20,
  },
  trendItem: {
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  platformIcon: {
    fontSize: 20,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
  },
  trendTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 24,
    marginBottom: 8,
  },
  trendDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    marginBottom: 12,
  },
  creatorText: {
    fontSize: 14,
    color: '#0066ff',
    marginBottom: 8,
    fontWeight: '500',
  },
  engagementContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementIcon: {
    fontSize: 14,
  },
  engagementText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  trendFooter: {
    gap: 10,
  },
  trendUrl: {
    fontSize: 12,
    color: '#666',
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtag: {
    fontSize: 12,
    color: '#0066ff',
    backgroundColor: 'rgba(0, 102, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendDate: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 50,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0066ff',
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyTimelineScreen;