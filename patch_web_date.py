import re

with open('app/create-event.tsx', 'r') as f:
    content = f.read()

# Add createElement import if missing
if 'createElement' not in content:
    content = content.replace("import React, { useState } from 'react';", "import React, { useState, createElement } from 'react';")

old_web = """  const renderWebDatePicker = () => (
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


new_web = """  const renderWebDatePicker = () => (
    <RNView style={styles.webDateContainer}>
      <RNView style={{ flex: 1, position: 'relative' }}>
        <Text style={[styles.microLabel, { color: theme.text }]}>{t('forms.date', 'Date')}</Text>
        {Platform.OS === 'web' && createElement('input', {
          type: 'date',
          value: format(dueDate, 'yyyy-MM-dd'),
          onChange: (e: any) => {
            const val = e.target.value;
            if (!val) return;
            const [y, m, d] = val.split('-');
            if (y && m && d && y.length === 4) {
              const newD = new Date(dueDate);
              newD.setFullYear(Number(y), Number(m) - 1, Number(d));
              if (!isNaN(newD.getTime())) setDueDate(newD);
            }
          },
          onClick: (e: any) => {
            try { e.target.showPicker(); } catch (err) {}
          },
          style: {
            padding: '14px',
            borderRadius: '14px',
            border: `1.5px solid ${theme.maroonSoft}`,
            backgroundColor: theme.background,
            color: theme.text,
            fontSize: '16px',
            cursor: 'pointer',
            width: '100%',
            boxSizing: 'border-box'
          }
        })}
        <FontAwesome name="calendar" size={16} color={theme.maroon} style={{ position: 'absolute', right: 14, top: 38, pointerEvents: 'none' }} />
      </RNView>
      <RNView style={{ flex: 1, position: 'relative' }}>
        <Text style={[styles.microLabel, { color: theme.text }]}>{t('forms.time', 'Time')}</Text>
        {Platform.OS === 'web' && createElement('input', {
          type: 'time',
          value: format(dueDate, 'HH:mm'),
          onChange: (e: any) => {
            const val = e.target.value;
            if (!val) return;
            const [h, m] = val.split(':');
            if (h && m) {
              const newD = new Date(dueDate);
              newD.setHours(Number(h), Number(m));
              if (!isNaN(newD.getTime())) setDueDate(newD);
            }
          },
          onClick: (e: any) => {
            try { e.target.showPicker(); } catch (err) {}
          },
          style: {
            padding: '14px',
            borderRadius: '14px',
            border: `1.5px solid ${theme.maroonSoft}`,
            backgroundColor: theme.background,
            color: theme.text,
            fontSize: '16px',
            cursor: 'pointer',
            width: '100%',
            boxSizing: 'border-box'
          }
        })}
        <FontAwesome name="clock-o" size={16} color={theme.maroon} style={{ position: 'absolute', right: 14, top: 38, pointerEvents: 'none' }} />
      </RNView>
    </RNView>
  );"""

content = content.replace(old_web, new_web)

# Let's also add a safety check on handleCreate for Invalid Date
old_create = """    const { data: eventData, error } = await createEventTask({
      user_id: userData.user.id,
      title,
      type,
      due_date: dueDate.toISOString(),
      priority,
      client_id_fk: (params.clientId as string) || null,
    });"""

new_create = """    
    if (isNaN(dueDate.getTime())) {
      Alert.alert('Invalid Date', 'Please select a valid date and time.');
      setLoading(false);
      return;
    }

    const { data: eventData, error } = await createEventTask({
      user_id: userData.user.id,
      title,
      type,
      due_date: dueDate.toISOString(),
      priority,
      client_id_fk: (params.clientId as string) || null,
    });"""

content = content.replace(old_create, new_create)

with open('app/create-event.tsx', 'w') as f:
    f.write(content)

