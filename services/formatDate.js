import {
  setDefaultOptions,
  formatDistance,
  format,
  differenceInDays,
} from 'date-fns';
import { de } from 'date-fns/locale';

setDefaultOptions({ locale: de });

export const formatDateCustom = function (targetDate, options = {}) {
  const {
    threshold = 7,
    formatOptions = { addSuffix: true },
    dateFormat = 'd. MMMM yyyy',
  } = options;

  const now = new Date();
  const diffDays = differenceInDays(now, targetDate);

  // Check if the difference is within the threshold (both past and future)
  if (Math.abs(diffDays) <= threshold) {
    return formatDistance(targetDate, now, formatOptions);
  } else {
    return format(targetDate, dateFormat);
  }
};
