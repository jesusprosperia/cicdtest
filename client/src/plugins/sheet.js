import loadSheet from '@/utils/sheet-loader';

import { SHEET_URL } from '@/config/env';

export default function () {
  return loadSheet(SHEET_URL);
}