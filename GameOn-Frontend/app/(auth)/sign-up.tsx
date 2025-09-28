import { images } from '@/constants/images';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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


const dobRegex =
  /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d\d$/; // DD/MM/YYYY

const isValidCalendarDate = (value?: string) => {
  if (!value || !dobRegex.test(value)) return false;
  const [dd, mm, yyyy] = value.split('/').map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  // Check that JS date didn't overflow (e.g., 31/02/2024)
  const matches =
    d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
  if (!matches) return false;
  // Must be in the past (not today or future)
  const today = new Date();
  const endOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
  );
  return d < endOfToday;
};


const SignUpSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, 'Enter your full name')
    .required('Full name is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  pwd: Yup.string().min(6, 'Min 6 characters').required('Password is required'),
  birth: Yup.string()
    .required('Date of birth is required')
    .test('dob-format', 'Use DD/MM/YYYY', v => (v ? dobRegex.test(v) : false))
    .test('dob-valid', 'Enter a valid past date', v => isValidCalendarDate(v)),
});

export default function SignUpScreen() {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [loadingSeed, setLoadingSeed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingSeed(true);
        const raw = await AsyncStorage.getItem('users');
        if (!raw) {
          await AsyncStorage.setItem('users', JSON.stringify([] as User[]));
        }
      } catch (e) {
        console.warn('Seed users error:', e);
      } finally {
        setLoadingSeed(false);
      }
    })();
  }, []);

  const handleSaveAndGo = async (values: User) => {
    try {
      const raw = await AsyncStorage.getItem('users');
      const list: User[] = raw ? JSON.parse(raw) : [];
      list.push(values);
      await AsyncStorage.setItem('users', JSON.stringify(list));
      router.replace('/(auth)/sign-in');
    } catch (e) {
      Alert.alert('Error', 'Could not save your account locally.');
      console.warn('Save error:', e);
    }
  };

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
        <View style={[styles.container, { paddingTop: FORM_PADDING_TOP }]}>
          <Formik<User>
            initialValues={{ name: '', birth: '', email: '', pwd: '' }}
            validationSchema={SignUpSchema}
            onSubmit={async (vals, { setSubmitting }) => {
              await handleSaveAndGo(vals);
              setSubmitting(false);
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
                    label="Full name"
                    placeholder="john doe"
                    value={values.name}
                    onChangeText={handleChange('name')}
                    onBlur={handleBlur('name')}
                    autoCapitalize="words"
                    error={touched.name && errors.name ? errors.name : undefined}
                  />

                  <LabeledInput
                    label="Password"
                    placeholder="••••••••••••"
                    value={values.pwd}
                    onChangeText={handleChange('pwd')}
                    onBlur={handleBlur('pwd')}
                    secureTextEntry={!showPwd}
                    rightIcon={
                      <Pressable onPress={() => setShowPwd(s => !s)} hitSlop={8}>
                        <Ionicons
                          name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color="#6B7280"
                        />
                      </Pressable>
                    }
                    error={touched.pwd && errors.pwd ? errors.pwd : undefined}
                  />

                  <LabeledInput
                    label="Email"
                    placeholder="example@example.com"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={touched.email && errors.email ? errors.email : undefined}
                  />

                  <LabeledInput
                    label="Date Of Birth"
                    placeholder="DD/MM/YYYY"
                    value={values.birth}
                    onChangeText={text => {
                      const cleaned = text.replace(/\s+/g, '');
                      setFieldValue('birth', cleaned);
                    }}
                    onBlur={handleBlur('birth')}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    error={touched.birth && errors.birth ? errors.birth : undefined}
                  />
                </View>

                <View style={styles.disclaimerWrap}>
                  <Text style={styles.disclaimer}>
                    By continuing, you agree to{'\n'}
                    <Text style={styles.disclaimerEmph}>Terms of Use</Text> and{' '}
                    <Text style={styles.disclaimerEmph}>Privacy Policy</Text>.
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleSubmit()}
                  disabled={isSubmitting || loadingSeed}
                  style={({ pressed }) => [
                    styles.cta,
                    (pressed || isSubmitting) && { opacity: 0.85 },
                    (isSubmitting || loadingSeed) && { opacity: 0.6 },
                  ]}
                >
                  {isSubmitting || loadingSeed ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={styles.ctaText}>Sign Up</Text>
                  )}
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
}: LabeledInputProps) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputWrap,
        error ? { borderWidth: 1, borderColor: '#EF4444' } : null,
      ]}>
        <TextInput
          {...inputProps}
          style={styles.input}
          placeholderTextColor="#9CA3AF"
        />
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

  errorText: { color: '#EF4444', fontSize: 12 },

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
});
