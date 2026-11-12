import { Link } from 'react-router-dom';
import { Container, pill, pillGhost } from './parts';
import { PAGES, Seo } from './seo';

export function NotFoundPage() {
  return (
    <>
      <Seo page={PAGES.notFound} />
      <section className="relative overflow-hidden pb-28 pt-36 sm:pt-44">
        <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-[#D6FF66]/10 blur-[100px]" aria-hidden="true" />
        <Container className="relative text-center">
          <p className="text-[7rem] font-semibold leading-none tracking-tighter text-[#D6FF66] sm:text-[10rem]">404</p>
          <h1 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl">This page spent itself out</h1>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            The page you are looking for is not here. It may have moved, or the link may have a typo.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/" className={pill}>
              Back to home
            </Link>
            <Link to="/features" className={pillGhost}>
              See features
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
