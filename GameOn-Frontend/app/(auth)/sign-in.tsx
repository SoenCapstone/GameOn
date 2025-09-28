import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Formik } from 'formik';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Yup from 'yup';

import { images } from '@/constants/images';
import { useAuth } from '../../contexts/auth';

type User = { name: string; birth: string; email: string; pwd: string };

const { width: SCREEN_W } = Dimensions.get('window');
const LOGO_W = 2000;
const LOGO_H = 1900;
const SCALE = Math.min((SCREEN_W * 0.8) / LOGO_W, 1);
const RENDER_W = LOGO_W * SCALE;
const RENDER_H = LOGO_H * SCALE;

const HERO_TOP = 1;
const FORM_PADDING_TOP = HERO_TOP + RENDER_H * 0.55;
const TOP_GRADIENT_H = HERO_TOP + RENDER_H + 40;

const SignInSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  pwd: Yup.string().min(6, 'Min 6 characters').required('Password is required'),
});

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [showPwd, setShowPwd] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={['#1473B7', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.topGradient, { height: TOP_GRADIENT_H }]}
        pointerEvents="none"
      />

      <View style={[styles.hero, { top: HERO_TOP }]}>
        <Image source={images.logo} style={{ width: RENDER_W, height: RENDER_H }} resizeMode="contain" />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.container, { paddingTop: FORM_PADDING_TOP }]}>
          <Formik
            initialValues={{ email: '', pwd: '' }}
            validationSchema={SignInSchema}
            onSubmit={async (vals, { setSubmitting, setStatus }) => {
              try {
                const raw = await AsyncStorage.getItem('users');
                const list: User[] = raw ? JSON.parse(raw) : [];
                const match = list.find(
                  (u) =>
                    u.email.trim().toLowerCase() === vals.email.trim().toLowerCase() &&
                    u.pwd === vals.pwd
                );
                if (match) {
                  await signIn('demo-token');
                } else {
                  setStatus('Invalid email or password');
                }
              } catch {
                setStatus('Sign in failed. Please try again.');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({
              values,
              errors,
              touched,
              handleBlur,
              handleSubmit,
              isSubmitting,
              status,
              setStatus,
              setFieldValue,
            }) => (
              <>
                
                <View style={{ gap: 16 }}>
                  <LabeledInput
                    label="Email"
                    placeholder="example@example.com"
                    value={values.email}
                    onChangeText={(t: string) => {
                      setStatus(undefined);        
                      setFieldValue('email', t);
                    }}
                    onBlur={handleBlur('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={touched.email && errors.email ? errors.email : undefined}
                  />

                  <LabeledInput
                    label="Password"
                    placeholder="••••••••••••"
                    value={values.pwd}
                    onChangeText={(t: string) => {
                      setStatus(undefined);        
                      setFieldValue('pwd', t);
                    }}
                    onBlur={handleBlur('pwd')}
                    secureTextEntry={!showPwd}
                    rightIcon={
                      <Pressable onPress={() => setShowPwd((s) => !s)} hitSlop={8}>
                        <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
                      </Pressable>
                    }
                    error={touched.pwd && errors.pwd ? errors.pwd : undefined}
                  />

                  <Pressable onPress={() => { /* TODO: forgot password flow */ }} style={styles.forgotWrap}>
                    <Text style={styles.forgotText}>Forgot Password</Text>
                  </Pressable>
                </View>

                {status ? (
                  <View style={styles.statusBox}>
                    <Text style={styles.statusText}>{status}</Text>
                  </View>
                ) : null}

                <Pressable
                  onPress={() => handleSubmit()}
                  disabled={isSubmitting}
                  style={({ pressed }) => [
                    styles.cta,
                    (pressed || isSubmitting) && { opacity: 0.85 },
                    isSubmitting && { opacity: 0.6 },
                  ]}
                >
                  {isSubmitting ? <ActivityIndicator /> : <Text style={styles.ctaText}>Log In</Text>}
                </Pressable>

                <View style={{ marginTop: 'auto' }}>
                  <Text style={styles.metaText}>
                    Don’t have an account?{' '}
                    <Link href="/(auth)/sign-up" style={styles.metaLink}>
                      Sign Up
                    </Link>
                  </Text>
                </View>
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
function LabeledInput({ label, rightIcon, error, ...inputProps }: LabeledInputProps) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error ? { borderWidth: 1, borderColor: '#EF4444' } : null]}>
        <TextInput {...inputProps} style={styles.input} placeholderTextColor="#9CA3AF" />
        {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}


const styles = StyleSheet.create({
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
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1, fontSize: 16, color: '#111' },
  rightIcon: { marginLeft: 8 },

  forgotWrap: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: { color: '#D1D5DB', fontSize: 12 },


  statusBox: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#7F1D1D', 
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  statusText: {
    color: '#FCA5A5',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },

  cta: {
    alignSelf: 'center',
    width: '50%',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaText: { color: '#111', fontSize: 18, fontWeight: '700' },

  errorText: { color: '#EF4444', fontSize: 12 },

  metaText: { textAlign: 'center', color: '#9CA3AF' },
  metaLink: { color: '#fff', fontWeight: '600' },
});
