import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

// Ensure all required persistent directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

let lastAutoBackupTime = 0;
const AUTO_BACKUP_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes between auto-snapshots if changed

export function getDatabaseState() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('[Database] Erro ao ler database.json:', err);
  }
  return null;
}

export function createBackupSnapshot(tag = 'Automático', customState = null) {
  try {
    const state = customState || getDatabaseState();
    if (!state) return null;

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const cleanTag = tag.replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_').substring(0, 30);
    const filename = `backup_${dateStr}_${cleanTag}.json`;
    const filePath = path.join(BACKUPS_DIR, filename);

    const counts = {
      leads: state.leads?.length || 0,
      clients: state.clients?.length || 0,
      projects: state.projects?.length || 0,
      employees: state.employees?.length || 0,
      invoices: state.invoices?.length || 0,
      expenses: state.expenses?.length || 0,
      materials: state.materials?.length || 0,
      shifts: state.shifts?.length || 0
    };

    const backupEnvelope = {
      isBackupEnvelope: true,
      backupId: `bck_${Date.now()}`,
      backupTag: tag,
      createdAt: now.toISOString(),
      counts,
      data: state
    };

    fs.writeFileSync(filePath, JSON.stringify(backupEnvelope, null, 2), 'utf-8');
    lastAutoBackupTime = Date.now();

    // Rotate backups: keep maximum 50 newest snapshots
    cleanOldBackups(50);

    return { filename, createdAt: now.toISOString(), tag, counts };
  } catch (err) {
    console.error('[Backup Engine] Erro ao gerar snapshot:', err);
    return null;
  }
}

function cleanOldBackups(maxKeep = 50) {
  try {
    const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
    if (files.length <= maxKeep) return;

    const fileStats = files.map(file => ({
      file,
      path: path.join(BACKUPS_DIR, file),
      mtime: fs.statSync(path.join(BACKUPS_DIR, file)).mtimeMs
    })).sort((a, b) => a.mtime - b.mtime); // oldest first

    const excessCount = fileStats.length - maxKeep;
    for (let i = 0; i < excessCount; i++) {
      fs.unlinkSync(fileStats[i].path);
    }
  } catch (err) {
    console.error('[Backup Engine] Erro na rotação de backups:', err);
  }
}

export function listBackups() {
  try {
    const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
    const list = files.map(filename => {
      const filePath = path.join(BACKUPS_DIR, filename);
      const stat = fs.statSync(filePath);
      let tag = 'Automático';
      let counts = {};
      let createdAt = new Date(stat.mtimeMs).toISOString();

      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.isBackupEnvelope) {
          tag = parsed.backupTag || tag;
          counts = parsed.counts || {};
          createdAt = parsed.createdAt || createdAt;
        } else {
          // Direct state dump
          counts = {
            leads: parsed.leads?.length || 0,
            clients: parsed.clients?.length || 0,
            projects: parsed.projects?.length || 0,
            employees: parsed.employees?.length || 0,
            invoices: parsed.invoices?.length || 0,
            expenses: parsed.expenses?.length || 0,
            materials: parsed.materials?.length || 0,
            shifts: parsed.shifts?.length || 0
          };
        }
      } catch (e) {
        // ignore parse error on metadata
      }

      return {
        filename,
        tag,
        sizeBytes: stat.size,
        sizeFormatted: (stat.size / 1024).toFixed(1) + ' KB',
        createdAt,
        counts
      };
    });

    // Sort newest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('[Backup Engine] Erro ao listar backups:', err);
    return [];
  }
}

export function saveDatabaseState(state, forceBackup = false) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');

    // Auto-create snapshot if interval has elapsed and data exists
    const hasData = (state.clients?.length || 0) > 0 || 
                    (state.projects?.length || 0) > 0 || 
                    (state.leads?.length || 0) > 0 || 
                    (state.invoices?.length || 0) > 0;

    const timeSinceLast = Date.now() - lastAutoBackupTime;
    if (forceBackup || (hasData && timeSinceLast > AUTO_BACKUP_INTERVAL_MS)) {
      createBackupSnapshot('Auto-Sincronização', state);
    }

    return true;
  } catch (err) {
    console.error('[Database] Erro ao guardar database.json:', err);
    return false;
  }
}

