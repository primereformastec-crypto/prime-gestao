import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Smartphone, MapPin, Clock, Camera, CheckCircle2, 
  Send, AlertCircle, Building2, User, Sparkles, Navigation 
} from 'lucide-react';

export const WorkerDayView: React.FC = () => {
  const { currentUser, projects, stages, addShift, toggleSubtask, addPhoto } = useApp();

  const [clockedIn, setClockedIn] = useState(true);
  const [clockInTime, setClockInTime] = useState('08:00');
  const [clockOutTime, setClockOutTime] = useState('');
  const [shiftHours, setShiftHours] = useState(8);
  const [workNotes, setWorkNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Today's assigned project for worker (e.g. OB-0001 for Gustavo)
  const todayProject = projects.find(p => p.id === 'OB-0001') || projects[0];
  const todayStages = stages.filter(s => s.projectId === todayProject?.id);
  const currentStage = todayStages.find(s => s.status === 'em_execucao') || todayStages[0];

  const handleClockToggle = () => {
    if (clockedIn) {
      const now = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
      setClockOutTime(now);
      setClockedIn(false);
    } else {
      const now = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
      setClockInTime(now);
      setClockedIn(true);
    }
  };

  const handleSubmitShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todayProject) return;

    addShift({
      projectId: todayProject.id,
      employeeId: currentUser.employeeId || 'EMP-01',
      date: new Date().toISOString().slice(0, 10),
      type: 'diaria',
      hours: shiftHours,
      rate: 90,
      totalValue: 90,
      status: 'pendente',
      notes: workNotes || 'Diária registada via telemóvel Meu Dia'
    });

    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleRealPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !todayProject) return;

    setIsUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawData = event.target?.result as string;

        // Compress image using canvas
        const img = new window.Image();
        img.src = rawData;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

          // Try uploading to server
          let photoUrl = compressedDataUrl;
          try {
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: file.name || 'foto_obra.jpg',
                fileData: compressedDataUrl
              })
            });
            const resData = await res.json();
            if (resData.url) {
              photoUrl = resData.url;
            }
          } catch (err) {
            console.warn('Upload servidor falhou, salvando inline data-url:', err);
          }

          addPhoto({
            projectId: todayProject.id,
            date: new Date().toISOString().slice(0, 10),
            url: photoUrl,
            caption: `Foto de campo enviada por ${currentUser.name}`,
            category: 'execucao',
            employeeName: currentUser.name
          });
          setIsUploadingPhoto(false);
          alert('✓ Fotografia real da obra guardada com sucesso!');
        };
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsUploadingPhoto(false);
      alert('Erro ao carregar fotografia');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-5 pb-20">
      {/* Top Mobile Bar */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm font-bold">{currentUser.name}</h2>
              <span className="text-[11px] text-amber-400 font-medium">Especialista em Obra</span>
            </div>
          </div>
          <span className="text-xs text-slate-400">Terça, 22/09</span>
        </div>
      </div>

      {/* Today Job Site Card */}
      {todayProject && (
        <div className="prime-card p-5 space-y-4 border-l-4 border-l-sky-500 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                {todayProject.id}
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Obra Atribuída Hoje
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-2">{todayProject.title}</h3>
            
            <div className="mt-2 text-xs text-slate-600 space-y-1">
              <p className="flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="font-medium">{todayProject.address}</span>
              </p>
              <p className="text-[11px] text-slate-400 pl-5">Gestor Responsável: {todayProject.managerId}</p>
            </div>
          </div>

          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(todayProject.address)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Navigation className="w-3.5 h-3.5 text-sky-600" />
            <span>Abrir Rota no Google Maps</span>
          </a>
        </div>
      )}

      {/* Clock In / Out & Shift Registration */}
      <div className="prime-card p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-sky-600" />
          <span>Registo de Ponto & Presença</span>
        </h3>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Entrada de Hoje:</span>
            <span className="font-bold text-slate-900 text-sm font-mono">{clockInTime}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Saída Prevista:</span>
            <span className="font-bold text-slate-900 text-sm font-mono">{clockOutTime || '17:00'}</span>
          </div>
          <button
            onClick={handleClockToggle}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
              clockedIn 
                ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {clockedIn ? 'Bater Saída' : 'Bater Entrada'}
          </button>
        </div>

        {/* Shift submission form */}
        <form onSubmit={handleSubmitShift} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              O que executou hoje na obra?
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Assentei cerâmicos no WC e preparei chão..."
              value={workNotes}
              onChange={e => setWorkNotes(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleRealPhotoUpload}
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Camera className="w-4 h-4 text-slate-500" />
              <span>{isUploadingPhoto ? 'A guardar foto...' : 'Tirar Foto da Obra'}</span>
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar Diária</span>
            </button>
          </div>

          {submitted && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center animate-in fade-in">
              ✓ Diária de hoje enviada para aprovação do gestor!
            </div>
          )}
        </form>
      </div>

      {/* Today's Tasks Checklist */}
      {currentStage && (
        <div className="prime-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tarefas Atuais da Etapa
            </h3>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
              {currentStage.name}
            </span>
          </div>

          <div className="space-y-2">
            {currentStage.subtasks.map(sub => (
              <div
                key={sub.id}
                onClick={() => toggleSubtask(currentStage.id, sub.id)}
                className={`p-3 rounded-xl border text-xs flex items-center gap-3 cursor-pointer transition-all ${
                  sub.completed ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${sub.completed ? 'bg-emerald-600 text-white' : 'border border-slate-300'}`}>
                  {sub.completed && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <span className={sub.completed ? 'line-through text-slate-500' : 'text-slate-800'}>
                  {sub.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
