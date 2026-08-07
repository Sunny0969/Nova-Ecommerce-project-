import { useEffect } from 'react';
import { scheduleDeferredThirdPartyScripts } from '../lib/thirdPartyScripts';

export default function DeferredThirdPartyScripts() {
  useEffect(() => scheduleDeferredThirdPartyScripts(), []);
  return null;
}
