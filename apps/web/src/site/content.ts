export const FAQ = [
  {
    q: 'Is my SMS uploaded anywhere?',
    a: 'No. Your phone reads and parses bank messages locally. Only the amount, merchant, last 4 digits and reference go to the server. OTPs and personal chats are never read, because the Android app only looks at known bank sender IDs.',
  },
  {
    q: 'Can I install it on my iPhone or Mac?',
    a: 'Yes. WalletWise is an installable web app. On iPhone, open it in Safari and choose Add to Home Screen. On a Mac, use File, then Add to Dock in Safari, or the install icon in Chrome or Edge. It then opens like any other app.',
  },
  {
    q: 'Why does iPhone not get SMS capture?',
    a: 'iOS does not let any app read SMS. On iPhone you use quick add, bank emails and bill scanning instead. Notifications on iPhone only work once the app is on your Home Screen.',
  },
  {
    q: 'What if the app cannot read a message?',
    a: 'It goes to a review list. Nothing is saved silently and nothing is dropped. You confirm, fix or reject it.',
  },
  {
    q: 'What happens if the same payment shows up twice?',
    a: 'If the reference number matches, it is the same payment and we keep one. With no reference, two similar amounts within five minutes are both kept and flagged for you to decide. We never merge two payments quietly.',
  },
  {
    q: 'Does it work offline?',
    a: 'Yes. Entries are saved on your device and sync when the connection returns. Retrying never creates duplicates.',
  },
  {
    q: 'Why is Android a separate download?',
    a: 'Google Play restricts the SMS permission, so SMS capture ships as an APK. On Android 13 and later you allow restricted settings once in app settings, and onboarding walks you through it. You can also just install the web app and skip SMS.',
  },
];

/**
 * Replace with real quotes from your testers. Entries marked `sample` show a "Sample" badge on the page
 * so placeholder text is never mistaken for a real review.
 */
export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  sample?: boolean;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'The home screen shows one number: what I can spend today. No digging through charts to find it.',
    name: 'Tester name',
    role: 'Hostel resident',
    sample: true,
  },
  {
    quote: 'Logging a canteen bill takes a few seconds, and it remembers the category I used last time.',
    name: 'Tester name',
    role: 'First year student',
    sample: true,
  },
  {
    quote: 'I like that it asks me about a payment it is unsure of instead of guessing.',
    name: 'Tester name',
    role: 'Android user',
    sample: true,
  },
  {
    quote: 'It works in the hostel dead zone and syncs when I am back on Wi-Fi.',
    name: 'Tester name',
    role: 'Second year student',
    sample: true,
  },
];
