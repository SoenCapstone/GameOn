import {StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  
    disclaimerWrap: { marginTop: 10, alignItems: 'center' },
    disclaimer: { color: '#FFFFFF', fontSize: 12, textAlign: 'center', lineHeight: 16 },
    disclaimerEmph: { color: '#FFFFFF', fontWeight: '700' },
  
    cta: {
      alignSelf: 'center',
      width: '80%',
      backgroundColor: 'transparent',
      borderRadius: 999,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 12,
    },
    ctaText: { color: '#b6b6b6ff', fontSize: 18, fontWeight: '700' },
  
    modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#111',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  modalToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalAction: {
    color: '#4DA3FF',
    fontSize: 16,
    fontWeight: '600',
  },
  metaText: { textAlign: 'center', color: '#9CA3AF' },
  metaLink: { color: '#fff', fontWeight: '600' },
  });