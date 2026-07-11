import React from 'react';

const Chatbot = ({
  chatOpen,
  setChatOpen,
  chatMessages,
  chatInput,
  setChatInput,
  handleSendMessage,
  chatLoading
}) => {
  return (
    <>
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-transform hover:scale-110 active:scale-95"
      >
        <span className="material-symbols-outlined text-2xl">{chatOpen ? 'close' : 'support_agent'}</span>
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-[400px] bg-white rounded-2xl shadow-2xl border border-outline-variant z-50 flex flex-col overflow-hidden">
          <div className="p-4 bg-primary text-white">
            <h3 className="font-bold text-sm">WeatherMan Assistant</h3>
          </div>
          <div className="flex-grow p-4 space-y-4 overflow-y-auto">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-xs ${msg.sender === 'user' ? 'bg-primary/10 text-on-surface' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                  <div className="p-3 rounded-xl bg-surface-container-high">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
              </div>
            )}
          </div>
          <div className="p-2 border-t border-outline-variant flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything..."
              className="flex-grow border-none bg-transparent text-xs focus:ring-0"
            />
            <button
              onClick={handleSendMessage}
              className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
