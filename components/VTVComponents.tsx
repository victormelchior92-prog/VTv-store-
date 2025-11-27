import React from 'react';
import { ContentItem } from '../types';

// --- BUTTONS ---
export const NeonButton = ({ children, onClick, variant = 'primary', className = '' }: any) => {
  const baseStyle = "px-6 py-2 rounded-full font-bold transition-all duration-300 transform hover:scale-105";
  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)] hover:shadow-[0_0_25px_rgba(124,58,237,0.8)]",
    secondary: "bg-gray-800 text-white border border-gray-600 hover:bg-gray-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    accent: "bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]"
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  );
};

// --- CONTENT CARD ---
export const ContentCard: React.FC<{ item: ContentItem; onClick: () => void }> = ({ item, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="relative flex-shrink-0 w-32 md:w-48 cursor-pointer transition-transform duration-300 hover:scale-110 hover:z-10 group"
    >
      <img 
        src={item.thumbnailUrl} 
        alt={item.title} 
        className="w-full h-48 md:h-72 object-cover rounded-md shadow-lg"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center rounded-md">
        <div className="opacity-0 group-hover:opacity-100 text-center p-2">
          <p className="text-white font-bold text-sm md:text-base">{item.title}</p>
          <div className="mt-2 text-xs text-gray-300 flex items-center justify-center gap-2">
            <span className="bg-purple-600 px-1 rounded">HD</span>
            <span>{item.isSeries ? 'Série' : 'Film'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- HERO CAROUSEL ITEM ---
export const HeroItem: React.FC<{ item: ContentItem; onPlay: () => void }> = ({ item, onPlay }) => {
  return (
    <div className="relative w-full h-[60vh] md:h-[80vh]">
      <div className="absolute inset-0">
        <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/40 to-transparent"></div>
      </div>
      
      <div className="absolute bottom-10 left-4 md:bottom-20 md:left-12 max-w-xl p-4">
        <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4 drop-shadow-lg">
          {item.title}
        </h1>
        <p className="text-gray-200 text-sm md:text-lg mb-6 line-clamp-3">
          {item.description}
        </p>
        <div className="flex gap-4">
          <NeonButton onClick={onPlay} variant="primary">
            ▶ Lecture
          </NeonButton>
          <NeonButton onClick={() => {}} variant="secondary">
            + Ma Liste
          </NeonButton>
        </div>
      </div>
    </div>
  );
};

// --- ADMIN HEADER ---
export const AdminHeader = ({ user, onLogout, onSwitchMode }: any) => (
  <div className="bg-slate-800 p-4 flex justify-between items-center shadow-lg border-b border-slate-700">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xl">A</div>
      <div>
        <h2 className="font-bold text-purple-400">ADMINISTRATEUR</h2>
        <p className="text-xs text-gray-400">{user.email}</p>
      </div>
    </div>
    <div className="flex gap-3">
      <button onClick={onSwitchMode} className="text-sm bg-blue-600 px-3 py-1 rounded hover:bg-blue-500">
        Voir version Client
      </button>
      <button onClick={onLogout} className="text-sm bg-red-600 px-3 py-1 rounded hover:bg-red-500">
        Déconnexion
      </button>
    </div>
  </div>
);

// --- INPUT FIELD ---
export const InputField = ({ label, type = "text", value, onChange, placeholder, className="" }: any) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-gray-300 text-sm font-bold mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg py-3 px-4 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
    />
  </div>
);