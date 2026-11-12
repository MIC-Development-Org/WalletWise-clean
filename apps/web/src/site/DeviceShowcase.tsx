import { Reveal } from '../components/Reveal';
import { Container, Heading } from './parts';

/**
 * One account on every device. These are screenshots of the real app on a MacBook, an iPad and an iPhone,
 * laid out the way you would see them on a desk: laptop in the middle, tablet and phone overlapping the sides.
 */
export function DeviceShowcase() {
  return (
    <section className="overflow-hidden py-16 lg:py-20">
      <Container>
        <Reveal>
          <Heading
            title="Your money, on every device you own"
            sub="Install it on your laptop, tablet and phone. It is the same account and the same app, laid out for each screen."
          />
        </Reveal>
      </Container>

      <Reveal>
        <div className="relative mx-auto mt-14 max-w-5xl px-5 pb-6">
          <div className="pointer-events-none absolute inset-x-16 top-1/3 bottom-0 rounded-full bg-lime/[0.06] blur-[100px]" aria-hidden="true" />
          <img
            src="/screens/laptop.webp"
            alt="WalletWise on a MacBook: safe to spend today, recent activity and a daily spending chart"
            width={2000}
            height={1149}
            loading="lazy"
            decoding="async"
            className="relative mx-auto w-full drop-shadow-[0_40px_60px_rgb(0_0_0/0.55)] md:w-[80%]"
          />
          <img
            src="/screens/tablet.png"
            alt="WalletWise on an iPad"
            width={1162}
            height={1754}
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute bottom-0 left-0 hidden w-[23%] drop-shadow-[0_30px_40px_rgb(0_0_0/0.6)] md:block"
          />
          <img
            src="/screens/phone.webp"
            alt="WalletWise on an iPhone with the bottom tab bar and the add button"
            width={932}
            height={1840}
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute right-2 bottom-0 w-[27%] drop-shadow-[0_30px_40px_rgb(0_0_0/0.6)] md:right-0 md:w-[19%]"
          />
        </div>
      </Reveal>
    </section>
  );
}
