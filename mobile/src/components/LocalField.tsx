import { Text, TextInput, View, type TextInputProps } from 'react-native'
import { usePalette } from './ui'
export function LocalField({
  label,
  ...props
}: TextInputProps & { label: string }) {
  const c = usePalette()
  return (
    <View style={{ gap: 5, marginVertical: 5 }}>
      <Text style={{ color: c.ink }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        {...props}
        style={{
          backgroundColor: c.card,
          color: c.ink,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 12,
          padding: 12,
          minHeight: 44,
        }}
      />
    </View>
  )
}
