import { Dimensions } from 'react-native';

export type AuthHeroLayout = {
  HERO_TOP: number;
  TOP_GRADIENT_H: number;
  FORM_PADDING_TOP: number;
  RENDER_W: number;
  RENDER_H: number;
};

const LOGO_W = 2000;
const LOGO_H = 1900;

export function getAuthHeroLayout(
  screenWidth = Dimensions.get('window').width
): AuthHeroLayout {
  const SCALE = Math.min((screenWidth * 0.8) / LOGO_W, 1);
  const RENDER_W = LOGO_W * SCALE;
  const RENDER_H = LOGO_H * SCALE;
  
  const HERO_TOP = 1;
  const FORM_PADDING_TOP = HERO_TOP + RENDER_H * 0.55;
  const TOP_GRADIENT_H = HERO_TOP + RENDER_H + 40;


  return { HERO_TOP, TOP_GRADIENT_H, FORM_PADDING_TOP, RENDER_W, RENDER_H };
}

