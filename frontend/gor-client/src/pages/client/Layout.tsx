import { Outlet } from 'react-router-dom';
import Layout from '../../components/shared/Layout';

export default function ClientLayout() {
  return (
    <Layout role="CLIENT">
      <Outlet />
    </Layout>
  );
}
