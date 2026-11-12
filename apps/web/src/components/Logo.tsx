type LogoProps = {
  /** Show only the W wallet mark (app icon, tight spaces). */
  markOnly?: boolean;
  className?: string;
};

/** Uses the supplied brand files from /assets, cropped to content. Heights are set so both sit at the same optical size. */
export function Logo({ markOnly = false, className = '' }: LogoProps) {
  return markOnly ? (
    <img
      src="/brand/mark.png"
      alt="WalletWise"
      width={640}
      height={417}
      draggable={false}
      className={`${/\bh-/.test(className) ? '' : 'h-8'} w-auto shrink-0 self-start select-none ${className}`}
    />
  ) : (
    <img
      src="/brand/wordmark.png"
      alt="WalletWise"
      width={1000}
      height={191}
      draggable={false}
      className={`${/\bh-/.test(className) ? '' : 'h-9'} w-auto shrink-0 self-start select-none ${className}`}
    />
  );
}
