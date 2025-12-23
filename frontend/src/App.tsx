import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation, Link, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@radix-ui/react-tooltip'; // Assuming still used elsewhere, otherwise remove

// --- Use ALIAS paths starting with @/ ---
import { AuthProvider, useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Index from '@/pages/Index';
import Games from '@/pages/Games';
import Leaderboard from '@/pages/Leaderboard';
import Achievements from '@/pages/Achievements';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import UserDashboard from '@/pages/UserDashboard';
import About from '@/pages/About';
import NotFound from '@/pages/NotFound';
import GameDetail from '@/pages/GameDetail';
import Friends from '@/pages/Friends';
import Chat from '@/pages/Chat'; // <-- NEWLY ADDED
// --- End Alias Paths ---

// --- Use LUCIDE-REACT icon ---
import { Loader2 } from 'lucide-react'; // Import Lucide Loader

const queryClient = new QueryClient();

// --- Particle Background Component ---
const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const particles = useRef<any[]>([]); // Store particle data
  const mouse = useRef({ x: Infinity, y: Infinity });

  // Wrap handleResize in useCallback to keep its reference stable
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Re-initialize particles on resize if needed, or just adjust bounds
      // initParticles(); // Optional: Reset particles on resize
    }
  }, []); // Empty dependency array means this function reference never changes

  const handleMouseMove = (event: MouseEvent) => {
    mouse.current.x = event.clientX;
    mouse.current.y = event.clientY;
  };

  const initParticles = useCallback(() => { // Wrap initParticles in useCallback
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set initial size based on current window dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particles.current = [];
    const numberOfParticles = Math.floor((canvas.width * canvas.height) / 15000); // Adjust density
    for (let i = 0; i < numberOfParticles; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5, // Smaller particles
        speedX: Math.random() * 0.4 - 0.2, // Slower movement
        speedY: Math.random() * 0.4 - 0.2,
      });
    }
  }, []); // Add canvasRef to dependencies if it could change, but usually not needed


  const animateParticles = useCallback(() => { // Wrap animateParticles
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.current.forEach((p, i) => {
      // Update position
      p.x += p.speedX;
      p.y += p.speedY;

      // Wall collision (simple wrap around)
       if (p.x < -p.size) p.x = canvas.width + p.size;
       else if (p.x > canvas.width + p.size) p.x = -p.size;
       if (p.y < -p.size) p.y = canvas.height + p.size;
       else if (p.y > canvas.height + p.size) p.y = -p.size;


      // Draw particle
      ctx.fillStyle = 'rgba(192, 132, 252, 0.6)'; // Neon purple with opacity
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Check distance to other particles for lines
      for (let j = i + 1; j < particles.current.length; j++) {
        const dx = particles.current[j].x - p.x;
        const dy = particles.current[j].y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 120) { // Connection distance
          const opacity = 1 - distance / 120;
          ctx.strokeStyle = `rgba(168, 85, 247, ${opacity * 0.5})`; // Lighter purple lines
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(particles.current[j].x, particles.current[j].y);
          ctx.stroke();
        }
      }
    });

    animationFrameId.current = requestAnimationFrame(animateParticles);
  }, []); // Added animateParticles dependencies

  useEffect(() => {
    initParticles(); // Initialize on mount
    animateParticles(); // Start animation loop

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Cleanup function
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      // Use the stable function reference from useCallback for removal
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleResize, initParticles, animateParticles]); // Add all dependencies

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10" // Ensure it's behind everything
    />
  );
};


// --- Main Layout ---
const MainLayout = () => {
  const location = useLocation(); // Hook to detect page changes

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/* Add key={location.pathname} to trigger animation on route change */}
      <main key={location.pathname} className="flex-1 page-content">
        <Outlet /> {/* Child routes will render here */}
      </main>
      <Footer />
    </div>
  );
};

// --- AppContent Wrapper ---
// This component sits inside the router to access useLocation
const AppContent = () => {
  const { isLoading: isAuthLoading } = useAuth(); // Check auth loading

  // Show a global spinner while auth is initializing
  if (isAuthLoading) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-950">
           <div className="flex-1 flex items-center justify-center">
               <Loader2 size={48} className="animate-spin text-purple-400" />
           </div>
        </div>
    )
  }

  return (
    <>
      {/* Render particle background globally */}
      <ParticleBackground />
      
      <Routes>
        {/* Routes WITHOUT Navbar/Footer */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />

        {/* Routes WITH Navbar/Footer */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/games" element={<Games />} />
          <Route path="/game/:id" element={<GameDetail />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/friends" element={ <ProtectedRoute><Friends /></ProtectedRoute> } />
          <Route path="/dashboard" element={ <ProtectedRoute><UserDashboard /></ProtectedRoute> } />
          <Route path="/user-dashboard" element={ <ProtectedRoute><UserDashboard /></ProtectedRoute> } /> 
          <Route path="/about" element={<About />} />
           {/* --- NEW CHAT ROUTE --- */}
          <Route path="/chat/:friendId" element={ <ProtectedRoute><Chat /></ProtectedRoute> } />
          {/* --- END NEW --- */}
        </Route>
      </Routes>
    </>
  );
};
// --- END ---


// --- App Component ---
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          {/* AppContent now contains the Routes and conditional particle background */}
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

