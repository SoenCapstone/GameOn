import { createScopedLog } from '@/utils/logger'; 
import DateTimePicker from '@react-native-community/datetimepicker';
import { authStyles } from '@/constants/auth-styles';
import { images } from '@/constants/images';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import {
  Linking,
  ActivityIndicator,
  Alert,
  ToastAndroid,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthHeroLayout } from '@/constants/auth-layout';
import * as Yup from 'yup';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';


type User = { firstname: string; lastname: string; birth: string; email: string; password: string };
const { HERO_TOP, TOP_GRADIENT_H, FORM_PADDING_TOP, RENDER_W, RENDER_H } = getAuthHeroLayout();

const POLICY_URL =
  'https://github.com/SoenCapstone/GameOn/wiki/User-consent-and-end%E2%80%90user-license-agreement';

const openPolicy = async () => {
  const ok = await Linking.canOpenURL(POLICY_URL);
  if (ok) {
    await Linking.openURL(POLICY_URL);
  } else {
    Alert.alert('Unable to open link', POLICY_URL);
  }
};

const log = createScopedLog('SignUp');

const SignUpSchema = Yup.object({
  firstname: Yup.string()
    .trim()
    .min(2, 'Enter your first name')
    .required('First name is required'),
  lastname: Yup.string()
    .trim()
    .min(2, 'Enter your last name')
    .required('Last name is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().min(6, 'Min 6 characters').required('Password is required'),
  birth: Yup.string()
  .required('Date of birth is required')
  .test('dob-valid', 'Enter a valid past date', v => {
    if (!v) return false;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    return d < today; 
  }),
});

export default function SignUpScreen() {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [showDob, setShowDob] = useState(false);

const signUpMutation = useMutation({
  mutationFn: (body: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
  }) => api.postJSON('/api/v1/user/create', body),
});

  return (
    <SafeAreaView style={authStyles.safe}>
      <LinearGradient
        colors={['#1473B7', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[authStyles.topGradient, { height: TOP_GRADIENT_H }]}
        pointerEvents="none"
      />

      <View style={[authStyles.hero, { top: HERO_TOP }]}>
        <Image
          source={images.logo}
          style={{ width: RENDER_W, height: RENDER_H }}
          resizeMode="contain"
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[authStyles.container, { paddingTop: FORM_PADDING_TOP }]}>
          <Formik<User>
            initialValues={{ firstname: '', lastname: '', birth: new Date().toISOString(), email: '', password: '' }}
            validationSchema={SignUpSchema}
            onSubmit={async (vals, { setSubmitting }) => {
              try {
                await signUpMutation.mutateAsync({
                  firstname: vals.firstname.trim(),
                  lastname: vals.lastname.trim(),
                  email: vals.email.trim(),
                  password: vals.password,
                });

                log.info('Account successfully created', { email: vals.email });

                if (Platform.OS === 'android') {
                  ToastAndroid.show('Account successfully created', ToastAndroid.SHORT);
                } else {
                  Alert.alert('Success', 'Account successfully created');
                }

                router.replace('/(auth)/sign-in');
              } catch (e: any) {
                log.error('Sign-up failed', e);
                Alert.alert('Error', e?.message || 'Sign-up failed, please try again.');
              } finally {
                setSubmitting(false);
              }
            }}

          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              setFieldValue,
              handleSubmit,
              isSubmitting,
            }) => (
              <>
                <View style={{ gap: 16 }}>
                  <LabeledInput
                    label="First name"
                    placeholder="john"
                    value={values.firstname}
                    onChangeText={handleChange('firstname')}
                    onBlur={() => handleBlur('firstname')}
                    autoCapitalize="words"
                    error={touched.firstname && errors.firstname ? errors.firstname : undefined}
                  />

                  <LabeledInput
                    label="Last name"
                    placeholder="doe"
                    value={values.lastname}
                    onChangeText={handleChange('lastname')}
                    onBlur={() => handleBlur('lastname')}
                    autoCapitalize="words"
                    error={touched.lastname && errors.lastname ? errors.lastname : undefined}
                  />

                  <LabeledInput
                    label="Password"
                    placeholder="••••••••••••"
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={() => handleBlur('password')}
                    secureTextEntry={!showPwd}
                    rightIcon={
                      <Pressable onPress={() => setShowPwd(s => !s)} hitSlop={8}>
                        <Ionicons
                          name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color="#000000"
                        />
                      </Pressable>
                    }
                    error={touched.password && errors.password ? errors.password : undefined}
                  />

                  <LabeledInput
                    label="Email"
                    placeholder="example@example.com"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={() => handleBlur('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={touched.email && errors.email ? errors.email : undefined}
                  />

                <View style={{ gap: 8 }}>
                  <Text style={authStyles.label}>Date Of Birth</Text>

                  
                  <Pressable onPress={() => setShowDob(true)} style={authStyles.inputWrap}>
                    <Text style={{ color: '#fff', opacity: 0.85 }}>
                      {(() => {
                        const d = new Date(values.birth);
                        return Number.isNaN(d.getTime())
                          ? 'Select your date of birth'
                          : d.toLocaleDateString();
                      })()}
                    </Text>
                  </Pressable>

                  
                  {Platform.OS === 'ios' && (
                    <Modal visible={showDob} animationType="slide" transparent>
                      
                      <Pressable style={styles.modalBackdrop} onPress={() => setShowDob(false)} />

                      
                      <View style={styles.modalSheet}>
                        <View style={styles.modalToolbar}>
                          <Pressable onPress={() => setShowDob(false)}>
                            <Text style={styles.modalAction}>Cancel</Text>
                          </Pressable>
                          <Text style={styles.modalTitle}>Select Date</Text>
                          <Pressable onPress={() => setShowDob(false)}>
                            <Text style={styles.modalAction}>Done</Text>
                          </Pressable>
                        </View>

                        <DateTimePicker
                          mode="date"
                          display="spinner" 
                          value={
                            values.birth && !Number.isNaN(new Date(values.birth).getTime())
                              ? new Date(values.birth)
                              : new Date()
                          }
                          maximumDate={new Date()}
                          onChange={(_, date) => {
                            if (date) setFieldValue('birth', date.toISOString());
                          }}
                          style={{ width: '100%' }}
                        />
                      </View>
                    </Modal>
                  )}

                  
                  {Platform.OS === 'android' && showDob && (
                    <DateTimePicker
                      mode="date"
                      display="calendar"
                      value={
                        values.birth && !Number.isNaN(new Date(values.birth).getTime())
                          ? new Date(values.birth)
                          : new Date()
                      }
                      maximumDate={new Date()}
                      onChange={(_, date) => {
                        setShowDob(false); 
                        if (date) setFieldValue('birth', date.toISOString());
                      }}
                    />
                  )}

                  {touched.birth && errors.birth ? (
                    <Text style={authStyles.errorText}>{errors.birth}</Text>
                  ) : null}
                </View>



                </View>

                <View style={styles.disclaimerWrap}>
                  <Text style={styles.disclaimer}>
                    By continuing, you agree to{'\n'}
                    <Text
                      style={styles.disclaimerEmph}
                      onPress={openPolicy}
                      accessibilityRole="link"
                    >
                      Terms of Use
                    </Text>{' '}
                    and{' '}
                    <Text
                      style={styles.disclaimerEmph}
                      onPress={openPolicy}
                      accessibilityRole="link"
                    >
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                </View>

                <Pressable
                onPress={() => handleSubmit()}
                disabled={isSubmitting || signUpMutation.isPending}
                style={({ pressed }) => [
                  styles.cta,
                  (pressed || isSubmitting || signUpMutation.isPending) && { opacity: 0.85 },
                  (isSubmitting || signUpMutation.isPending) && { opacity: 0.6 },
                ]}
              >
                {(isSubmitting || signUpMutation.isPending)
                  ? <ActivityIndicator />
                  : <Text style={styles.ctaText}>Sign Up</Text>}
              </Pressable>

              </>
            )}
          </Formik>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type LabeledInputProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (t: string) => void;
  onBlur?: () => void;
  keyboardType?: any;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  rightIcon?: React.ReactNode;
  error?: string;
};
function LabeledInput({
  label,
  rightIcon,
  error,
  ...inputProps
}: Readonly<LabeledInputProps>) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={authStyles.label}>{label}</Text>
      <View style={[
        authStyles.inputWrap,
        error ? { borderWidth: 1, borderColor: '#EF4444' } : null,
      ]}>
        <TextInput
          {...inputProps}
          style={authStyles.input}
          placeholderTextColor="#FFFFFF"
        />
        {rightIcon ? <View style={authStyles.rightIcon}>{rightIcon}</View> : null}
      </View>
      {error ? <Text style={authStyles.errorText}>{error}</Text> : null}
    </View>
  );
}


const styles = StyleSheet.create({

  disclaimerWrap: { marginTop: 10, alignItems: 'center' },
  disclaimer: { color: '#FFFFFF', fontSize: 12, textAlign: 'center', lineHeight: 16 },
  disclaimerEmph: { color: '#FFFFFF', fontWeight: '700' },

  cta: {
    alignSelf: 'center',
    width: '50%',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  ctaText: { color: '#111', fontSize: 18, fontWeight: '700' },

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
});
