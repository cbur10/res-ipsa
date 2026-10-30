import { BAILEY_INNER } from './assets/art';
export const Bailey = ({ size = 60, cls = '' }: { size?: number; cls?: string }) =>
  <svg className={cls} viewBox="0 0 120 120" width={size} height={size} dangerouslySetInnerHTML={{ __html: BAILEY_INNER }} />;
export const Gil = ({ size = 90, cls = '' }: { size?: number; cls?: string }) => (
  <svg className={cls} viewBox="0 0 120 120" width={size} height={size}>
    <rect x="52" y="52" width="12" height="60" rx="5" fill="#a0612b" transform="rotate(-35 58 82)" />
    <rect x="22" y="22" width="70" height="34" rx="10" fill="#7a4520" transform="rotate(-35 57 39)" />
    <rect x="18" y="26" width="10" height="34" rx="4" fill="#f2b632" transform="rotate(-35 57 39)" />
    <rect x="86" y="18" width="10" height="34" rx="4" fill="#f2b632" transform="rotate(-35 57 39)" />
    <circle cx="48" cy="44" r="5" fill="#fff" /><circle cx="66" cy="32" r="5" fill="#fff" />
    <circle cx="49" cy="45" r="2.4" fill="#2b1b10" /><circle cx="67" cy="33" r="2.4" fill="#2b1b10" />
    <path d="M52 54q10 2 16-8" stroke="#2b1b10" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </svg>);
