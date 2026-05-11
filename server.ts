import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { Resend } from "resend";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        let saString = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
        if (saString.startsWith("'") && saString.endsWith("'")) {
            saString = saString.slice(1, -1);
        } else if (saString.startsWith('"') && saString.endsWith('"')) {
            saString = saString.slice(1, -1);
        }
        const serviceAccount = JSON.parse(saString);
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin initialized successfully.");
    } catch (err) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", err);
    }
}

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// API Router
const apiRouter = express.Router();

// Middleware to log all API requests
apiRouter.use((req, res, next) => {
    console.log(`API [${req.method}] ${req.url}`);
    next();
});

apiRouter.get("/health", (req, res) => {
    res.json({
        status: "ok",
        version: "1.6-DIAGNOSTIC",
        firebaseAdmin: !!admin.apps.length,
        resend: !!resend,
        timestamp: new Date().toISOString(),
        endpoints: ["/health", "/update-password", "/register-employee"]
    });
});

apiRouter.post("/update-password", async (req, res) => {
    console.log("API: POST /update-password triggered");
    const { uid, newPassword, email, name } = req.body;

    if (!uid || !newPassword) {
        return res.status(400).json({ error: "UID e Nova Password são obrigatórios." });
    }

    if (!admin.apps.length) {
        return res.status(500).json({ error: "Firebase Admin não configurado." });
    }

    try {
        await admin.auth().updateUser(uid, { password: newPassword });

        const dbId = process.env.FIRESTORE_DATABASE_ID?.replace(/['"]/g, '').trim();
        const db = dbId ? getFirestore(dbId) : getFirestore();
        await db.collection("users").doc(uid).update({ updated_at: new Date().toISOString() });

        if (resend && email) {
            try {
                await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
                    to: email,
                    subject: "Palavra-passe Alterada - Objetivo Similar",
                    html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background-color: #fafafa; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0;">
              
              <div style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 2px solid #00aeef;">
                 <img src="https://firebasestorage.googleapis.com/v0/b/objetivo-similar-mobile.appspot.com/o/public%2Flogo_empresa.png?alt=media" alt="Objetivo Similar" style="max-height: 70px; margin-bottom: 0px;" />
              </div>

              <div style="padding: 40px 30px; background-color: #ffffff;">
                <h1 style="color: #14233c; margin-top: 0; font-size: 22px; font-weight: 800;">Olá ${name || 'Utilizador'}!</h1>
                <p style="color: #475569; font-size: 16px; line-height: 1.5;">A tua palavra-passe foi alterada com sucesso no sistema da <strong>Objetivo Similar</strong>.</p>
                
                <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                  <p style="margin: 0; color: #92400e; font-size: 15px;"><strong>Segurança:</strong> Se não foste tu que realizaste esta alteração, contacta imediatamente o administrador do sistema.</p>
                </div>
                
                <p style="color: #475569; font-size: 16px; line-height: 1.5;">Já podes entrar na aplicação com a tua nova palavra-passe.</p>
              </div>

              <div style="text-align: center; padding: 25px; background-color: #f8fafc; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0;">
                Objetivo Similar Construções Unipessoal Lda - Engenharia e Construção<br>
                Esta é uma mensagem automática.
              </div>
            </div>
          `
                });
                console.log(`Password update email successfully sent to ${email}`);
            } catch (err) {
                console.error("Resend Email Update error:", err);
            }
        } else if (!resend) {
            console.warn("RESEND_API_KEY is not defined, skipping update email.");
        }

        res.json({ success: true });
    } catch (err: any) {
        console.error("Update error:", err);
        res.status(500).json({ error: err.message });
    }
});

apiRouter.post("/register-employee", async (req, res) => {
    const { name, email, role, location_id, password } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Nome e Email são obrigatórios." });
    if (!admin.apps.length) return res.status(500).json({ error: "Firebase Admin não configurado." });

    try {
        const userRecord = await admin.auth().createUser({ email, password, displayName: name });
        const dbId = process.env.FIRESTORE_DATABASE_ID?.replace(/['"]/g, '').trim();
        const db = dbId ? getFirestore(dbId) : getFirestore();

        await db.collection("users").doc(userRecord.uid).set({
            id: userRecord.uid,
            name,
            email: email.toLowerCase(),
            role: role || "colaborador",
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            location_id: location_id || null,
            keycloak_user_id: userRecord.uid
        });

        if (resend) {
            try {
                await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
                    to: email,
                    subject: "Bem-vindo - Objetivo Similar",
                    html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background-color: #fafafa; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0;">
              
              <!-- Cabeçalho / Logo -->
              <div style="background-color: #ffffff; padding: 40px 30px; text-align: center; border-bottom: 2px solid #00aeef;">
                <img src="https://firebasestorage.googleapis.com/v0/b/objetivo-similar-mobile.appspot.com/o/public%2Flogo_empresa.png?alt=media" alt="Objetivo Similar" style="max-height: 80px; margin-bottom: 0px;" />
              </div>

              <!-- Corpo do Email -->
              <div style="padding: 40px 30px; background-color: #ffffff;">
                <h1 style="color: #14233c; margin-top: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Olá ${name}!</h1>
                
                <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
                  Bem-vindo(a) à aplicação da <strong>Objetivo Similar, Unipessoal Lda</strong>. O teu perfil de colaborador foi criado com sucesso e a tua conta já se encontra ativa.
                </p>

                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                  <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 0; margin-bottom: 20px;">As tuas credenciais de acesso</h2>
                  
                  <div style="margin-bottom: 15px;">
                    <span style="font-size: 13px; color: #64748b; display: block; margin-bottom: 4px;">Email / Utilizador</span>
                    <strong style="color: #0f172a; font-size: 16px;">${email}</strong>
                  </div>
                  
                  <div>
                    <span style="font-size: 13px; color: #64748b; display: block; margin-bottom: 4px;">Palavra-passe temporária</span>
                    <div style="background-color: #e0f2fe; color: #0284c7; padding: 10px 15px; border-radius: 6px; display: inline-block; font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 2px;">
                      ${password}
                    </div>
                  </div>
                </div>

                <p style="font-size: 15px; line-height: 1.6; color: #475569;">
                  Recomendamos vivamente que alteres esta palavra-passe no teu primeiro acesso através na área de <strong>Conta &gt; Segurança</strong> da aplicação.
                </p>

                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-top: 30px; margin-bottom: 0;">
                  Com os melhores cumprimentos,<br />
                  <strong>A Direção - Objetivo Similar</strong>
                </p>
              </div>

              <!-- Rodapé -->
              <div style="text-align: center; padding: 30px; background-color: #f1f5f9; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px 0;">
                  Objetivo Similar Construções Unipessoal Lda<br />
                  Construção Civil e Engenharia
                </p>
                <p style="margin: 0; font-size: 11px;">
                  Esta é uma mensagem automática. Por favor, não respondas a este email.
                </p>
              </div>

            </div>
          `
                });
                console.log(`Email successfully sent to ${email}`);
            } catch (e) {
                console.error("Resend Email Error:", e);
            }
        } else {
            console.warn("RESEND_API_KEY is not defined, skipping email sending.");
        }

        res.json({ success: true, uid: userRecord.uid });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.use("/api", apiRouter);

// Global API 404 Handler - MUST match everything under /api not caught by apiRouter
app.all("/api/*", (req, res) => {
    console.log(`[API 404] ${req.method} ${req.url}`);
    res.status(404).json({
        error: "Ruta API não encontrada",
        method: req.method,
        path: req.url,
        hint: "Verifique se o backend está atualizado (Versão 1.6+).",
        available: ["/api/health", "/api/update-password", "/api/register-employee"]
    });
});

// Bootstrap Admin Users
async function bootstrapAdmin() {
    if (!admin.apps.length) return;

    const admins = [
        { email: "ronaldojiconda@gmail.com", name: "Ronaldo Jiconda", role: "super_admin", password: "Jurem@2013" },
        { email: "ronaldopaulino32@hotmail.com", name: "Ronaldo Paulino", role: "super_admin", password: "Jurem@2013" }
    ];

    const dbId = process.env.FIRESTORE_DATABASE_ID?.replace(/['"]/g, '').trim();
    const db = dbId ? getFirestore(dbId) : getFirestore();

    for (const adminData of admins) {
        try {
            let userRecord;
            try {
                userRecord = await admin.auth().getUserByEmail(adminData.email);
            } catch (err: any) {
                if (err.code === 'auth/user-not-found') {
                    userRecord = await admin.auth().createUser({
                        email: adminData.email,
                        password: adminData.password,
                        displayName: adminData.name,
                    });
                } else throw err;
            }

            const userDoc = await db.collection("users").doc(userRecord.uid).get();
            const permissions = {
                id: userRecord.uid,
                name: adminData.name,
                email: adminData.email.toLowerCase(),
                role: adminData.role,
                active: true,
                updated_at: new Date().toISOString(),
                can_manage_projects: true,
                can_manage_employees: true,
                can_view_all_locations: true,
                can_view_users: true,
                keycloak_user_id: userRecord.uid
            };

            if (!userDoc.exists) {
                await db.collection("users").doc(userRecord.uid).set({ ...permissions, created_at: new Date().toISOString() });
            } else {
                await db.collection("users").doc(userRecord.uid).update(permissions);
            }
        } catch (err) { console.error(`Bootstrap error for ${adminData.email}:`, err); }
    }
}

import os from "os";

// Serve Vite
if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
    });
    app.use(vite.middlewares);
} else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
    });
}

function getLocalIps() {
    const interfaces = os.networkInterfaces();
    const results = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]!) {
            if (iface.family === 'IPv4' && !iface.internal) {
                results.push(iface.address);
            }
        }
    }
    return results;
}

app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n========================================`);
    console.log(`  Backend is running on port ${PORT}`);
    console.log(`========================================`);
    console.log(`Local Access:  http://localhost:${PORT}`);

    const ips = getLocalIps();
    if (ips.length > 0) {
        console.log(`Network Access (for mobile device):`);
        ips.forEach(ip => {
            console.log(`  http://${ip}:${PORT}`);
        });
    }
    console.log(`========================================\n`);

    bootstrapAdmin();
});
