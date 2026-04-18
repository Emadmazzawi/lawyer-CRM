import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { updateProfile } from '../api/profiles';
import { getCurrentUser } from '../api/auth';
import { EventTask } from '../api/events_and_tasks';
import { Routine, RoutineStep } from '../api/routines';

// Initialize notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
  const { eventId, clientId, routineId } = data as Record<string, any>;
  
  if (routineId) {
    return `/run-routine/${routineId}`;
  }
  if (clientId) {
    return `/client/${clientId}`;
  }
  return '/(tabs)/reminders';
}

/**
 * Syncs the local device notifications with the current set of routines.
 * This clears all existing routine notifications and re-schedules them
 * for the next 7 days or recurring weekly to ensure they are up to date.
 */
export async function syncRoutineNotifications(routines: Routine[]) {
  if (Platform.OS === 'web') return;
  
  // First, cancel all existing routine notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.routineId) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  // Now, re-schedule based on the current routines
  for (const routine of routines) {
    if (!routine.steps) continue;

    for (const step of routine.steps) {
      if (step.start_time) {
        const [hour, minute] = step.start_time.split(':').map(Number);
        
        let trigger: Notifications.NotificationTriggerInput;
        
        // day_of_week is 0-6 (0=Sun, 1=Mon, ..., 6=Sat)
        if (step.day_of_week !== null && step.day_of_week !== undefined) {
          // Expo weekday is 1-7 (1=Sun, 2=Mon, ..., 7=Sat)
          trigger = {
            weekday: step.day_of_week + 1,
            hour,
            minute,
            repeats: true,
          };
        } else {
          // Applies to all active days, but for simplicity we can use a daily trigger.
          // Note: If routine.active_days restricts days, we'd ideally schedule multiple weekly triggers.
          // For now, if day_of_week is null, we assume it's daily.
          trigger = {
            hour,
            minute,
            repeats: true,
          };
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${step.title} ${step.emoji || ''}`,
            body: `Your routine "${routine.title}" has a step scheduled now.`,
            data: { routineId: routine.id, stepId: step.id },
            sound: true,
          },
          trigger,
        });
      }
    }
    
    // Also schedule routine-level reminders if set
    if (routine.reminder_time && routine.active_days && Array.isArray(routine.active_days)) {
      const [hour, minute] = routine.reminder_time.split(':').map(Number);
      const DAYS_MAP: Record<string, number> = { 'Sun': 1, 'Mon': 2, 'Tue': 3, 'Wed': 4, 'Thu': 5, 'Fri': 6, 'Sat': 7 };
      
      for (const dayStr of routine.active_days) {
        const weekday = DAYS_MAP[dayStr];
        if (weekday) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Routine Reminder: ${routine.title}`,
              body: `Don't forget to complete your routine today!`,
              data: { routineId: routine.id },
              sound: true,
            },
            trigger: {
              weekday,
              hour,
              minute,
              repeats: true,
            },
          });
        }
      }
    }
  }
}
