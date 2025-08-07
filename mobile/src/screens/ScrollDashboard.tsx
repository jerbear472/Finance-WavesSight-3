import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ScrollSession, ScrollSessionRef } from '../components/ScrollSession/ScrollSessionForwardRef';
import { FloatingTrendLogger } from '../components/TrendLogger/FloatingTrendLogger';
import { SwipeableVerificationFeed } from '../components/TrendVerification/SwipeableVerificationFeed';
import { EarningsDashboard } from './EarningsDashboard';
import { TrendRadar } from './TrendRadar';
import { useAuth } from '../hooks/useAuth';

const Tab = createBottomTabNavigator();

// Simplified Main Dashboard Screen
const MainDashboard: React.FC = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const scrollSessionRef = useRef<ScrollSessionRef>(null);

  const handleSessionStateChange = useCallback((active: boolean) => {
    setIsSessionActive(active);
  }, []);

  const handleTrendLogged = useCallback(() => {
    scrollSessionRef.current?.incrementTrendCount();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Clean Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>WaveSight</Text>
          <Text style={styles.headerSubtitle}>Trend Spotting</Text>
        </View>

        {/* Scroll Session Component */}
        <View style={styles.sessionContainer}>
          <ScrollSession
            ref={scrollSessionRef}
            onSessionStateChange={handleSessionStateChange}
          />
        </View>

        {/* Simple Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>7</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>42</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>$12.50</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={styles.actionButton}>
            <Icon name="trending-up" size={20} color="#0080ff" />
            <Text style={styles.actionText}>Submit Trend</Text>
          </Pressable>
          <Pressable style={styles.actionButton}>
            <Icon name="check-circle" size={20} color="#0080ff" />
            <Text style={styles.actionText}>Verify</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Floating Trend Logger */}
      <FloatingTrendLogger
        isSessionActive={isSessionActive}
        onTrendLogged={handleTrendLogged}
      />
    </SafeAreaView>
  );
};

// Simplified Tab Navigator
export const ScrollDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#0080ff',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={MainDashboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Verify"
        component={SwipeableVerificationFeed}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="check-circle" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Radar"
        component={TrendRadar}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="radar" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsDashboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="cash-multiple" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  sessionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111111',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabBar: {
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});