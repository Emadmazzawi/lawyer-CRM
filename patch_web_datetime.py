import re

with open('app/create-event.tsx', 'r') as f:
    content = f.read()

# For the web inputs, we'll keep them as `type="date"` and `type="time"`, which native browsers handle by popping up their built-in calendar and time scrollers. But we can ensure they are clickable everywhere. 

# Let's adjust the styling so they have padding and click areas like the native buttons.
old_web = """  const renderWebDatePicker = () => (
    <RNView style={styles.webDateContainer}>
      <RNView style={{ flex: 1 }}>
        <Text style={[styles.microLabel, { color: theme.text }]}>{t('forms.date', 'Date')}</Text>
        <TextInput
          style={[styles.webInput, { color: theme.text, borderColor: theme.maroonSoft, backgroundColor: theme.background }]}
          // @ts-ignore
          type="date"
          value={format(dueDate, 'yyyy-MM-dd')}
          onChangeText={(val) => {
            if (val) {
              const [y, m, d] = val.split('-');
              const newD = new Date(dueDate);
              if (y && m && d) {
                newD.setFullYear(Number(y), Number(m)-1, Number(d));
                setDueDate(newD);
              }
            }
          }}
        />
      </RNView>
      <RNView style={{ flex: 1 }}>
        <Text style={[styles.microLabel, { color: theme.text }]}>{t('forms.time', 'Time')}</Text>
        <TextInput
          style={[styles.webInput, { color: theme.text, borderColor: theme.maroonSoft, backgroundColor: theme.background }]}
          // @ts-ignore
          type="time"
          value={format(dueDate, 'HH:mm')}
          onChangeText={(val) => {
            if (val) {
              const [h, m] = val.split(':');
              const newD = new Date(dueDate);
              if (h && m) {
                newD.setHours(Number(h), Number(m));
                setDueDate(newD);
              }
            }
          }}
        />
      </RNView>
    </RNView>
  );"""

new_web = """  const renderWebDatePicker = () => (
    <RNView style={styles.webDateContainer}>
      <RNView style={{ flex: 1, position: 'relative' }}>
        <Text style={[styles.microLabel, { color: theme.text }]}>{t('forms.date', 'Date')}</Text>
        <TextInput
          style={[
            styles.webInput, 
            { color: theme.text, borderColor: theme.maroonSoft, backgroundColor: theme.background, cursor: 'pointer' }
          ]}
          // @ts-ignore
          type="date"
          value={format(dueDate, 'yyyy-MM-dd')}
          onChangeText={(val) => {
            if (val) {
              const [y, m, d] = val.split('-');
              const newD = new Date(dueDate);
              if (y && m && d) {
                newD.setFullYear(Number(y), Number(m)-1, Number(d));
                setDueDate(newD);
              }
            }
          }}
        />
        <FontAwesome name="calendar" size={16} color={theme.maroon} style={{ position: 'absolute', right: 14, top: 38, pointerEvents: 'none' }} />
      </RNView>
      <RNView style={{ flex: 1, position: 'relative' }}>
        <Text style={[styles.microLabel, { color: theme.text }]}>{t('forms.time', 'Time')}</Text>
        <TextInput
          style={[
            styles.webInput, 
            { color: theme.text, borderColor: theme.maroonSoft, backgroundColor: theme.background, cursor: 'pointer' }
          ]}
          // @ts-ignore
          type="time"
          value={format(dueDate, 'HH:mm')}
          onChangeText={(val) => {
            if (val) {
              const [h, m] = val.split(':');
              const newD = new Date(dueDate);
              if (h && m) {
                newD.setHours(Number(h), Number(m));
                setDueDate(newD);
              }
            }
          }}
        />
        <FontAwesome name="clock-o" size={16} color={theme.maroon} style={{ position: 'absolute', right: 14, top: 38, pointerEvents: 'none' }} />
      </RNView>
    </RNView>
  );"""

content = content.replace(old_web, new_web)

with open('app/create-event.tsx', 'w') as f:
    f.write(content)

