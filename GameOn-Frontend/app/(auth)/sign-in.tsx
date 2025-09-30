import { authStyles } from './auth-styles';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Formik } from 'formik';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { getAuthHeroLayout } from './auth-layout';
import * as Yup from 'yup';

import { images } from '@/constants/images';
import { useAuth } from '../../contexts/auth';

type User = { name: string; birth: string; email: string; pwd: string };
const { HERO_TOP, TOP_GRADIENT_H, FORM_PADDING_TOP, RENDER_W, RENDER_H } = getAuthHeroLayout();

const SignInSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  pwd: Yup.string().min(6, 'Min 6 characters').required('Password is required'),
});

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [showPwd, setShowPwd] = useState(false);

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
        <Image source={images.logo} style={{ width: RENDER_W, height: RENDER_H }} resizeMode="contain" />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[authStyles.container, { paddingTop: FORM_PADDING_TOP }]}>
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
                    onBlur={() => handleBlur('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={touched.email && errors.email ? errors.email : undefined}
                  />

                  <LabeledInput
                    label="Password"
                    placeholder="**********"
                    value={values.pwd}
                    onChangeText={(t: string) => {
                      setStatus(undefined);        
                      setFieldValue('pwd', t);
                    }}
                    onBlur={() => handleBlur('pwd')}
                    secureTextEntry={!showPwd}
                    rightIcon={
                      <Pressable onPress={() => setShowPwd((s) => !s)} hitSlop={8}>
                        <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color="#000000" />
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
                    Don&apos;t have an account?{' '}
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
      <Text style={authStyles.label}>{label}</Text>
      <View style={[authStyles.inputWrap, error ? { borderWidth: 1, borderColor: '#EF4444' } : null]}>
        <TextInput {...inputProps} style={authStyles.input} placeholderTextColor="#FFFFFF" />
        {rightIcon ? <View style={authStyles.rightIcon}>{rightIcon}</View> : null}
      </View>
      {error ? <Text style={authStyles.errorText}>{error}</Text> : null}
    </View>
  );
}


const styles = StyleSheet.create({

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

  metaText: { textAlign: 'center', color: '#9CA3AF' },
  metaLink: { color: '#fff', fontWeight: '600' },
});