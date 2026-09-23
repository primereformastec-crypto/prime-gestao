import http from 'http';
import fs from 'fs';
import path from 'path';
import { 
  getDatabaseState, 
  saveDatabaseState, 
  listBackups, 
  createBackupSnapshot 
} from './apiMiddleware.js';
import { 
  fetchStateFromSupabase, 
  saveStateToSupabase 
} from './supabase.js';

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  // CORS Headers for network access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  // API ROUTE: GET /api/state
  if (pathname === '/api/state' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    fetchStateFromSupabase().then(cloudData => {
      if (cloudData && cloudData.isInitialized) {
        saveDatabaseState(cloudData, false);
        res.statusCode = 200;
        res.end(JSON.stringify(cloudData));
        return;
      }
      const data = getDatabaseState();
      res.statusCode = 200;
      res.end(JSON.stringify(data || { isInitialized: false }));
    }).catch(() => {
      const data = getDatabaseState();
      res.statusCode = 200;
      res.end(JSON.stringify(data || { isInitialized: false }));
    });
    return;
  }

  // API ROUTE: POST /api/sync
  if (pathname === '/api/sync' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        payload.isInitialized = true;
        payload.lastUpdated = new Date().toISOString();
        saveDatabaseState(payload);
        saveStateToSupabase(payload).catch(err => {
          console.warn('[Supabase Sync Warn]:', err);
        });
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, timestamp: payload.lastUpdated }));
      } catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'JSON inválido' }));
      }
    });
    return;
  }

  // API ROUTE: GET /api/backups
  if (pathname === '/api/backups' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    const backups = listBackups();
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, backups }));
    return;
  }

  // API ROUTE: POST /api/backup/create
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

  // API ROUTE: GET /api/backup/download
  if (pathname === '/api/backup/download' && req.method === 'GET') {
    const reqFile = urlObj.searchParams.get('file');
    let targetPath = DB_FILE;
    let downloadName = `prime_gestao_base_${new Date().toISOString().slice(0, 10)}.json`;

    if (reqFile) {
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

  // API ROUTE: POST /api/backup/restore
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

        createBackupSnapshot('Pré-Restauro de Segurança');
        stateToRestore.isInitialized = true;
        stateToRestore.lastUpdated = new Date().toISOString();
        saveDatabaseState(stateToRestore, false);
        saveStateToSupabase(stateToRestore).catch(() => {});

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, restoredState: stateToRestore }));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Erro ao processar restauro de backup' }));
      }
    });
    return;
  }

  // API ROUTE: POST /api/clean
  if (pathname === '/api/clean' && req.method === 'POST') {
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
    saveStateToSupabase(cleanState).catch(() => {});
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, cleanState }));
    return;
  }

  // API ROUTE: POST /api/upload (Base64 file & photo uploader)
  if (pathname === '/api/upload' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { fileName, fileData } = JSON.parse(body);
        if (!fileData) throw new Error('Sem dados de ficheiro');

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

  // Static files in uploads: /uploads/...
  if (pathname.startsWith('/uploads/')) {
    const fileName = path.basename(pathname);
    const filePath = path.join(UPLOADS_DIR, fileName);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  // Static files from dist (SPA)
  let staticPath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(staticPath)) {
    staticPath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(staticPath)) {
    const ext = path.extname(staticPath).toLowerCase();
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    fs.createReadStream(staticPath).pipe(res);
  } else {
    res.statusCode = 404;
    res.end('Not found. Run npm run build first.');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[PRIME Server] Servidor ativo e centralizado em http://0.0.0.0:${PORT}`);
});
