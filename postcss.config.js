import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

export default {
  plugins: [
    autoprefixer({
      // Define your target browsers
      overrideBrowserslist: ['> 1%', 'last 2 versions', 'not dead'],
    }),
    cssnano({
      preset: 'default',
    }),
  ],
};
