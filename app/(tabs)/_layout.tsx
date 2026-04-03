import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

function DrawerIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginRight: -10 }} {...props} />;
}

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: theme.tint,
        headerShown: true,
        headerTintColor: theme.text,
      }}>
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: t('tabs.dashboard'),
          title: t('tabs.dashboard'),
          drawerIcon: ({ color }) => <DrawerIcon name="home" color={color} />,
        }}
      />
      <Drawer.Screen
        name="clients"
        options={{
          drawerLabel: t('tabs.clients'),
          title: t('tabs.clients'),
          drawerIcon: ({ color }) => <DrawerIcon name="users" color={color} />,
        }}
      />
      <Drawer.Screen
        name="reminders"
        options={{
          drawerLabel: t('tabs.reminders'),
          title: t('tabs.reminders'),
          drawerIcon: ({ color }) => <DrawerIcon name="bell" color={color} />,
        }}
      />
      <Drawer.Screen
        name="completed"
        options={{
          drawerLabel: t('tabs.history'),
          title: t('tabs.history'),
          drawerIcon: ({ color }) => <DrawerIcon name="check-circle" color={color} />,
        }}
      />
      <Drawer.Screen
        name="routines"
        options={{
          drawerLabel: t('tabs.routines', 'Routines'),
          title: t('tabs.routines', 'Routines'),
          drawerIcon: ({ color }) => <DrawerIcon name="tasks" color={color} />,
        }}
      />
    </Drawer>
  );
}
