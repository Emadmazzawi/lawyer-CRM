import re

with open('app/create-event.tsx', 'r') as f:
    content = f.read()

# Let's replace the DateTimePicker props to handle display nicely

old_dtp = """      {showPicker && (
        <DateTimePicker
          value={dueDate}
          mode={pickerMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
          textColor={theme.text}
        />
      )}"""

new_dtp = """      {showPicker && (
        <DateTimePicker
          value={dueDate}
          mode={pickerMode}
          display={
            pickerMode === 'date' 
              ? (Platform.OS === 'ios' ? 'inline' : 'calendar') 
              : 'spinner'
          }
          onChange={onDateChange}
          minimumDate={new Date()}
          textColor={theme.text}
        />
      )}"""

content = content.replace(old_dtp, new_dtp)

with open('app/create-event.tsx', 'w') as f:
    f.write(content)

