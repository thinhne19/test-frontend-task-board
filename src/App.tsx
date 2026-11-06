import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TaskBoardPage } from './pages/TaskBoardPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TaskBoardPage />} />
        <Route path="/tasks/:id" element={<TaskBoardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
