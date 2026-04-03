import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { updateProfile } from '../api/profiles';
import { getCurrentUser } from '../api/auth';
import { EventTask } from '../api/events_and_tasks';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'web') {
    return token;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // expo-notifications uses project id for getting expo push token
    // The project id is usually in the app.json or passed as an option
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    
    token = (await Notifications.getExpoPushTokenAsync({
        projectId
    })).data;
    
    console.log('Push token:', token);
    
    // Save token to Supabase if user is logged in
    const { data: { user } } = await getCurrentUser();
    if (user && token) {
      // Basic deduplication: clear this token from other users before updating
      try {
        await supabase
          .from('profiles')
          .update({ push_token: null })
          .eq('push_token', token)
          .neq('user_id', user.id);
      } catch (err) {
        console.warn('Failed to deduplicate token:', err);
      }

      await updateProfile(user.id, { push_token: token });
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export async function scheduleLocalNotification(event: EventTask) {
  if (!event.due_date) return;

  const trigger = new Date(event.due_date);
  
  // If due date is in the past, don't schedule
  if (trigger.getTime() < Date.now()) {
    return;
  }

  // Schedule notification 1 hour before due date or immediately if it's closer
  // For the purpose of "counting down to zero", we might want a few reminders
  // But for now, let's schedule one at the due date.
  
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: event.title,
      body: `Reminder: ${event.title} is due!`,
      data: { eventId: event.id, clientId: event.client_id_fk },
      priority: event.priority === 'High' ? Notifications.AndroidNotificationPriority.HIGH : Notifications.AndroidNotificationPriority.DEFAULT,
    },
    // @ts-ignore - Expo Notifications type mismatch for Date trigger
    trigger,
  });
  
  return id;
}

export function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data;
  const { eventId, clientId } = data as Record<string, any>;
  
  // We can return navigation information here or handle it directly
  // Since we're in a utility file, maybe return the destination
  if (clientId) {
    return `/client/${clientId}`;
  }
  return '/(tabs)/reminders';
}
