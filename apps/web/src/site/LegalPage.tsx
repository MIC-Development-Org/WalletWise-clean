import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Container } from './parts';
import { PAGES, Seo, type PageMeta } from './seo';

const UPDATED = '13 November 2026';
const CONTACT = 'https://github.com/PRODHOSH/WalletWise/issues';

type Section = { id: string; title: string; body: ReactNode };

function LegalLayout({ meta, title, intro, sections }: { meta: PageMeta; title: string; intro: ReactNode; sections: Section[] }) {
  return (
    <>
      <Seo page={meta} />
      <section className="pb-24 pt-32 sm:pt-40">
        <Container>
          <header className="mx-auto max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-widest text-[#D6FF66]">Legal</p>
            <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-3 text-sm text-white/50">Last updated {UPDATED}</p>
            <p className="mt-6 text-lg leading-8 text-white/70">{intro}</p>
          </header>

          <div className="mx-auto mt-12 grid max-w-3xl gap-10 lg:max-w-5xl lg:grid-cols-[14rem_1fr] lg:gap-14">
            <nav aria-label="On this page" className="hidden lg:block">
              <ol className="sticky top-28 space-y-2.5 text-sm text-white/50">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="transition-colors hover:text-[#D6FF66]">
                      {i + 1}. {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="space-y-12">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-28">
                  <h2 className="text-2xl font-medium tracking-tight">
                    {i + 1}. {s.title}
                  </h2>
                  <div className="mt-4 space-y-4 leading-7 text-white/70 [&_a]:text-[#D6FF66] [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                    {s.body}
                  </div>
                </section>
              ))}
              <p className="border-t border-white/10 pt-6 text-sm text-white/50">
                See also the <Link to={meta.path === '/privacy' ? '/terms' : '/privacy'} className="text-[#D6FF66] underline-offset-4 hover:underline">{meta.path === '/privacy' ? 'Terms of Service' : 'Privacy Policy'}</Link>.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

const issues = (
  <a href={CONTACT} target="_blank" rel="noreferrer">
    open an issue on our GitHub repository
  </a>
);

