import { useState } from 'react';
import ProjectsPage from './pages/ProjectsPage';
import BOQPage from './pages/BOQPage';

type View =
  | { page: 'projects' }
  | { page: 'boq'; projectId: string };

export default function App() {
  const [view, setView] = useState<View>({ page: 'projects' });

  if (view.page === 'boq') {
    return (
      <BOQPage
        projectId={view.projectId}
        onBack={() => setView({ page: 'projects' })}
      />
    );
  }

  return (
    <ProjectsPage
      onOpenProject={(id) => setView({ page: 'boq', projectId: id })}
    />
  );
}
