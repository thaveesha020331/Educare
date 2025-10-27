import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, educationStyles } from '../styles/theme';
import { HealthService } from '../services/health';
import { getBaseUrlForDevice } from '../utils/api';

const HealthTestScreen = ({ navigation }) => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [backendUrl, setBackendUrl] = useState('');

  useEffect(() => {
    setBackendUrl(getBaseUrlForDevice());
    performHealthCheck();
  }, []);

  const performHealthCheck = async () => {
    setIsLoading(true);
    try {
      const status = await HealthService.getBackendStatus();
      setHealthStatus(status);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (error) {
      setHealthStatus({
        isOnline: false,
        message: 'Health check failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runFullHealthCheck = async () => {
    setIsLoading(true);
    try {
      const results = await HealthService.runFullHealthCheck();
      setHealthStatus({
        isOnline: results.health.success,
        message: results.health.success ? 'Backend is running' : 'Backend is offline',
        details: results.health.success ? results.health.data : null,
        error: results.health.success ? null : results.health.error,
        timestamp: results.timestamp,
        status: results.health.success ? 'healthy' : 'unhealthy',
        fullCheck: results
      });
      setLastChecked(new Date().toLocaleTimeString());
    } catch (error) {
      Alert.alert('Health Check Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await performHealthCheck();
    setIsRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return colors.success || '#4CAF50';
      case 'unhealthy': return colors.error || '#F44336';
      case 'error': return colors.error || '#F44336';
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'unhealthy': return '❌';
      case 'error': return '⚠️';
      default: return '❓';
    }
  };

  const renderStatusCard = () => {
    if (!healthStatus) return null;

    return (
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusIcon}>
            {getStatusIcon(healthStatus.status)}
          </Text>
          <Text style={[styles.statusTitle, { color: getStatusColor(healthStatus.status) }]}>
            {healthStatus.message}
          </Text>
        </View>
        
        <View style={styles.statusDetails}>
          <Text style={styles.detailLabel}>Backend URL:</Text>
          <Text style={styles.detailValue}>{backendUrl}</Text>
          
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={[styles.detailValue, { color: getStatusColor(healthStatus.status) }]}>
            {healthStatus.status.toUpperCase()}
          </Text>
          
          {healthStatus.details && (
            <>
              <Text style={styles.detailLabel}>Server Message:</Text>
              <Text style={styles.detailValue}>{healthStatus.details.message}</Text>
              
              <Text style={styles.detailLabel}>Server Time:</Text>
              <Text style={styles.detailValue}>
                {new Date(healthStatus.details.timestamp).toLocaleString()}
              </Text>
            </>
          )}
          
          {healthStatus.error && (
            <>
              <Text style={styles.detailLabel}>Error:</Text>
              <Text style={[styles.detailValue, { color: colors.error }]}>
                {healthStatus.error}
              </Text>
            </>
          )}
          
          <Text style={styles.detailLabel}>Last Checked:</Text>
          <Text style={styles.detailValue}>{lastChecked}</Text>
        </View>
      </View>
    );
  };

  const renderFullCheckResults = () => {
    if (!healthStatus?.fullCheck) return null;

    return (
      <View style={styles.fullCheckCard}>
        <Text style={styles.cardTitle}>Full Health Check Results</Text>
        
        <View style={styles.checkItem}>
          <Text style={styles.checkLabel}>Health Endpoint:</Text>
          <Text style={[
            styles.checkStatus,
            { color: healthStatus.fullCheck.health.success ? colors.success : colors.error }
          ]}>
            {healthStatus.fullCheck.health.success ? '✅ PASS' : '❌ FAIL'}
          </Text>
        </View>
        
        {healthStatus.fullCheck.auth && (
          <View style={styles.checkItem}>
            <Text style={styles.checkLabel}>Auth Protection:</Text>
            <Text style={[
              styles.checkStatus,
              { color: healthStatus.fullCheck.auth.success ? colors.success : colors.error }
            ]}>
              {healthStatus.fullCheck.auth.success ? '✅ PASS' : '❌ FAIL'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }>
        
        <View style={styles.header}>
          <Text style={styles.title}>Health Check</Text>
          <Text style={styles.subtitle}>Backend Connectivity Test</Text>
        </View>

        {renderStatusCard()}
        {renderFullCheckResults()}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={performHealthCheck}
            disabled={isLoading}>
            <LinearGradient
              colors={[colors.accent, colors.primary]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              {isLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>Quick Check</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={runFullHealthCheck}
            disabled={isLoading}>
            <LinearGradient
              colors={[colors.secondary, colors.accent]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              {isLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>Full Check</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navigationButton}
            onPress={() => navigation.navigate('Auth')}>
            <Text style={styles.navigationButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Health Check</Text>
          <Text style={styles.infoText}>
            This page tests the connectivity to your backend server. It checks:
          </Text>
          <Text style={styles.infoBullet}>• Backend server availability</Text>
          <Text style={styles.infoBullet}>• API endpoint responses</Text>
          <Text style={styles.infoBullet}>• Authentication protection</Text>
          <Text style={styles.infoBullet}>• Network connectivity</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: colors.surface,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    color: colors.surface,
    opacity: 0.9,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  statusTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
  },
  statusDetails: {
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fullCheckCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    color: colors.text,
    marginBottom: spacing.md,
  },
  checkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkLabel: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    flex: 1,
  },
  checkStatus: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.surface,
  },
  navigationButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  navigationButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.accent,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  infoTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoBullet: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    marginBottom: spacing.xs,
  },
});

export default HealthTestScreen;