export function PrivacyPage() {
  return (
    <LegalLayout
      meta={PAGES.privacy}
      title="Privacy Policy"
      intro="WalletWise is built by students for students, and it is designed to collect as little as it can. This page explains what we collect, what never leaves your phone, and the choices you have."
      sections={[
        {
          id: 'who',
          title: 'Who we are',
          body: (
            <p>
              WalletWise is made by Undercut Engineers, Team G of the Microsoft Innovations Club at VIT Chennai. It is a student project. In this policy, "we" means that team.
            </p>
          ),
        },
        {
          id: 'collect',
          title: 'What we collect',
          body: (
            <>
              <p>Only what the app needs to work:</p>
              <ul>
                <li>Your account: name, email address and a password hash. We never store your password itself.</li>
                <li>An optional profile photo, if you add one in Settings.</li>
                <li>Transactions you add or confirm: amount, category, merchant, account type, time and any note you write.</li>
                <li>Budgets, savings goals and your allowance cycle settings.</li>
                <li>Sync details such as record versions and timestamps, so the same entry is never saved twice.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'sms',
          title: 'Bank SMS stays on your phone',
          body: (
            <>
              <p>
                On Android, the app reads bank messages on the phone. It only looks at messages from known bank sender IDs, so OTPs and personal chats are not read.
              </p>
              <p>
                The message is parsed on your device. The raw text is never uploaded. Only the extracted fields go to our server: the amount, the merchant, the last 4 digits of the account or card, and the reference number.
              </p>
              <p>
                If the app cannot read a message, it goes to a review list on your phone for you to confirm, fix or reject. Nothing is saved silently.
              </p>
            </>
          ),
        },
        {
          id: 'email',
          title: 'Email and bill scanning',
          body: (
            <p>
              Email capture and bill scanning are planned for iPhone users, who cannot give an app access to SMS. When they launch, email bodies will not be stored. Only the same extracted fields listed above will be kept. We will update this page before those features go live.
            </p>
          ),
        },
        {
          id: 'use',
          title: 'How we use your data',
          body: (
            <>
              <p>To show your balance, budgets and insights, to sync your data between your devices, and to keep your account secure.</p>
              <p>We do not sell your data, we do not show ads and we do not share it for marketing.</p>
            </>
          ),
        },
        {
          id: 'device',
          title: 'Data on your device',
          body: (
            <p>
              The app saves your entries in your browser or phone storage first, so it works offline. They sync to the server when you are back online. Clearing the app data on your device removes that local copy.
            </p>
          ),
        },
        {
          id: 'security',
          title: 'How we protect it',
          body: (
            <ul>
              <li>Passwords are hashed with Argon2id.</li>
              <li>Sign-in tokens last 15 minutes. Refresh tokens are stored hashed, rotate on every use, and reusing an old one signs you out everywhere.</li>
              <li>Connections use HTTPS, and every request is validated on the server.</li>
              <li>Secrets are kept in environment settings, never in the code.</li>
            </ul>
          ),
        },
        {
          id: 'third',
          title: 'Services we rely on',
          body: (
            <p>
              Our server and database run on a cloud hosting provider. We do not use advertising or analytics trackers on the app. The website may be served through a content delivery network, which can see standard request details such as your IP address.
            </p>
          ),
        },
        {
          id: 'rights',
          title: 'Your choices',
          body: (
            <>
              <p>You can edit or delete any transaction in the app, change your name and photo in Settings, and stop SMS capture at any time by turning off the permission in your phone settings.</p>
              <p>To get a copy of your data or have your account and server data deleted, {issues} or contact us through the team page, and we will do it.</p>
            </>
          ),
        },
        {
          id: 'kids',
          title: 'Children',
          body: <p>WalletWise is made for college students. It is not meant for children under 13, and we do not knowingly collect their data.</p>,
        },
        {
          id: 'changes',
          title: 'Changes and contact',
          body: (
            <p>
              If this policy changes, we will update the date at the top. Questions are welcome: {issues}.
            </p>
          ),
        },
      ]}
    />
  );
}

export function TermsPage() {
  return (
    <LegalLayout
      meta={PAGES.terms}
      title="Terms of Service"
      intro="These are the plain terms for using WalletWise. By creating an account or using the app, you agree to them. If you do not agree, please do not use the app."
      sections={[
        {
          id: 'what',
          title: 'What WalletWise is',
          body: (
            <p>
              WalletWise is a free personal finance app that helps you record spending, set budgets and see how much is safe to spend today. It is a student project from the Microsoft Innovations Club at VIT Chennai.
            </p>
          ),
        },
        {
          id: 'advice',
          title: 'Not financial advice',
          body: (
            <p>
              The app shows information based on what you and your messages record. It is a tracking tool, not a bank, a lender or a financial adviser. Numbers such as "safe to spend today" are estimates. Check them against your real bank balance before you rely on them.
            </p>
          ),
        },
        {
          id: 'account',
          title: 'Your account',
          body: (
            <ul>
              <li>Give accurate details and keep your password private.</li>
              <li>You are responsible for what happens under your account.</li>
              <li>Tell us if you think someone else has access to it.</li>
            </ul>
          ),
        },
        {
          id: 'use',
          title: 'Using the app fairly',
          body: (
            <>
              <p>Please do not:</p>
              <ul>
                <li>Try to break, overload or probe the service, or access someone else's data.</li>
                <li>Use it for anything unlawful, or to store data that is not yours to store.</li>
                <li>Copy our branding in a way that suggests you are us.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'sms',
          title: 'SMS permission on Android',
          body: (
            <p>
              SMS capture is optional and only works if you allow it. On Android 13 and later you may need to allow restricted settings for the app once. You can turn the permission off at any time, and the rest of the app keeps working. How messages are handled is described in the <Link to="/privacy">Privacy Policy</Link>.
            </p>
          ),
        },
        {
          id: 'data',
          title: 'Your data and our code',
          body: (
            <p>
              Your entries belong to you. You give us permission to store and process them only to run the app for you. The WalletWise name, logo and design belong to the team. The source code is open for anyone to read, and its licence terms apply to the code.
            </p>
          ),
        },
        {
          id: 'availability',
          title: 'Availability and changes',
          body: (
            <p>
              We are students and the app is free, so we cannot promise it will always be available or free of bugs. Features may change or be removed. We will try to give notice of big changes, and the app keeps working offline with the data already on your device.
            </p>
          ),
        },
        {
          id: 'warranty',
          title: 'No warranty and limit of liability',
          body: (
            <p>
              The app is provided as it is, without promises about accuracy or fitness for a particular purpose. To the extent the law allows, the team is not liable for losses that come from using the app, including missed payments, wrong budgets or lost data. Keep your own records for anything important.
            </p>
          ),
        },
        {
          id: 'ending',
          title: 'Ending your use',
          body: (
            <p>
              You can stop using WalletWise at any time. We may suspend accounts that break these terms. To have your account deleted, {issues}.
            </p>
          ),
        },
        {
          id: 'law',
          title: 'Governing law and contact',
          body: (
            <p>
              These terms are governed by the laws of India. For questions about them, {issues}.
            </p>
          ),
        },
      ]}
    />
  );
}
