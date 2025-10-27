import { useState, useEffect, useCallback } from 'react';
import AccessibilityService from '../services/accessibility';

export const useAccessibility = () => {
  const [settings, setSettings] = useState(AccessibilityService.DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const loadedSettings = await AccessibilityService.initialize();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = useCallback(async (key, value) => {
    try {
      const success = await AccessibilityService.updateSetting(key, value);
      if (success) {
        setSettings(prev => ({ ...prev, [key]: value }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating accessibility setting:', error);
      return false;
    }
  }, []);

  const triggerHaptic = useCallback(async (type = 'light') => {
    await AccessibilityService.triggerHaptic(type);
  }, []);

  const speak = useCallback(async (text, options = {}) => {
    await AccessibilityService.speak(text, options);
  }, []);

  const stopSpeaking = useCallback(() => {
    AccessibilityService.stopSpeaking();
  }, []);

  const announce = useCallback(async (text, options = {}) => {
    await AccessibilityService.announceForAccessibility(text, options);
  }, []);

  const getAccessibilityProps = useCallback((elementType, options = {}) => {
    return AccessibilityService.getAccessibilityProps(elementType, options);
  }, []);

  const getHighContrastStyles = useCallback(async (baseStyles) => {
    return await AccessibilityService.getHighContrastStyles(baseStyles);
  }, []);

  const getTextScale = useCallback(() => {
    return settings.largeTextEnabled ? settings.largeTextScale : 1.0;
  }, [settings.largeTextEnabled, settings.largeTextScale]);

  const getScaledFontSize = useCallback((baseFontSize) => {
    const scale = getTextScale();
    return baseFontSize * scale;
  }, [getTextScale]);

  return {
    settings,
    loading,
    updateSetting,
    triggerHaptic,
    speak,
    stopSpeaking,
    announce,
    getAccessibilityProps,
    getHighContrastStyles,
    getTextScale,
    getScaledFontSize,
    loadSettings,
  };
};

export default useAccessibility;
