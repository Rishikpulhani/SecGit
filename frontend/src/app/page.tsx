import Header from '../components/Header';
import Hero from '../components/Hero';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Home() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen">
        <Header />
        <Hero />
      </main>
    </ProtectedRoute>
  );
}