export function apiMiddlewarePlugin() {
  return {
    name: 'prime-api-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlObj = new URL(req.url, 'http://localhost');
        const pathname = urlObj.pathname;

        // GET /api/state
        if (pathname === '/api/state' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          const data = getDatabaseState();
          res.statusCode = 200;
          res.end(JSON.stringify(data || { isInitialized: false }));
          return;
        }

        // Helper for non-destructive collection merging across devices (respects deleted IDs)
        function mergeCollectionsById(existing = [], incoming = [], deletedIds = new Set()) {
          if (!incoming || !Array.isArray(incoming)) incoming = [];
          if (!existing || !Array.isArray(existing)) existing = [];
          
          const map = new Map();
          existing.forEach(item => {
            if (item && item.id && !deletedIds.has(item.id)) map.set(item.id, item);
          });
          incoming.forEach(item => {
            if (item && item.id && !deletedIds.has(item.id)) {
              const prev = map.get(item.id);
              map.set(item.id, prev ? { ...prev, ...item } : item);
            }
          });
          return Array.from(map.values());
        }

        // POST /api/delete-entity (Remoção segura e permanente de clientes, obras, etc.)
        if (pathname === '/api/delete-entity' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { entityType, id, deleteAssociatedProjects } = JSON.parse(body || '{}');
              if (!entityType || !id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'entityType e id são obrigatórios' }));
                return;
              }

              const currentState = getDatabaseState() || {};
              if (Array.isArray(currentState[entityType])) {
                currentState[entityType] = currentState[entityType].filter(item => item && item.id !== id);
              }

              if (entityType === 'clients' && deleteAssociatedProjects && Array.isArray(currentState.projects)) {
                currentState.projects = currentState.projects.filter(p => p && p.clientId !== id);
              }

              if (!Array.isArray(currentState.deletedEntityIds)) currentState.deletedEntityIds = [];
              if (!currentState.deletedEntityIds.includes(id)) {
                currentState.deletedEntityIds.push(id);
              }

              currentState.lastUpdated = new Date().toISOString();
              saveDatabaseState(currentState, true);

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, id, entityType }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // POST /api/sync
        if (pathname === '/api/sync' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              const currentState = getDatabaseState() || {};
              const combinedDeleted = new Set([
                ...(payload.deletedEntityIds || []),
                ...(currentState.deletedEntityIds || [])
              ]);

              const mergedPayload = {
                ...currentState,
                ...payload,
                clients: mergeCollectionsById(currentState.clients, payload.clients, combinedDeleted),
                projects: mergeCollectionsById(currentState.projects, payload.projects, combinedDeleted),
                leads: mergeCollectionsById(currentState.leads, payload.leads, combinedDeleted),
                employees: mergeCollectionsById(currentState.employees, payload.employees, combinedDeleted),
                tools: mergeCollectionsById(currentState.tools, payload.tools, combinedDeleted),
                materialStock: mergeCollectionsById(currentState.materialStock, payload.materialStock, combinedDeleted),
                shifts: mergeCollectionsById(currentState.shifts, payload.shifts, combinedDeleted),
                invoices: mergeCollectionsById(currentState.invoices, payload.invoices, combinedDeleted),
                expenses: mergeCollectionsById(currentState.expenses, payload.expenses, combinedDeleted),
                materials: mergeCollectionsById(currentState.materials, payload.materials, combinedDeleted),
                deletedEntityIds: Array.from(combinedDeleted),
                isInitialized: true,
                lastUpdated: new Date().toISOString()
              };
              saveDatabaseState(mergedPayload);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, timestamp: mergedPayload.lastUpdated, state: mergedPayload }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'JSON inválido' }));
            }
          });
          return;
        }

        // GET /api/backups (Lista histórico de backups do servidor)
        if (pathname === '/api/backups' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          const backups = listBackups();
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, backups }));
          return;
        }

        // POST /api/backup/create (Criar ponto de restauro imediato)
        if (pathname === '/api/backup/create' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = body ? JSON.parse(body) : {};
              const tag = parsed.tag || 'Ponto Manual';
              const result = createBackupSnapshot(tag);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, backup: result }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Erro ao gerar backup manual' }));
            }
          });
          return;
        }

        // GET /api/backup/download (Descarregar ficheiro de backup)
        if (pathname === '/api/backup/download' && req.method === 'GET') {
          const reqFile = urlObj.searchParams.get('file');
          let targetPath = DB_FILE;
          let downloadName = `prime_gestao_base_${new Date().toISOString().slice(0, 10)}.json`;

          if (reqFile) {
            // sanitize filename to avoid directory traversal
            const safeFile = path.basename(reqFile);
            targetPath = path.join(BACKUPS_DIR, safeFile);
            downloadName = safeFile;
          }

          if (fs.existsSync(targetPath)) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
            const fileStream = fs.createReadStream(targetPath);
            fileStream.pipe(res);
            return;
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Ficheiro de backup não encontrado' }));
            return;
          }
        }

        // POST /api/backup/restore (Restaurar versão anterior)
        if (pathname === '/api/backup/restore' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { filename, backupData } = JSON.parse(body);
              let stateToRestore = null;

              if (filename) {
                const safeFile = path.basename(filename);
                const filePath = path.join(BACKUPS_DIR, safeFile);
                if (!fs.existsSync(filePath)) {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ error: 'Ficheiro de backup selecionado não existe' }));
                  return;
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                const parsed = JSON.parse(content);
                stateToRestore = parsed.isBackupEnvelope ? parsed.data : parsed;
              } else if (backupData) {
                stateToRestore = backupData.isBackupEnvelope ? backupData.data : backupData;
              }

              if (!stateToRestore) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Dados de restauro inválidos' }));
                return;
              }

              // Pre-restore safety snapshot of CURRENT state before overwriting
              createBackupSnapshot('Pré-Restauro de Segurança');

              // Apply restoration
              stateToRestore.isInitialized = true;
              stateToRestore.lastUpdated = new Date().toISOString();
              saveDatabaseState(stateToRestore, false);

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, restoredState: stateToRestore }));
            } catch (err) {
              console.error('[Backup Engine] Erro ao restaurar:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Erro ao processar restauro de backup' }));
            }
          });
          return;
        }

        // POST /api/clean
        if (pathname === '/api/clean' && req.method === 'POST') {
          // Pre-clean safety snapshot before erasing
          createBackupSnapshot('Pré-Limpeza de Sistema');

          const cleanState = {
            isInitialized: true,
            isCleanMode: true,
            lastUpdated: new Date().toISOString(),
            leads: [],
            clients: [],
            projects: [],
            stages: [],
            employees: [],
            shifts: [],
            materials: [],
            expenses: [],
            fixedExpenses: [],
            invoices: [],
            payments: [],
            milestones: [],
            changeOrders: [],
            dailyLogs: [],
            photos: [],
            documents: []
          };
          saveDatabaseState(cleanState, false);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, cleanState }));
          return;
        }

        // POST /api/upload (Base64 file uploader)
        if (pathname === '/api/upload' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { fileName, fileData } = JSON.parse(body);
              if (!fileData) throw new Error('Sem dados de ficheiro');

              // Extract base64 part
              const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              const extension = path.extname(fileName) || '.bin';
              const safeName = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${extension}`;
              const filePath = path.join(UPLOADS_DIR, safeName);

              if (matches && matches.length === 3) {
                fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
              } else {
                fs.writeFileSync(filePath, fileData);
              }

              const publicUrl = `/uploads/${safeName}`;
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, url: publicUrl, fileName: safeName }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}
