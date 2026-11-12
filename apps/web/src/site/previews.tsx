import { useMemo } from 'react';
import { AddForm } from '../app/AddSheet';
import { PhoneFrame } from '../components/Frames';
import { sampleSnapshot } from '../lib/sample';
import type { Snapshot } from '../lib/snapshot';
import { Activity } from '../screens/Activity';
import { Budgets } from '../screens/Budgets';
import { Home } from '../screens/Home';
import { Review } from '../screens/Review';

/** The same sample month everywhere on the marketing site, so numbers always agree. */
export function useSample(): Snapshot {
  return useMemo(() => sampleSnapshot(), []);
}

function AddOverlay() {
  return (
    <div className="absolute inset-0 bg-black/60">
      <div className="absolute inset-x-0 bottom-0 rounded-t-[1.75rem] border border-line-strong bg-surface px-5 pt-3 pb-6">
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line-strong" />
        <h2 className="mb-4 text-xl font-medium">Add transaction</h2>
        <AddForm initialType="EXPENSE" onDone={() => {}} />
      </div>
    </div>
  );
}

type P = { s: Snapshot; scale: number };

export const HomePhone = ({ s, scale }: P) => (
  <PhoneFrame active="home" scale={scale} label="WalletWise home screen">
    <Home s={s} />
  </PhoneFrame>
);

export const AddPhone = ({ s, scale }: P) => (
  <PhoneFrame active="home" scale={scale} label="Add transaction sheet" overlay={<AddOverlay />}>
    <Home s={s} />
  </PhoneFrame>
);

export const ActivityPhone = ({ s, scale }: P) => (
  <PhoneFrame active="activity" scale={scale} label="Activity screen">
    <Activity s={s} />
  </PhoneFrame>
);

export const BudgetsPhone = ({ s, scale }: P) => (
  <PhoneFrame active="budgets" scale={scale} label="Budgets screen">
    <Budgets s={s} />
  </PhoneFrame>
);

export const ReviewPhone = ({ s, scale }: P) => (
  <PhoneFrame active="review" scale={scale} label="Review screen">
    <Review s={s} />
  </PhoneFrame>
);
