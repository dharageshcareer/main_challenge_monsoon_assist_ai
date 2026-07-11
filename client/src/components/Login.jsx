import React from 'react';

const Login = ({
  handleLogin,
  selectedSeededProfileId,
  setSelectedSeededProfileId,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  profiles
}) => {
  return (
    <main className="flex-grow flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-outline-variant shadow-lg overflow-hidden p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-primary text-3xl">thunderstorm</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">MonsoonMind</h1>
          <p className="text-xs text-on-surface-variant font-medium">Real-Time Severe Weather Preparedness & Safety Coordinator</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-[10px] text-outline font-bold uppercase tracking-wider">Quick Select Seed Profile</label>
            <select
              value={selectedSeededProfileId}
              onChange={(e) => {
                setSelectedSeededProfileId(e.target.value);
                setLoginEmail('');
                setLoginPassword('');
              }}
              className="w-full border border-outline-variant rounded-lg p-2.5 text-xs bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none focus:border-primary"
            >
              <option value="">-- Choose Seed Profile --</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.location.split(',')[0]})</option>
              ))}
            </select>
          </div>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/50"></div></div>
            <span className="relative bg-white px-2 text-[10px] font-bold text-outline uppercase tracking-widest">Or create new</span>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] text-outline font-bold uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => {
                setLoginEmail(e.target.value);
                setSelectedSeededProfileId('');
              }}
              placeholder="e.g. name@domain.com"
              className="w-full border border-outline-variant rounded-lg px-3 py-2 text-xs bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] text-outline font-bold uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => {
                setLoginPassword(e.target.value);
                setSelectedSeededProfileId('');
              }}
              placeholder="••••••••"
              className="w-full border border-outline-variant rounded-lg px-3 py-2 text-xs bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-container text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-standard active-scale shadow-md"
          >
            Sign In to Platform
          </button>
        </form>
      </div>
    </main>
  );
};

export default Login;
