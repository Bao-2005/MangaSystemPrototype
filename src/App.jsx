import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SeriesListPage from './pages/series/SeriesListPage';
import SeriesDetailPage from './pages/series/SeriesDetailPage';
import ProposalFormPage from './pages/series/ProposalFormPage';
import VotingListPage from './pages/voting/VotingListPage';
import VotingDetailPage from './pages/voting/VotingDetailPage';
import ChapterListPage from './pages/chapters/ChapterListPage';
import SubmitChapterPage from './pages/chapters/SubmitChapterPage';
import ChapterDetailPage from './pages/chapters/ChapterDetailPage';
import ManuscriptListPage from './pages/manuscripts/ManuscriptListPage';
import ManuscriptReviewPage from './pages/manuscripts/ManuscriptReviewPage';
import RankingPage from './pages/ranking/RankingPage';
import VoteEntryPage from './pages/ranking/VoteEntryPage';
import DecisionListPage from './pages/decisions/DecisionListPage';
import CreateAccountPage from './pages/admin/CreateAccountPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/series" element={<SeriesListPage />} />
          <Route path="/series/new" element={<ProposalFormPage />} />
          <Route path="/series/:id" element={<SeriesDetailPage />} />
          <Route path="/voting" element={<VotingListPage />} />
          <Route path="/voting/:id" element={<VotingDetailPage />} />
          <Route path="/chapters" element={<ChapterListPage />} />
          <Route path="/chapters/new" element={<SubmitChapterPage />} />
          <Route path="/chapters/:id" element={<ChapterDetailPage />} />
          <Route path="/manuscripts" element={<ManuscriptListPage />} />
          <Route path="/manuscripts/:id/review" element={<ManuscriptReviewPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/ranking/votes" element={<VoteEntryPage />} />
          <Route path="/decisions" element={<DecisionListPage />} />
          <Route path="/decisions/:id" element={<DecisionListPage />} />
          <Route path="/admin/create-account" element={<CreateAccountPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
