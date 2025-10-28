import { createScopedLog } from '@/utils/logger'; 
import { authStyles } from '@/constants/auth-styles';
import { Ionicons } from '@expo/vector-icons';
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
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthHeroLayout } from '@/constants/auth-layout';
import * as Yup from 'yup';

import { images } from '@/constants/images';
import { useAuth } from '../../contexts/auth';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';


type User = { firstname: string; lastname: string; birth: string; email: string; password: string };
const { HERO_TOP, TOP_GRADIENT_H, FORM_PADDING_TOP, RENDER_W, RENDER_H } = getAuthHeroLayout();

const SignInSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().min(6, 'Min 6 characters').required('Password is required'),
});

const log = createScopedLog('SignIn');

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [showPwd, setShowPwd] = useState(false);

  const loginMutation = useMutation({
  mutationFn: ({ email, password }: { email: string; password: string }) =>
    api.tokenWithPassword(email, password),
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
        <Image source={images.logo} style={{ width: RENDER_W, height: RENDER_H }} resizeMode="contain" />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[authStyles.container, { paddingTop: FORM_PADDING_TOP }]}>
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={SignInSchema}
            onSubmit={async (vals, { setSubmitting, setStatus }) => {
              const started = Date.now();
              try {
                log.debug('Sign-in attempt', { email: vals.email });

                const { accessToken } = await loginMutation.mutateAsync({
                  email: vals.email.trim(),
                  password: vals.password,
                });

                await signIn(accessToken); 
                log.info('Sign-in success', { email: vals.email, ms: Date.now() - started });
              } catch (e: any) {
                log.error('Sign-in failed', { email: vals.email, error: String(e?.message || e) });
                setStatus(e?.message || 'Invalid email or password');
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
                    value={values.password}
                    onChangeText={(t: string) => {
                      setStatus(undefined);        
                      setFieldValue('password', t);
                    }}
                    onBlur={() => handleBlur('password')}
                    secureTextEntry={!showPwd}
                    rightIcon={
                      <Pressable onPress={() => setShowPwd((s) => !s)} hitSlop={8}>
                        <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color="#000000" />
                      </Pressable>
                    }
                    error={touched.password && errors.password ? errors.password : undefined}
                  />

                  <Pressable onPress={() => { /* forgot password flow */ }} style={styles.forgotWrap}>
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
                  disabled={isSubmitting || loginMutation.isPending}
                  style={({ pressed }) => [
                    styles.cta,
                    (pressed || isSubmitting || loginMutation.isPending) && { opacity: 0.85 },
                    (isSubmitting || loginMutation.isPending) && { opacity: 0.6 },
                  ]}
                >
                  {(isSubmitting || loginMutation.isPending)
                    ? <ActivityIndicator />
                    : <Text style={styles.ctaText}>Log In</Text>}
                </Pressable>

                <View style={{ marginTop: 'auto' }}>
                  <Text style={styles.metaText}>
                    Don&apos;t have an account?{' '}
                    <Link href="/(auth)/sign-up" style={styles.metaLink}>
                      Sign Up
                    </Link>
                  </Text>
                </View>


                
                {/*To test user profile*/}
                <View style={{ marginTop: 'auto' }}>
                  <Text style={styles.metaText}>
                    go to profile{' '}
                    <Link href="/(auth)/userProfile" style={styles.metaLink}>
                      here
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
function LabeledInput({ label, rightIcon, error, ...inputProps }: Readonly<LabeledInputProps>) {
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