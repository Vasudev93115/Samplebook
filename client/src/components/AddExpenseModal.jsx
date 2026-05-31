import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, X } from 'lucide-react';
import { getAllCategories, getEmoji } from '../lib/categoryEmoji';
import { useToast } from './ToastNotification';

export default function AddExpenseModal({ open, onClose, onAdd, members = [], currency = 'INR', currentUser, demoMode }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [description, setDescription] = useState('');
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [scanning, setScanning] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  const categories = getAllCategories();

  let toast = { addToast: () => {} };
  try { toast = useToast(); } catch (e) { /* toast not available */ }

  useEffect(() => {
    if (open) {
      setAmount('');
      setCategory('Other');
      setDescription('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setSelectedFile(null);
      setScanning(false);
      setRecording(false);
      setMediaRecorder(null);
      setAudioFile(null);
      if (currentUser && members.some(m => m.id === currentUser.id)) {
        setUserId(currentUser.id);
      } else if (members.length > 0) {
        setUserId(members[0].id || members[0].phone);
      } else {
        setUserId('');
      }
    }
  }, [open, members, currentUser]);

  const triggerScan = async (file) => {
    if (!file) return;
    setScanning(true);
    toast.addToast('⏳ AI is reading receipt...');

    if (demoMode) {
      setTimeout(() => {
        setAmount('350.00');
        setCategory('Food & Dining');
        setDescription('Paid to McDonald\'s');
        toast.addToast('✅ Receipt scanned successfully (Demo Mode)! Details filled below.');
        setScanning(false);
      }, 1500);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result.split(',')[1];
          const mimeType = file.type;

          const getBackendUrl = () => {
            const envUrl = import.meta.env.VITE_APP_URL;
            if (envUrl && !envUrl.includes('5173')) {
              return envUrl;
            }
            const host = window.location.hostname;
            const protocol = window.location.protocol;
            return `${protocol}//${host}:3000`;
          };
          const backendUrl = getBackendUrl();
          const response = await fetch(`${backendUrl}/api/scan-receipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64String, mimeType })
          });

          if (response.ok) {
            const parsed = await response.json();
            if (parsed && parsed.amount) {
              setAmount(parsed.amount.toString());
              if (parsed.category) {
                const matchedCategory = categories.find(c => c.toLowerCase() === parsed.category.toLowerCase()) || 'Other';
                setCategory(matchedCategory);
              }
              if (parsed.description) {
                setDescription(parsed.description);
              }
              toast.addToast('✅ Receipt scanned successfully! Details filled below.');
            } else {
              toast.addToast('❓ Could not extract details. Please fill manually.');
            }
          } else {
            toast.addToast('❌ Failed to scan receipt. Please fill manually.');
          }
        } catch (err) {
          console.error('Scan API call error:', err);
          toast.addToast('❌ Connection error to scan server.');
        } finally {
          setScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Receipt reader error:', err);
      toast.addToast('❌ Failed to process image file.');
      setScanning(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        triggerVoiceScan(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      toast.addToast('🎙️ Recording started... Speak now!', 'info');
    } catch (err) {
      console.error('Error starting recording:', err);
      toast.addToast('❌ Could not access microphone. Please check permissions.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const triggerVoiceScan = async (fileOrBlob) => {
    if (!fileOrBlob) return;
    setScanning(true);
    toast.addToast('⏳ AI is listening to voice note...');

    if (demoMode) {
      setTimeout(() => {
        setAmount('180.00');
        setCategory('Transport');
        setDescription('Paid to Auto Driver');
        toast.addToast('✅ Voice note processed (Demo Mode)! Details filled below.');
        setScanning(false);
      }, 1500);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result.split(',')[1];
          const mimeType = fileOrBlob.type || 'audio/webm';

          const getBackendUrl = () => {
            const envUrl = import.meta.env.VITE_APP_URL;
            if (envUrl && !envUrl.includes('5173')) {
              return envUrl;
            }
            const host = window.location.hostname;
            const protocol = window.location.protocol;
            return `${protocol}//${host}:3000`;
          };
          const backendUrl = getBackendUrl();
          const response = await fetch(`${backendUrl}/api/scan-audio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64String, mimeType })
          });

          if (response.ok) {
            const parsed = await response.json();
            if (parsed && parsed.amount) {
              setAmount(parsed.amount.toString());
              if (parsed.category) {
                const matchedCategory = categories.find(c => c.toLowerCase() === parsed.category.toLowerCase()) || 'Other';
                setCategory(matchedCategory);
              }
              if (parsed.description) {
                setDescription(parsed.description);
              }
              toast.addToast('✅ Voice note parsed successfully! Details filled below.');
            } else {
              toast.addToast('❓ Could not extract details from voice. Please fill manually.');
            }
          } else {
            toast.addToast('❌ Failed to parse voice note. Please fill manually.');
          }
        } catch (err) {
          console.error('Scan Audio API error:', err);
          toast.addToast('❌ Connection error to scan server.');
        } finally {
          setScanning(false);
        }
      };
      reader.readAsDataURL(fileOrBlob);
    } catch (err) {
      console.error('Voice file reader error:', err);
      toast.addToast('❌ Failed to process audio file.');
      setScanning(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !category || !description || !userId) return;
    
    // Combine chosen date with exact current time to avoid resetting to midnight
    const chosenDate = new Date(date);
    const now = new Date();
    chosenDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

    onAdd?.({
      amount: parseFloat(amount),
      category,
      description,
      userId,
      created_at: chosenDate.toISOString(),
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Plus size={20} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Add Expense</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Receipt/Image Scanner Section */}
          <div className="bg-emerald-50/40 rounded-xl p-4 border border-dashed border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📷</span>
              <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Receipt AI Scanner</h3>
            </div>
            <p className="text-[11px] text-gray-500 mb-3">
              Upload a Paytm/PhonePe/GPay screenshot or shop receipt to automatically autofill amount, category, and description using AI.
            </p>
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer">
                <span className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all text-center">
                  {selectedFile ? 'Change Receipt' : 'Upload Receipt'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setSelectedFile(file);
                      triggerScan(file);
                    }
                  }}
                  className="hidden"
                  disabled={scanning}
                />
              </label>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => triggerScan(selectedFile)}
                  disabled={scanning}
                  className="px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-1.5 transition-all flex-shrink-0"
                >
                  {scanning ? (
                    <>
                      <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    'Scan with AI'
                  )}
                </button>
              )}
            </div>
            {selectedFile && !scanning && (
              <p className="text-[11px] text-emerald-700 font-medium mt-2 truncate">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          {/* Voice Note AI Scanner Section */}
          <div className="bg-emerald-50/40 rounded-xl p-4 border border-dashed border-emerald-200 dark:border-emerald-800/40 dark:bg-emerald-950/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🎙️</span>
              <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Voice Note AI Scanner</h3>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
              Record a voice note or upload an audio file. Speak naturally in English, Hindi, or Hinglish to automatically fill amount, category, and description using AI.
            </p>
            <div className="flex items-center gap-3">
              {/* Record Mic Button */}
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={scanning}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all border ${
                  recording 
                    ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400 animate-pulse hover:bg-red-100 dark:hover:bg-red-900/30' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                }`}
              >
                {recording ? (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-red-600 dark:bg-red-400 animate-ping" />
                    Stop & Scan
                  </>
                ) : (
                  <>
                    <span>🎤</span>
                    Record Voice Note
                  </>
                )}
              </button>

              {/* Upload Audio File Input */}
              <label className="flex-1 cursor-pointer">
                <span className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all text-center">
                  {audioFile ? 'Change Audio' : 'Upload Audio'}
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setAudioFile(file);
                      triggerVoiceScan(file);
                    }
                  }}
                  className="hidden"
                  disabled={scanning || recording}
                />
              </label>
            </div>
            {audioFile && !scanning && !recording && (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-2 truncate">
                Selected Audio: {audioFile.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {currency === 'INR' ? '₹' : '$'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  className="w-full pl-8 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-semibold text-gray-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Paid By</label>
            <select
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              required
            >
              <option value="" disabled>Select member</option>
              {members.map(member => (
                <option key={member.id || member.phone} value={member.id || member.phone}>
                  {member.name} ({member.phone || 'No phone'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              required
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {getEmoji(cat)} {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g., Dinner, Groceries, Cab"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
