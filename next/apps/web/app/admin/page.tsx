import type { Metadata } from 'next';
import { AdminShell } from '../../components/admin/admin-shell';
import './admin.css';
import './admin-accessibility.css';
import './admin-containment.css';
import './admin-about-accessibility.css';

export const metadata: Metadata = {
  title: 'ZenBlog Admin',
  robots: {
    index: false,
    follow: false,
    nocache: true
  }
};

export default function AdminPage() {
  return <AdminShell />;
}
