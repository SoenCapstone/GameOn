import { StyleSheet } from 'react-native';

export const authStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0 },

  hero: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
    pointerEvents: 'none',
  },

  container: { flex: 1, paddingHorizontal: 24, gap: 20 },

  label: { color: '#fff', fontSize: 14, fontWeight: '600' },

  inputWrap: {
    backgroundColor: '#787878',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1, fontSize: 16, color: '#111' },
  rightIcon: { marginLeft: 8 },

  errorText: { color: '#EF4444', fontSize: 12 },
});
