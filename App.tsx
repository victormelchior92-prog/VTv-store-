import React, { useState, useEffect } from 'react';
import { User, ContentItem, UserRole, SubscriptionPlan } from './types';
import { ADMIN_EMAIL, ADMIN_PIN, MOCK_CONTENT, INITIAL_CATEGORIES, SUBSCRIPTION_PRICES, MOCK_USERS } from './constants';
import { editImageWithGemini } from './services/geminiService';
import { NeonButton, ContentCard, HeroItem, AdminHeader, InputField } from './components/VTVComponents';

// --- MAIN APP COMPONENT ---

const App = () => {
  // --- STATE ---
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'AUTH' | 'HOME' | 'DETAILS' | 'PLAYER' | 'ADMIN' | 'PROFILE'>('AUTH');
  
  // Content State
  const [contentList, setContentList] = useState<ContentItem[]>(MOCK_CONTENT);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false); // If admin is viewing client mode

  // Auth Form State
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('BASIC');
  const [error, setError] = useState('');

  // Admin Tab State
  const [adminTab, setAdminTab] = useState<'CONTENT' | 'USERS'>('CONTENT');

  // Admin Upload State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Films populaires');
  const [uploadVideoUrl, setUploadVideoUrl] = useState('');
  const [uploadDuration, setUploadDuration] = useState('');
  const [uploadYear, setUploadYear] = useState('');
  const [uploadImage, setUploadImage] = useState<string>(''); // Base64
  const [uploadImagePrompt, setUploadImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // --- HELPERS ---

  const isSubscriptionActive = (user: User | null): boolean => {
    if (!user || !user.subscription) return false;
    const now = new Date();
    const expiry = new Date(user.subscription.expiryDate);
    // User must be ACTIVE status AND date must not be passed
    return user.status === 'ACTIVE' && now < expiry;
  };

  const getDaysRemaining = (dateStr: string) => {
    const now = new Date();
    const expiry = new Date(dateStr);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // --- AUTH HANDLERS ---

  const handleLogin = () => {
    setError('');
    
    // Find user
    const foundUser = users.find(u => u.email === email);

    if (!foundUser) {
      setError('Utilisateur non trouvé');
      return;
    }

    if (foundUser.password !== password) {
      setError('Mot de passe incorrect');
      return;
    }

    // Check Role
    if (foundUser.role === 'ADMIN') {
      setCurrentUser(foundUser);
      setView('ADMIN');
      return;
    }

    // Check Status
    if (foundUser.status === 'PENDING') {
      setError("Votre compte est en attente de validation par l'administrateur.");
      return;
    }

    if (foundUser.status === 'BANNED') {
      setError("Ce compte a été suspendu.");
      return;
    }

    // Allow login for ACTIVE and EXPIRED (Expired users need to access profile to renew)
    setCurrentUser(foundUser);
    setView('HOME');
  };

  const handleSignup = () => {
    if (!email || !password || !phone) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    if (users.find(u => u.email === email)) {
      setError('Cet email existe déjà');
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      password,
      phone,
      role: 'CLIENT',
      status: 'PENDING', // Waiting for admin
      name: 'Utilisateur',
      subscription: {
        plan: selectedPlan,
        expiryDate: new Date().toISOString() // Not valid yet
      }
    };

    setUsers([...users, newUser]);
    alert("Inscription réussie ! Votre compte est en attente de validation par l'administrateur. Vous pourrez vous connecter une fois le paiement validé.");
    setAuthMode('LOGIN');
    setEmail('');
    setPassword('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('AUTH');
    setEmail('');
    setPassword('');
    setIsAdminMode(false);
  };

  // --- CLIENT ACTIONS ---

  const handlePlayContent = (item: ContentItem) => {
    if (!isSubscriptionActive(currentUser) && !isAdminMode) {
      // If admin mode is active (admin testing client view), allow play
      // If real admin user, allow play
      if (currentUser?.role === 'ADMIN') {
         // pass
      } else {
        alert("Abonnement expiré. Veuillez renouveler votre abonnement dans votre profil.");
        setView('PROFILE');
        return;
      }
    }
    setSelectedContent(item);
    setView('PLAYER');
  };

  const handleRequestRenewal = (plan: SubscriptionPlan) => {
    if (!currentUser) return;
    
    // Update local users state
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, pendingRenewalPlan: plan };
      }
      return u;
    });
    setUsers(updatedUsers);
    
    // Update current session user
    const updatedCurrentUser = updatedUsers.find(u => u.id === currentUser.id) || null;
    setCurrentUser(updatedCurrentUser);

    alert(`Demande de renouvellement (${SUBSCRIPTION_PRICES[plan].label}) envoyée ! En attente de validation du paiement.`);
  };

  // --- ADMIN ACTIONS ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeminiEdit = async () => {
    if (!uploadImage || !uploadImagePrompt) return;
    setIsGeneratingImage(true);
    try {
      const newImage = await editImageWithGemini(uploadImage, uploadImagePrompt);
      if (newImage) {
        setUploadImage(newImage);
      }
    } catch (e) {
      alert("Erreur lors de la génération avec Gemini. Vérifiez votre clé API.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handlePublish = () => {
    if (!uploadTitle) return;
    const newItem: ContentItem = {
      id: Date.now().toString(),
      title: uploadTitle,
      description: uploadDesc,
      category: uploadCategory,
      thumbnailUrl: uploadImage || 'https://picsum.photos/300/450',
      videoUrl: uploadVideoUrl || "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
      duration: uploadDuration ? parseInt(uploadDuration) : 0,
      releaseYear: uploadYear ? parseInt(uploadYear) : new Date().getFullYear(),
      isSeries: false, 
    };
    setContentList([newItem, ...contentList]);
    alert('Contenu publié avec succès !');
    setUploadTitle('');
    setUploadDesc('');
    setUploadVideoUrl('');
    setUploadDuration('');
    setUploadYear('');
    setUploadImage('');
    setUploadImagePrompt('');
  };

  const handleValidateUser = (userId: string, isRenewal: boolean) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        // Add 30 days from NOW
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 30);

        return {
          ...u,
          status: 'ACTIVE' as const,
          subscription: {
            plan: isRenewal && u.pendingRenewalPlan ? u.pendingRenewalPlan : (u.subscription?.plan || 'BASIC'),
            expiryDate: newExpiry.toISOString()
          },
          pendingRenewalPlan: undefined // Clear pending request
        };
      }
      return u;
    });
    setUsers(updatedUsers);
  };

  const handleRejectUser = (userId: string) => {
    if(confirm("Êtes-vous sûr de vouloir rejeter/bannir cet utilisateur ?")) {
       setUsers(users.map(u => u.id === userId ? { ...u, status: 'BANNED' as const } : u));
    }
  };

  // --- RENDER HELPERS ---

  // AUTH VIEW
  if (!currentUser || view === 'AUTH') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-1/2 h-1/2 bg-purple-900/30 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-1/2 h-1/2 bg-blue-900/30 rounded-full blur-[100px]"></div>

        <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-slate-700 z-10">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 neon-text tracking-tighter mb-2">VTV</h1>
            <p className="text-gray-400 text-sm uppercase tracking-widest">Le meilleur du streaming</p>
          </div>

          {error && <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4 text-sm text-center border border-red-500/50">{error}</div>}

          <div className="space-y-4">
            <InputField 
              label="Email" 
              placeholder="votre@email.com" 
              value={email} 
              onChange={(e: any) => setEmail(e.target.value)} 
            />
            <InputField 
              label={authMode === 'LOGIN' && email === ADMIN_EMAIL ? "Code PIN Admin" : "Mot de passe"} 
              type="password" 
              placeholder={authMode === 'LOGIN' && email === ADMIN_EMAIL ? "PIN..." : "••••••••"} 
              value={password} 
              onChange={(e: any) => setPassword(e.target.value)} 
            />
            
            {authMode === 'SIGNUP' && (
               <>
                <InputField 
                  label="Téléphone (pour paiement)" 
                  placeholder="+241..." 
                  value={phone} 
                  onChange={(e: any) => setPhone(e.target.value)} 
                />
                <div>
                   <label className="block text-gray-300 text-sm font-bold mb-2">Choisir Formule</label>
                   <div className="grid grid-cols-3 gap-2">
                      {Object.entries(SUBSCRIPTION_PRICES).map(([key, plan]) => (
                        <div 
                          key={key} 
                          onClick={() => setSelectedPlan(key as SubscriptionPlan)}
                          className={`cursor-pointer border rounded p-2 text-center text-xs ${selectedPlan === key ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-slate-600 text-gray-400'}`}
                        >
                           <div className="font-bold">{plan.label}</div>
                           <div>{plan.price}</div>
                        </div>
                      ))}
                   </div>
                </div>
               </>
            )}

            <NeonButton onClick={authMode === 'LOGIN' ? handleLogin : handleSignup} className="w-full mt-6">
              {authMode === 'LOGIN' ? 'Se Connecter' : "S'inscrire"}
            </NeonButton>

            <div className="flex justify-between text-sm text-gray-400 mt-4">
              <button onClick={() => { setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN'); setError(''); }} className="hover:text-white underline">
                {authMode === 'LOGIN' ? "Créer un compte" : "J'ai déjà un compte"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN INTERFACE
  if (view === 'ADMIN') {
    const pendingUsers = users.filter(u => u.status === 'PENDING' && u.role !== 'ADMIN');
    const renewalUsers = users.filter(u => u.pendingRenewalPlan && u.role !== 'ADMIN');
    const allClientUsers = users.filter(u => u.role === 'CLIENT');

    return (
      <div className="min-h-screen bg-[#0f172a]">
        <AdminHeader 
          user={currentUser} 
          onLogout={handleLogout} 
          onSwitchMode={() => { setIsAdminMode(true); setView('HOME'); }}
        />
        
        <div className="container mx-auto p-4 md:p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Panneau d'Administration
            </h1>
            <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
               <button 
                 onClick={() => setAdminTab('CONTENT')}
                 className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${adminTab === 'CONTENT' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
               >
                 Contenu
               </button>
               <button 
                 onClick={() => setAdminTab('USERS')}
                 className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${adminTab === 'USERS' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
               >
                 Utilisateurs & Paiements
               </button>
            </div>
          </div>

          {/* USERS TAB */}
          {adminTab === 'USERS' && (
             <div className="space-y-8">
                {/* 1. Pending Approvals */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
                   <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
                     <span className="material-icons">pending</span> Inscriptions en attente ({pendingUsers.length})
                   </h3>
                   {pendingUsers.length === 0 ? <p className="text-gray-500 italic">Aucune demande.</p> : (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                           <thead className="text-gray-500 uppercase bg-slate-900/50">
                              <tr>
                                 <th className="px-4 py-3">Email</th>
                                 <th className="px-4 py-3">Tél</th>
                                 <th className="px-4 py-3">Formule</th>
                                 <th className="px-4 py-3">Actions</th>
                              </tr>
                           </thead>
                           <tbody>
                              {pendingUsers.map(u => (
                                 <tr key={u.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                    <td className="px-4 py-3">{u.email}</td>
                                    <td className="px-4 py-3">{u.phone}</td>
                                    <td className="px-4 py-3 font-bold text-white">{u.subscription?.plan}</td>
                                    <td className="px-4 py-3 flex gap-2">
                                       <button onClick={() => handleValidateUser(u.id, false)} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500">Valider</button>
                                       <button onClick={() => handleRejectUser(u.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500">Rejeter</button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                   )}
                </div>

                {/* 2. Renewal Requests */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
                   <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                     <span className="material-icons">autorenew</span> Demandes de réabonnement ({renewalUsers.length})
                   </h3>
                   {renewalUsers.length === 0 ? <p className="text-gray-500 italic">Aucune demande.</p> : (
                      <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-300">
                         <thead className="text-gray-500 uppercase bg-slate-900/50">
                            <tr>
                               <th className="px-4 py-3">Email</th>
                               <th className="px-4 py-3">Tél</th>
                               <th className="px-4 py-3">Nouv. Formule</th>
                               <th className="px-4 py-3">Statut Actuel</th>
                               <th className="px-4 py-3">Actions</th>
                            </tr>
                         </thead>
                         <tbody>
                            {renewalUsers.map(u => (
                               <tr key={u.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                  <td className="px-4 py-3">{u.email}</td>
                                  <td className="px-4 py-3">{u.phone}</td>
                                  <td className="px-4 py-3 font-bold text-blue-300">{u.pendingRenewalPlan}</td>
                                  <td className="px-4 py-3">
                                     <span className={`px-2 py-0.5 rounded text-xs ${u.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                       {u.status}
                                     </span>
                                  </td>
                                  <td className="px-4 py-3 flex gap-2">
                                     <button onClick={() => handleValidateUser(u.id, true)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500">Confirmer Paiement</button>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                   )}
                </div>

                {/* 3. All Users List */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
                   <h3 className="text-xl font-bold mb-4 text-gray-300">Tous les Utilisateurs</h3>
                   <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-left text-sm text-gray-300">
                           <thead className="text-gray-500 uppercase bg-slate-900/50 sticky top-0">
                              <tr>
                                 <th className="px-4 py-3">Utilisateur</th>
                                 <th className="px-4 py-3">Statut</th>
                                 <th className="px-4 py-3">Expire dans</th>
                                 <th className="px-4 py-3">Formule</th>
                              </tr>
                           </thead>
                           <tbody>
                              {allClientUsers.map(u => {
                                 const days = u.subscription ? getDaysRemaining(u.subscription.expiryDate) : 0;
                                 return (
                                    <tr key={u.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                       <td className="px-4 py-3">
                                          <div className="font-bold">{u.email}</div>
                                          <div className="text-xs text-gray-500">{u.phone}</div>
                                       </td>
                                       <td className="px-4 py-3">
                                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                                             u.status === 'ACTIVE' ? 'bg-green-600/20 text-green-400' :
                                             u.status === 'PENDING' ? 'bg-yellow-600/20 text-yellow-400' :
                                             'bg-red-600/20 text-red-400'
                                          }`}>
                                             {u.status}
                                          </span>
                                       </td>
                                       <td className="px-4 py-3">
                                          {u.status === 'ACTIVE' && days > 0 ? `${days} jours` : <span className="text-red-500">Expiré</span>}
                                       </td>
                                       <td className="px-4 py-3">{u.subscription?.plan}</td>
                                    </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                   </div>
                </div>
             </div>
          )}

          {/* CONTENT TAB (Existing) */}
          {adminTab === 'CONTENT' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Form */}
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="material-icons text-purple-400">add_circle</span> Ajouter un film/série
                </h3>
                
                <InputField label="Titre" value={uploadTitle} onChange={(e: any) => setUploadTitle(e.target.value)} />
                <div className="mb-4">
                   <label className="block text-gray-300 text-sm font-bold mb-2">Description / Synopsis</label>
                   <textarea 
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg py-2 px-4 focus:border-purple-500 outline-none" 
                      rows={3}
                      value={uploadDesc}
                      onChange={(e) => setUploadDesc(e.target.value)}
                   ></textarea>
                </div>
                
                <InputField 
                   label="Lien de la vidéo (URL MP4/Youtube/Firebase)" 
                   placeholder="https://..." 
                   value={uploadVideoUrl} 
                   onChange={(e: any) => setUploadVideoUrl(e.target.value)} 
                />

                <div className="grid grid-cols-2 gap-4">
                   <InputField 
                      label="Durée (minutes)" 
                      placeholder="Ex: 120" 
                      type="number"
                      value={uploadDuration} 
                      onChange={(e: any) => setUploadDuration(e.target.value)} 
                   />
                   <InputField 
                      label="Année" 
                      placeholder="Ex: 2024" 
                      type="number"
                      value={uploadYear} 
                      onChange={(e: any) => setUploadYear(e.target.value)} 
                   />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-300 text-sm font-bold mb-2">Catégorie</label>
                  <select 
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg py-3 px-4 outline-none"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                  >
                    {INITIAL_CATEGORIES.map(cat => <option key={cat.nom} value={cat.nom}>{cat.nom}</option>)}
                  </select>
                </div>
              </div>

              {/* Image & AI Section */}
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
                <h3 className="text-xl font-bold mb-4 text-purple-400">Média & IA (Gemini 2.5)</h3>
                
                <div className="mb-4">
                  <label className="block text-gray-300 text-sm font-bold mb-2">Importer une affiche (depuis appareil)</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"/>
                </div>

                {uploadImage && (
                  <div className="mb-4">
                     <div className="relative w-full h-48 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center mb-4 border border-slate-600">
                       <img src={uploadImage} alt="Preview" className="max-h-full object-contain" />
                     </div>

                     <div className="bg-slate-900/50 p-4 rounded-lg border border-purple-500/30">
                        <label className="block text-purple-300 text-sm font-bold mb-2">
                          🪄 Éditeur d'image IA (Nano Banana)
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={uploadImagePrompt}
                            onChange={(e) => setUploadImagePrompt(e.target.value)}
                            placeholder="Ex: Ajouter un filtre retro..."
                            className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm outline-none focus:border-purple-500"
                          />
                          <button 
                            onClick={handleGeminiEdit}
                            disabled={isGeneratingImage || !uploadImagePrompt}
                            className="bg-purple-600 px-4 py-2 rounded font-bold text-sm hover:bg-purple-500 disabled:opacity-50 flex items-center gap-1"
                          >
                            {isGeneratingImage ? '...' : 'Générer'}
                          </button>
                        </div>
                     </div>
                  </div>
                )}

                <NeonButton onClick={handlePublish} className="w-full mt-4">
                  Publier le contenu
                </NeonButton>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // CLIENT NAVBAR
  const Navbar = () => (
    <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-[#0f172a] to-transparent p-4 px-6 flex justify-between items-center backdrop-blur-sm">
      <div 
        className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 cursor-pointer"
        onClick={() => setView('HOME')}
      >
        VTV
      </div>
      <div className="flex gap-4 items-center">
        {!isSubscriptionActive(currentUser) && !isAdminMode && (
          <div className="text-red-500 text-xs font-bold border border-red-500 px-2 py-1 rounded animate-pulse">ABONNEMENT EXPIRÉ</div>
        )}
        <div 
          className="w-8 h-8 rounded bg-blue-600 cursor-pointer flex items-center justify-center font-bold text-sm"
          onClick={() => setView('PROFILE')}
        >
          {currentUser?.email[0].toUpperCase()}
        </div>
        {isAdminMode && (
          <button 
            onClick={() => { setIsAdminMode(false); setView('ADMIN'); }}
            className="text-xs bg-red-500 px-2 py-1 rounded ml-2"
          >
            Retour Admin
          </button>
        )}
      </div>
    </nav>
  );

  // PLAYER
  if (view === 'PLAYER' && selectedContent) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col justify-center items-center">
        <div className="relative w-full h-full max-w-6xl max-h-[80vh] bg-slate-900 flex items-center justify-center">
            <video 
              controls 
              autoPlay 
              className="w-full h-full"
              src={selectedContent.videoUrl || "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}
            />
            <button 
               className="absolute bottom-20 right-8 bg-white text-black px-6 py-2 font-bold rounded hover:bg-gray-200 transition-colors z-20"
               onClick={() => alert('Générique passé !')}
            >
              Sauter le générique
            </button>
            <button 
              className="absolute top-4 left-4 text-white z-20 hover:text-purple-400 bg-black/50 px-3 py-1 rounded"
              onClick={() => setView('DETAILS')}
            >
              ← Retour
            </button>
        </div>
        <div className="mt-4 text-gray-400">Lecture en cours: <span className="text-white font-bold">{selectedContent.title}</span></div>
      </div>
    );
  }

  // DETAILS VIEW
  if (view === 'DETAILS' && selectedContent) {
    return (
      <div className="min-h-screen bg-[#0f172a] pb-20">
        <Navbar />
        <div className="relative h-[50vh]">
          <img src={selectedContent.thumbnailUrl} className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent"></div>
          <div className="absolute bottom-10 left-6 max-w-2xl">
             <h1 className="text-4xl md:text-6xl font-bold mb-2">{selectedContent.title}</h1>
             <div className="flex gap-3 text-sm text-gray-300 mb-4">
                <span className="text-green-400 font-bold">98% recommandé</span>
                <span>{selectedContent.releaseYear || 2024}</span>
                <span className="border border-gray-500 px-1 text-xs flex items-center">HD</span>
             </div>
             <p className="text-gray-200 mb-6">{selectedContent.description}</p>
             <NeonButton onClick={() => handlePlayContent(selectedContent)} variant="primary">▶ Lecture</NeonButton>
          </div>
        </div>
        {/* Mock Episodes */}
        <div className="px-6 mt-8">
           {selectedContent.isSeries && (
             <div className="mb-10">
               <h3 className="text-xl font-bold mb-4 border-l-4 border-purple-600 pl-3">Épisodes</h3>
               <div className="space-y-2">
                 {(selectedContent.episodes || [{id:'1', title:'Episode 1', duration: 45}, {id:'2', title:'Episode 2', duration: 50}]).map((ep, idx) => (
                   <div key={idx} className="flex justify-between items-center p-4 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer group" onClick={() => handlePlayContent(selectedContent)}>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500 font-bold text-xl">{idx + 1}</span>
                        <div><h4 className="font-bold">{ep.title}</h4></div>
                      </div>
                      <div className="text-xs text-gray-400">{ep.duration} min</div>
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>
      </div>
    );
  }

  // PROFILE VIEW
  if (view === 'PROFILE' && currentUser) {
    const daysLeft = currentUser.subscription ? getDaysRemaining(currentUser.subscription.expiryDate) : 0;
    const isPending = !!currentUser.pendingRenewalPlan;
    const status = currentUser.status;

    return (
      <div className="min-h-screen bg-[#0f172a] p-6">
        <Navbar />
        <div className="max-w-2xl mx-auto mt-20">
          <div className="flex items-center gap-4 mb-8">
             <button onClick={() => setView('HOME')} className="text-gray-400 hover:text-white text-xl">←</button>
             <h1 className="text-3xl font-bold">Mon Profil</h1>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-lg mb-8 flex flex-col md:flex-row items-center gap-6 border border-slate-700">
             <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-[#0f172a] shadow-lg">
               {currentUser.email[0].toUpperCase()}
             </div>
             <div className="text-center md:text-left">
               <p className="text-xl font-bold">{currentUser.email}</p>
               <p className="text-sm text-gray-400">Tél: {currentUser.phone}</p>
               <div className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-900 border border-slate-600">
                 {status === 'ACTIVE' ? <span className="text-green-500">ABONNÉ ACTIF</span> : <span className="text-red-500">EXPIRÉ</span>}
               </div>
             </div>
          </div>

          <h2 className="text-2xl font-bold mb-4">Gérer mon abonnement</h2>
          
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8">
             <div className="flex justify-between items-center mb-6">
               <div>
                  <div className="text-gray-400 text-sm">Temps restant</div>
                  <div className={`text-3xl font-bold ${daysLeft < 5 ? 'text-red-500' : 'text-green-500'}`}>
                    {daysLeft} Jours
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-gray-400 text-sm">Formule actuelle</div>
                  <div className="text-xl font-bold">{currentUser.subscription?.plan}</div>
               </div>
             </div>
             
             {isPending ? (
                <div className="bg-yellow-900/30 border border-yellow-600 p-4 rounded text-center text-yellow-200">
                  <p className="font-bold mb-1">Demande de renouvellement en cours</p>
                  <p className="text-xs opacity-80">En attente de validation du paiement par l'administrateur.</p>
                </div>
             ) : (
                <>
                  <p className="text-sm text-gray-300 mb-4">Pour vous réabonner, choisissez une formule ci-dessous. Le paiement se fait via Mobile Money.</p>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(SUBSCRIPTION_PRICES).map(([key, plan]) => (
                       <button 
                         key={key}
                         onClick={() => handleRequestRenewal(key as SubscriptionPlan)}
                         className="flex justify-between items-center p-4 rounded bg-slate-700 hover:bg-purple-900/50 border border-transparent hover:border-purple-500 transition-all group"
                       >
                         <span className="font-bold group-hover:text-purple-300">{plan.label}</span>
                         <span className="font-bold">{plan.price} {plan.currency}</span>
                       </button>
                    ))}
                  </div>
                </>
             )}
          </div>

          <div className="mt-8 text-center space-y-4">
             <p className="text-sm text-gray-400">Paiement Mobile Money: <span className="text-white font-bold">+241074087064</span></p>
             <button onClick={handleLogout} className="text-red-500 underline text-sm hover:text-red-400">Se déconnecter</button>
          </div>
        </div>
      </div>
    );
  }

  // HOME VIEW
  const featuredContent = contentList[0];
  
  return (
    <div className="min-h-screen bg-[#0f172a] pb-20">
      <Navbar />
      
      <HeroItem 
        item={featuredContent} 
        onPlay={() => handlePlayContent(featuredContent)} 
      />

      <div className="relative z-10 -mt-20 md:-mt-32 space-y-8 pl-4 md:pl-12">
        {INITIAL_CATEGORIES.map((cat, idx) => (
           <div key={idx}>
             <h2 className="text-lg md:text-xl font-bold text-white mb-3 hover:text-purple-400 cursor-pointer transition-colors">
               {cat.nom}
             </h2>
             <div className="flex gap-4 overflow-x-scroll scrollbar-hide pb-4 pr-4">
               {contentList.map((item, i) => (
                 <ContentCard 
                   key={item.id + i + cat.nom} 
                   item={item} 
                   onClick={() => { setSelectedContent(item); setView('DETAILS'); }}
                 />
               ))}
             </div>
           </div>
        ))}
      </div>
    </div>
  );
};

export default App;