import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import Chatbot from '../Chatbot';
import GlobalSearch from '../shared/GlobalSearch';

interface Props {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#f7f9f7]">
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
      <Chatbot />
      <GlobalSearch />
    </div>
  );
}
