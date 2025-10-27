import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../../styles/theme';
// import * as Clipboard from 'expo-clipboard'; // Would be installed as dependency

// Stub Clipboard implementation
const Clipboard = {
  setStringAsync: async (text: string): Promise<void> => {
    console.log(`Clipboard.setStringAsync: ${text}`);
    // In real implementation, this would copy to device clipboard
  },
};

interface LessonQRCodeSheetProps {
  visible: boolean;
  qrCodeData?: string;
  onClose: () => void;
}

export const LessonQRCodeSheet: React.FC<LessonQRCodeSheetProps> = ({
  visible,
  qrCodeData,
  onClose,
}) => {
  const copyToClipboard = async () => {
    try {
      const deepLink = 'app://lesson/sample-lesson-id';
      await Clipboard.setStringAsync(deepLink);
      Alert.alert('Copied!', 'Lesson link copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const shareLesson = () => {
    Alert.alert('Share Lesson', 'Share functionality would be implemented here');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeIcon}>×</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Lesson</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.qrContainer}>
            <LinearGradient
              colors={['#f8fafc', '#e2e8f0']}
              style={styles.qrBackground}
            >
              {qrCodeData ? (
                <Image
                  source={{ uri: qrCodeData }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrPlaceholderIcon}>📱</Text>
                  <Text style={styles.qrPlaceholderText}>QR Code</Text>
                  <Text style={styles.qrPlaceholderSubtext}>
                    Scan to access lesson
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Quick Access</Text>
            <Text style={styles.infoText}>
              Students can scan this QR code to quickly access the lesson plan and resources.
            </Text>
          </View>

          <View style={styles.linkSection}>
            <Text style={styles.linkLabel}>Lesson Link</Text>
            <View style={styles.linkContainer}>
              <Text style={styles.linkText} numberOfLines={1}>
                app://lesson/sample-lesson-id
              </Text>
              <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={copyToClipboard}>
            <Text style={styles.actionButtonText}>📋 Copy Link</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.primaryActionButton} onPress={shareLesson}>
            <LinearGradient
              colors={['#2563eb', '#3b82f6']}
              style={styles.primaryActionGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            >
              <Text style={styles.primaryActionText}>📤 Share Lesson</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');
const qrSize = Math.min(width * 0.6, 240);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
  },
  headerSpacer: {
    width: 32,
  },

  content: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
  },
  
  qrContainer: {
    marginBottom: spacing.xl,
  },
  qrBackground: {
    width: qrSize + 32,
    height: qrSize + 32,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  qrImage: {
    width: qrSize,
    height: qrSize,
    borderRadius: 12,
  },
  qrPlaceholder: {
    width: qrSize,
    height: qrSize,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  qrPlaceholderIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  qrPlaceholderText: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  qrPlaceholderSubtext: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  infoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  infoTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  linkSection: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  linkLabel: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  linkText: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  copyButtonText: {
    color: colors.surface,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },

  actions: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  primaryActionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryActionGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: colors.surface,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
});

export default LessonQRCodeSheet;
