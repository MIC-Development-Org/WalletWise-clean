import { Route, Routes } from 'react-router-dom';
import { Onboarding } from './app/Onboarding';
import { Shell, useSnap } from './app/Shell';
import { Login } from './pages/Login';
import { Activity } from './screens/Activity';
import { Budgets } from './screens/Budgets';
import { Home } from './screens/Home';
import { More } from './screens/More';
import { Review } from './screens/Review';
import { Settings } from './screens/Settings';
import { ComparePage, FeaturesPage, HomePage } from './site/pages';
import { SiteLayout } from './site/SiteLayout';
import { InstallGuidePage } from './site/InstallGuide';
import { PrivacyPage, TermsPage } from './site/LegalPage';
import { NotFoundPage } from './site/NotFoundPage';
import { TeamPage } from './site/TeamPage';

const HomeRoute = () => <Home s={useSnap()} />;
const ActivityRoute = () => <Activity s={useSnap()} />;
const BudgetsRoute = () => <Budgets s={useSnap()} />;
const ReviewRoute = () => <Review s={useSnap()} />;
const MoreRoute = () => <More s={useSnap()} />;
const SettingsRoute = () => <Settings s={useSnap()} />;

export function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/install/apple" element={<InstallGuidePage slug="apple" />} />
        <Route path="/install/windows" element={<InstallGuidePage slug="windows" />} />
        <Route path="/install/android" element={<InstallGuidePage slug="android" />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/welcome" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<Shell />}>
        <Route index element={<HomeRoute />} />
        <Route path="activity" element={<ActivityRoute />} />
        <Route path="budgets" element={<BudgetsRoute />} />
        <Route path="review" element={<ReviewRoute />} />
        <Route path="settings" element={<SettingsRoute />} />
        <Route path="more" element={<MoreRoute />} />
      </Route>
    </Routes>
  );
}
