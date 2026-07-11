import React from 'react';

const Wizard = ({
  wizardStep,
  setWizardStep,
  wizardForm,
  setWizardForm,
  handleWizardGPS,
  handleWizardSubmit,
  incrementCounter,
  decrementCounter
}) => {
  return (
    <main className="flex-grow flex items-center justify-center p-6 pt-24">
      <div className="max-w-2xl w-full bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col min-h-[550px]">
        <div className="p-6 border-b border-outline-variant bg-surface-container-low">
          <h1 className="text-xl font-bold text-primary mb-4">Configure Your MonsoonMind Profile</h1>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 font-semibold ${wizardStep >= 1 ? 'text-primary' : 'text-outline'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${wizardStep >= 1 ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {wizardStep > 1 ? <span className="material-symbols-outlined text-sm">check</span> : '1'}
              </span>
              <span className="text-xs uppercase tracking-wider">Location</span>
            </div>
            <div className="flex-grow h-px bg-outline-variant/30"></div>
            <div className={`flex items-center gap-2 font-semibold ${wizardStep >= 2 ? 'text-primary' : 'text-outline'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${wizardStep >= 2 ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {wizardStep > 2 ? <span className="material-symbols-outlined text-sm">check</span> : '2'}
              </span>
              <span className="text-xs uppercase tracking-wider">Household</span>
            </div>
            <div className="flex-grow h-px bg-outline-variant/30"></div>
            <div className={`flex items-center gap-2 font-semibold ${wizardStep >= 3 ? 'text-primary' : 'text-outline'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${wizardStep >= 3 ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                3
              </span>
              <span className="text-xs uppercase tracking-wider">Dwelling</span>
            </div>
          </div>
        </div>

        <div className="flex-grow p-8">
          {wizardStep === 1 && (
            <div className="space-y-6">
              <h2 className="font-bold text-lg text-on-surface">Step 1: Personal & Location Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Your Full Name"
                  value={wizardForm.name}
                  onChange={(e) => setWizardForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-xs"
                />
                <select
                  value={wizardForm.language}
                  onChange={(e) => setWizardForm(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full border border-outline-variant rounded-lg p-2.5 text-xs"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="mr">Marathi</option>
                  <option value="ta">Tamil</option>
                  <option value="bn">Bengali</option>
                  <option value="ml">Malayalam</option>
                </select>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Location (e.g. Kurla, Mumbai)"
                  value={wizardForm.location}
                  onChange={(e) => setWizardForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-xs"
                />
                <button
                  onClick={handleWizardGPS}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-primary/20 active-scale"
                >
                  <span className="material-symbols-outlined text-base">my_location</span>
                  GPS
                </button>
              </div>
            </div>
          )}
          {wizardStep === 2 && (
            <div className="space-y-6">
              <h2 className="font-bold text-lg text-on-surface">Step 2: Household Demographics</h2>
              <p className="text-xs text-outline">This helps tailor alerts for vulnerable members.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['adults', 'children', 'elderly', 'mobility_needs', 'pets'].map(field => (
                  <div key={field} className="p-4 bg-surface-container-low rounded-lg text-center">
                    <label className="text-xs font-bold text-on-surface-variant capitalize">{field.replace('_', ' ')}</label>
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <button onClick={() => decrementCounter(field)} className="w-8 h-8 rounded-full bg-primary/10 text-primary">-</button>
                      <span className="text-lg font-bold w-8">{wizardForm.household[field]}</span>
                      <button onClick={() => incrementCounter(field)} className="w-8 h-8 rounded-full bg-primary/10 text-primary">+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {wizardStep === 3 && (
            <div className="space-y-6">
              <h2 className="font-bold text-lg text-on-surface">Step 3: Dwelling & Infrastructure</h2>
              <p className="text-xs text-outline">Your home's structure determines specific safety actions.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={wizardForm.infrastructure.type}
                  onChange={(e) => setWizardForm(prev => ({ ...prev, infrastructure: { ...prev.infrastructure, type: e.target.value } }))}
                  className="w-full border border-outline-variant rounded-lg p-2.5 text-xs"
                >
                  <option>Ground Floor Independent</option>
                  <option>Ground floor chawl</option>
                  <option>Low-lying ground floor unit</option>
                  <option>Mountain slope structure</option>
                  <option>14th Floor High-Rise Apartment</option>
                  <option>Villa with a private basement</option>
                </select>
                <select
                  value={wizardForm.infrastructure.commute}
                  onChange={(e) => setWizardForm(prev => ({ ...prev, infrastructure: { ...prev.infrastructure, commute: e.target.value } }))}
                  className="w-full border border-outline-variant rounded-lg p-2.5 text-xs"
                >
                  <option>Motorbike</option>
                  <option>SUV</option>
                  <option>Public Bus</option>
                  <option>Metro</option>
                  <option>Remote Worker</option>
                </select>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={wizardForm.infrastructure.power_backup}
                    onChange={(e) => setWizardForm(prev => ({ ...prev, infrastructure: { ...prev.infrastructure, power_backup: e.target.checked } }))}
                  />
                  Power Backup Available
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
          {wizardStep > 1 && (
            <button onClick={() => setWizardStep(s => s - 1)} className="text-xs font-bold text-primary">Back</button>
          )}
          {wizardStep < 3 && (
            <button onClick={() => setWizardStep(s => s + 1)} className="ml-auto bg-primary text-white px-6 py-2 rounded-lg text-xs font-bold">Next</button>
          )}
          {wizardStep === 3 && (
            <button onClick={handleWizardSubmit} className="ml-auto bg-primary text-white px-6 py-2 rounded-lg text-xs font-bold">Finish & View Dashboard</button>
          )}
        </div>
      </div>
    </main>
  );
};

export default Wizard;
