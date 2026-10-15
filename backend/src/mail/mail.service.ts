import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

type MailContext = Record<string, string | number>;

const templates: Record<string, (ctx: MailContext) => { subject: string; html: string }> = {
  welcome: (ctx) => ({
    subject: "Bienvenue sur SamaDokita — Votre essai de 30 jours est activé",
    html: wrapper(`
      <h1 style="margin:0 0 16px">Bonjour ${escapeHtml(String(ctx.firstName ?? ""))} 👋</h1>
      <p style="margin:0 0 12px">Votre infrastructure <strong>${escapeHtml(String(ctx.infraName ?? ""))}</strong> est enregistrée sur SamaDokita.</p>
      <p style="margin:0 0 12px">Votre essai gratuit de <strong>30 jours</strong> est actif. Vous pouvez inviter jusqu'à 5 utilisateurs et enregistrer 500 patients.</p>
      <p style="margin:0">L'équipe SamaDokita</p>
    `),
  }),
  resetPassword: (ctx) => ({
    subject: "Réinitialisation de votre mot de passe SamaDokita",
    html: wrapper(`
      <h1 style="margin:0 0 16px">Réinitialisation du mot de passe</h1>
      <p style="margin:0 0 16px">Bonjour ${escapeHtml(String(ctx.firstName ?? ""))}, vous avez demandé à réinitialiser votre mot de passe.</p>
      <p style="margin:0 0 20px">Ce lien expire dans <strong>15 minutes</strong> :</p>
      <a href="${escapeHtml(String(ctx.resetUrl ?? ""))}" style="display:inline-block;padding:12px 20px;background:#0d9488;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Réinitialiser mon mot de passe</a>
      <p style="margin:20px 0 0;color:#64748b;font-size:13px">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `),
  }),
  twoFactorEnabled: (ctx) => ({
    subject: "Double authentification activée — SamaDokita",
    html: wrapper(`
      <h1 style="margin:0 0 16px">2FA activée</h1>
      <p style="margin:0">Bonjour ${escapeHtml(String(ctx.firstName ?? ""))}, la double authentification (TOTP) est maintenant active sur votre compte SamaDokita. Votre compte est renforcé.</p>
    `),
  }),
  generic: (ctx) => ({
    subject: String(ctx.subject ?? "Notification SamaDokita"),
    html: wrapper(`
      <h1 style="margin:0 0 16px">${escapeHtml(String(ctx.title ?? "Notification"))}</h1>
      <p style="margin:0">${escapeHtml(String(ctx.message ?? ""))}</p>
    `),
  }),
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapper(inner: string): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.08)">
    ${inner}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px">
    <p style="margin:0;color:#94a3b8;font-size:12px">SamaDokita — Dossier Médical National du Sénégal. Cet email est envoyé automatiquement, merci de ne pas y répondre.</p>
  </div>
</body></html>`;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly enabled: boolean;

  constructor(config: ConfigService) {
    const host = config.get<string>("SMTP_HOST");
    const port = Number(config.get<string>("SMTP_PORT") ?? 587);
    const user = config.get<string>("SMTP_USER");
    const pass = config.get<string>("SMTP_PASS");
    this.from = config.get<string>("MAIL_FROM") ?? "SamaDokita <no-reply@samadokita.sn>";
    this.enabled = Boolean(host && user && pass);

    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        pool: true,
        maxConnections: 5,
      });
      void this.transporter.verify().then(
        () => this.logger.log("SMTP vérifié et opérationnel"),
        (err: Error) => this.logger.warn(`SMTP non vérifié: ${err.message}`)
      );
    } else {
      this.transporter = null;
      this.logger.warn("SMTP non configuré (SMTP_HOST/SMTP_USER/SMTP_PASS) — emails désactivés");
    }
  }

  async send(to: string, template: string, ctx: MailContext = {}): Promise<boolean> {
    if (!this.enabled || !this.transporter) return false;
    const build = templates[template] ?? templates.generic;
    const { subject, html } = build(ctx);
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email "${template}" envoyé à ${to}`);
      return true;
    } catch (err) {
      this.logger.error(`Échec envoi email "${template}" à ${to}: ${(err as Error).message}`);
      return false;
    }
  }

  get isConfigured(): boolean {
    return this.enabled;
  }
}
