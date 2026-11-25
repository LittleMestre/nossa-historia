import { useTheme } from './theme'
export function usePalette() {
  const { dark } = useTheme()
  return dark
    ? {
        bg: '#101d24',
        card: '#1a2b34',
        ink: '#f4f0e8',
        muted: '#a9bcc0',
        border: '#30434a',
        accent: '#d0e4e2',
        warm: '#daa483',
        soft: '#243c46',
      }
    : {
        bg: '#f8f6f1',
        card: '#fffefa',
        ink: '#183744',
        muted: '#61747a',
        border: '#e8e6de',
        accent: '#21495a',
        warm: '#c9815f',
        soft: '#e9f0ef',
      }
}
