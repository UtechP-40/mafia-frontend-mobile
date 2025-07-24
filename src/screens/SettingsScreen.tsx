import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  Switch,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList } from '../types/navigation';
import { Button, Card } from '../components/ui';
import { 
  selectUser,
  selectSettings,
  selectTheme,
  logout,
  updateSettings,
  setTheme,
  toggleTheme,
  setCurrentScreen,
  addNotification
} from '../store/slices';
import { Ionicons } from '@expo/vector-icons';

type SettingsNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const dispatch = useDispatch();
  
  const user = useSelector(selectUser);
  const settings = useSelector(selectSettings);
  const theme = useSelector(selectTheme);
  
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    dispatch(setCurrentScreen('Settings'));
  }, [dispatch]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    dispatch(updateSettings({ [key]: value }));
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
    dispatch(addNotification({
      message: `Switched to ${theme === 'dark' ? 'light' : 'dark'} theme`,
      type: 'info'
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
            dispatch(addNotification({
              message: 'Logged out successfully',
              type: 'info'
            }));
            navigation.navigate('Auth');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            dispatch(addNotification({
              message: 'Account deletion is not yet implemented',
              type: 'info'
            }));
          }
        }
      ]
    );
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle: string,
    value: boolean,
    onToggle: (value: boolean) => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Ionicons name={icon as any} size={24} color="#6366f1" style={styles.settingIcon} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#374151', true: '#6366f1' }}
        thumbColor={value ? '#ffffff' : '#9ca3af'}
      />
    </View>
  );

  const renderActionItem = (
    icon: string,
    title: string,
    subtitle: string,
    onPress: () => void,
    destructive = false
  ) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={styles.settingInfo}>
        <Ionicons 
          name={icon as any} 
          size={24} 
          color={destructive ? '#ef4444' : '#6366f1'} 
          style={styles.settingIcon} 
        />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, destructive && styles.destructiveText]}>
            {title}
          </Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <Card>
          <View style={styles.profileSection}>
            <View style={styles.profileInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>{user?.username || 'Unknown User'}</Text>
                <Text style={styles.profileEmail}>{user?.email || 'No email'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="pencil" size={16} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Game Settings */}
        <Card>
          <Text style={styles.sectionTitle}>Game Settings</Text>
          {renderSettingItem(
            'volume-high',
            'Sound Effects',
            'Play sound effects during gameplay',
            localSettings.soundEnabled,
            (value) => handleSettingChange('soundEnabled', value)
          )}
          {renderSettingItem(
            'phone-portrait',
            'Vibration',
            'Vibrate for game events and notifications',
            localSettings.vibrationEnabled,
            (value) => handleSettingChange('vibrationEnabled', value)
          )}
          {renderSettingItem(
            'flash',
            'Animations',
            'Enable smooth animations and transitions',
            localSettings.animationsEnabled,
            (value) => handleSettingChange('animationsEnabled', value)
          )}
        </Card>

        {/* Appearance */}
        <Card>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <TouchableOpacity style={styles.actionItem} onPress={handleThemeToggle}>
            <View style={styles.settingInfo}>
              <Ionicons 
                name={theme === 'dark' ? 'moon' : 'sunny'} 
                size={24} 
                color="#6366f1" 
                style={styles.settingIcon} 
              />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Theme</Text>
                <Text style={styles.settingSubtitle}>
                  Currently using {theme} theme
                </Text>
              </View>
            </View>
            <View style={styles.themeToggle}>
              <Text style={styles.themeText}>{theme === 'dark' ? 'Dark' : 'Light'}</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        </Card>

        {/* Notifications */}
        <Card>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.comingSoon}>
            <Ionicons name="notifications-outline" size={48} color="#6b7280" />
            <Text style={styles.comingSoonText}>Coming Soon</Text>
            <Text style={styles.comingSoonSubtext}>
              Notification settings will be available in a future update
            </Text>
          </View>
        </Card>

        {/* Account Actions */}
        <Card>
          <Text style={styles.sectionTitle}>Account</Text>
          {renderActionItem(
            'help-circle',
            'Help & Support',
            'Get help and contact support',
            () => {
              dispatch(addNotification({
                message: 'Help & Support coming soon',
                type: 'info'
              }));
            }
          )}
          {renderActionItem(
            'document-text',
            'Privacy Policy',
            'Read our privacy policy',
            () => {
              dispatch(addNotification({
                message: 'Privacy Policy coming soon',
                type: 'info'
              }));
            }
          )}
          {renderActionItem(
            'document',
            'Terms of Service',
            'Read our terms of service',
            () => {
              dispatch(addNotification({
                message: 'Terms of Service coming soon',
                type: 'info'
              }));
            }
          )}
        </Card>

        {/* Danger Zone */}
        <Card>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          {renderActionItem(
            'log-out',
            'Logout',
            'Sign out of your account',
            handleLogout,
            true
          )}
          {renderActionItem(
            'trash',
            'Delete Account',
            'Permanently delete your account and data',
            handleDeleteAccount,
            true
          )}
        </Card>

        {/* App Info */}
        <Card>
          <View style={styles.appInfo}>
            <Text style={styles.appName}>Mobile Mafia Game</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appCopyright}>© 2024 Mafia Game Team</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#9ca3af',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  dangerTitle: {
    color: '#ef4444',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  destructiveText: {
    color: '#ef4444',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  comingSoon: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  comingSoonText: {
    fontSize: 18,
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  appCopyright: {
    fontSize: 12,
    color: '#6b7280',
  },
});