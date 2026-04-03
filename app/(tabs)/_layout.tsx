import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts, Spacing, BorderRadius } from '@/constants/Theme';
import { useTranslation } from 'react-i18next';
import { getCurrentUser } from '@/src/api/auth';
import { getProfile, Profile } from '@/src/api/profiles';
import { useRouter } from 'expo-router';

function CustomDrawerContent(props: any) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: userData } = await getCurrentUser();
    if (userData?.user) {
      const { data: profileData } = await getProfile(userData.user.id);
      if (profileData) setProfile(profileData);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: theme.maroonSoft }]}>
            <Text style={[styles.avatarText, { color: theme.maroon }]}>
              {getInitials(profile?.full_name)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {profile?.full_name || 'User'}
            </Text>
            <Text style={[styles.profileRole, { color: theme.textSecondary }]}>
              Legal Professional
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Drawer Items */}
        <View style={styles.menuSection}>
          <DrawerItemList {...props} />
        </View>
        
      </DrawerContentScrollView>

      {/* Footer with Settings gear */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: theme.surfaceElevated }]}
          onPress={() => router.push('/settings')}
        >
          <FontAwesome name="cog" size={18} color={theme.textSecondary} />
          <Text style={[styles.settingsBtnText, { color: theme.textSecondary }]}>Settings</Text>
        </TouchableOpacity>
        <Text style={[styles.versionText, { color: theme.textMuted }]}>Maroon CRM v1.0.0</Text>
      </View>
    </View>
  );
}

function DrawerIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={20} style={{ marginLeft: 4, marginRight: -8, width: 24, textAlign: 'center' }} {...props} />;
}

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: Fonts.bold, fontSize: 18 },
        drawerActiveTintColor: theme.surfaceElevated,
        drawerInactiveTintColor: theme.textSecondary,
        drawerActiveBackgroundColor: theme.maroon,
        drawerItemStyle: {
          borderRadius: BorderRadius.md,
          marginHorizontal: Spacing.md,
          paddingVertical: 2,
        },
        drawerLabelStyle: {
          fontFamily: Fonts.semiBold,
          fontSize: 15,
          marginLeft: -8,
        },
        drawerStyle: {
          backgroundColor: theme.background,
          width: 280,
        }
      }}>
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: t('tabs.dashboard', 'Dashboard'),
          title: t('tabs.dashboard', 'Dashboard'),
          drawerIcon: ({ color, focused }) => <DrawerIcon name="home" color={focused ? '#FFF' : color} />,
          drawerActiveTintColor: '#FFF',
        }}
      />
      <Drawer.Screen
        name="clients"
        options={{
          drawerLabel: t('tabs.clients', 'Clients'),
          title: t('tabs.clients', 'Clients'),
          drawerIcon: ({ color, focused }) => <DrawerIcon name="users" color={focused ? '#FFF' : color} />,
          drawerActiveTintColor: '#FFF',
        }}
      />
      <Drawer.Screen
        name="reminders"
        options={{
          drawerLabel: t('tabs.reminders', 'Reminders'),
          title: t('tabs.reminders', 'Reminders'),
          drawerIcon: ({ color, focused }) => <DrawerIcon name="bell" color={focused ? '#FFF' : color} />,
          drawerActiveTintColor: '#FFF',
        }}
      />
      <Drawer.Screen
        name="routines"
        options={{
          drawerLabel: t('tabs.routines', 'Routines'),
          title: t('tabs.routines', 'Routines'),
          drawerIcon: ({ color, focused }) => <DrawerIcon name="tasks" color={focused ? '#FFF' : color} />,
          drawerActiveTintColor: '#FFF',
        }}
      />
      <Drawer.Screen
        name="completed"
        options={{
          drawerLabel: t('tabs.history', 'History'),
          title: t('tabs.history', 'History'),
          drawerIcon: ({ color, focused }) => <DrawerIcon name="archive" color={focused ? '#FFF' : color} />,
          drawerActiveTintColor: '#FFF',
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  profileInfo: {
    marginLeft: Spacing.md,
  },
  profileName: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    marginBottom: 2,
  },
  profileRole: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  menuSection: {
    flex: 1,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 10,
    width: '100%',
  },
  settingsBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  versionText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  }
});
