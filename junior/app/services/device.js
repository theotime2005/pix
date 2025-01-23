import Service from '@ember/service';

const MOBILE_MAX_HEIGHT = 720;
const MOBILE_MAX_WIDTH = 540;
const TABLET_MAX_HEIGHT = 1366;
const TABLET_MAX_WIDTH = 1024;

export const types = {
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
  TABLET: 'tablet',
};

const PORTRAIT = 'portrait';
const LANDSCAPE = 'landscape';

export class Orientation {
  constructor(type) {
    this.type = type;
  }

  isPortrait() {
    return this.type.startsWith(PORTRAIT);
  }

  isLandscape() {
    return this.type.startsWith(LANDSCAPE);
  }
}

export default class DeviceService extends Service {
  get info() {
    let orientationType = screen.orientation?.type;
    if (!orientationType) {
      orientationType = screen.width > screen.height ? LANDSCAPE : PORTRAIT;
    }
    const orientation = new Orientation(orientationType);

    return {
      orientation,
      type: this.#getType(orientation),
    };
  }

  addOrientationChangeListener(handler) {
    screen.orientation?.addEventListener('change', handler);
  }

  #getType(orientation) {
    if (orientation.isLandscape()) {
      if (screen.width >= TABLET_MAX_HEIGHT) {
        return types.DESKTOP;
      }
      if (screen.width >= MOBILE_MAX_HEIGHT && screen.height >= MOBILE_MAX_WIDTH) {
        return types.TABLET;
      }
      return types.MOBILE;
    } else {
      if (screen.width >= TABLET_MAX_WIDTH) {
        return types.DESKTOP;
      }
      if (screen.width >= MOBILE_MAX_WIDTH) {
        return types.TABLET;
      }
      return types.MOBILE;
    }
  }
}
