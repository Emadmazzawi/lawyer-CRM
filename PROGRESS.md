# Maroon - Development Progress

## App Overview
A top-tier productivity app built with React Native (Expo) and Supabase, focusing on advanced workflows and a polished user experience.

## Completed Features

### 1. Notifications & Sync
* Implemented local push notification scheduling.
* Created logic for syncing upcoming routine steps alerting users when tasks are due (`src/lib/notifications.ts`).

### 2. Stats & Streaks
* Added a new "Stats" tab (`app/(tabs)/stats.tsx`).
* Implemented a GitHub-style contribution heatmap to visualize activity.
* Added calculators for the user's current and longest streaks.
* Created API queries to fetch and process this data (`src/api/stats.ts`).

### 3. Routine Scheduling Enhancements
* Added database support for `day_of_week` to enable Google Calendar-style weekly views.
* Added database support for `start_time` to allow specific time-blocking for routine steps.
* Updated UI components (`AddRoutineStepModal.tsx`, `StepItem.tsx`, `RoutineCard.tsx`) to support displaying and editing these new scheduling properties.

### 4. Drag-and-Drop & UX
* Installed and integrated `react-native-draggable-flatlist`.
* Refactored `app/create-routine.tsx` to allow users to smoothly reorder their routine steps using drag-and-drop interactions.

### 5. Deep Focus (Pomodoro) Mode
* Added a specialized focus mode within the Routine Runner (`app/run-routine/[id].tsx`).
* Added a toggle switch on the routine preview screen.
* When active, "Deep Focus" mode hides the skip forward/backward controls to keep the user locked into the current task.
* Added a strict confirmation alert if the user attempts to exit a running routine prematurely while in Deep Focus mode.

## Next Steps
* Awaiting further instructions on the next major feature or polishing phase.
