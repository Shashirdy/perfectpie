import React from 'react';
import { Pizza } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-dark-950 py-8 px-6 md:px-12 mt-auto text-dark-400 text-xs text-center flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="bg-pizza-500/10 p-1.5 rounded-lg text-pizza-500">
          <Pizza size={16} />
        </div>
        <span className="font-bold text-white">PerfectPie Inc. &copy; 2026</span>
      </div>
      <p>Premium 3D Custom Pizza Customizer & Real-time Delivery Tracking</p>
      <div className="flex gap-4 text-[11px]">
        <a href="#" className="hover:text-pizza-400 transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-pizza-400 transition-colors">Terms of Service</a>
      </div>
    </footer>
  );
}
