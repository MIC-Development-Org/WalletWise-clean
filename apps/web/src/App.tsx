import { Navigate, Route, Routes } from 'react-router-dom';
import { Onboarding } from './app/Onboarding';
import { Shell, useSnap } from './app/Shell';
import { Login } from './pages/Login';
import { Activity } from './screens/Activity';
import { Budgets } from './screens/Budgets';
import { Home } from './screens/Home';
import { More } from './screens/More';
import { Review } from './screens/Review';
import { ComparePage, FeaturesPage, HomePage } from './site/pages';
import { SiteLayout } from './site/SiteLayout';

const HomeRoute = () => <Home s={useSnap()} />;
const ActivityRoute = () => <Activity s={useSnap()} />;
const BudgetsRoute = () => <Budgets s={useSnap()} />;
const ReviewRoute = () => <Review s={useSnap()} />;
const MoreRoute = () => <More s={useSnap()} />;

export function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/compare" element={<ComparePage />} />
      </Route>
      <Route path="/welcome" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<Shell />}>
        <Route index element={<HomeRoute />} />
        <Route path="activity" element={<ActivityRoute />} />
        <Route path="budgets" element={<BudgetsRoute />} />
        <Route path="review" element={<ReviewRoute />} />
        <Route path="more" element={<MoreRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
