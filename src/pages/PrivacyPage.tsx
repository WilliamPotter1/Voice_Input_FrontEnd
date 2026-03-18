import { useTranslation } from '../i18n/useTranslation';

export function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* German version */}
      <div className="mt-2 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-800 shadow-sm">
        <header className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Datenschutzerklärung für awodo24.com</h1>
            <div className="text-sm text-slate-700">
              <p>
                <span className="font-semibold">Stand:</span> 17.03.2026
              </p>
              <p>
                <span className="font-semibold">Anbieter:</span> awodo24.com
              </p>
            </div>
        </header>
        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">1. Einleitung</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>
            Der Schutz personenbezogener Daten ist uns wichtig. Mit dieser Datenschutzerklärung informieren wir dich
            über die Erhebung, Verarbeitung und Nutzung deiner Daten bei Nutzung unserer SaaS-Plattform awodo24.com.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">2. Verantwortlicher</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>Verantwortlich für die Datenverarbeitung nach DSGVO ist:</p>
          <p>Awodo24.com</p>
          <p>Adresse: Grünecker Str. 11e, 85375 Neufahrn</p>
          <p>E-Mail: info@awodo24.com</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">
            3. Erhebung und Nutzung personenbezogener Daten
          </h3>
          <div className="h-px w-full bg-slate-200" />
          <p>
            Wir verarbeiten Daten ausschließlich zum Betrieb der Plattform, zur Erbringung unserer Leistungen und zur
            Abrechnung.
          </p>
          <p>
            <span className="font-semibold">3.1 Bei Registrierung / Kontoerstellung:</span>
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Name, E-Mail-Adresse, Telefonnummer</li>
            <li>Unternehmensdaten (falls relevant)</li>
            <li>Passwort (verschlüsselt gespeichert)</li>
          </ul>
          <p>
            <span className="font-semibold">3.2 Bei Nutzung der App:</span>
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Angebote, Inhalte und Metadaten, die du erstellst</li>
            <li>Log-Daten, z. B. Anmeldungen, Nutzungshäufigkeit, technische Daten des Endgeräts</li>
            <li>IP-Adresse zur Sicherheits- und Betrugsprävention</li>
          </ul>
          <p>
            <span className="font-semibold">3.3 Bei Zahlungsabwicklung:</span>
          </p>
          <p>
            Zahlungsinformationen (z. B. Kreditkarte, PayPal) werden direkt von Zahlungsdienstleistern verarbeitet; wir
            haben keinen direkten Zugriff auf Kartendaten.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">4. Rechtsgrundlage</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>Die Verarbeitung erfolgt auf Basis von:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</li>
            <li>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung, z. B. Newsletter)</li>
            <li>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse, z. B. Sicherheit, Betrugsprävention)</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">5. Weitergabe von Daten</h3>
          <div className="h-px w-full bg-slate-200" />
          <ul className="list-disc space-y-1 pl-5">
            <li>An Dienstleister für Hosting, Zahlungsabwicklung, E-Mail-Versand, Analyse (alle DSGVO-konform)</li>
            <li>Keine Weitergabe an unbefugte Dritte</li>
            <li>Verpflichtung der Dienstleister auf Datenschutz</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">6. Cookies und Tracking</h3>
          <div className="h-px w-full bg-slate-200" />
          <ul className="list-disc space-y-1 pl-5">
            <li>Session-Cookies zur Nutzung der Plattform</li>
            <li>Optionale Analyse-Cookies (z. B. Google Analytics, nur anonymisiert, falls aktiviert)</li>
            <li>Möglichkeit zur Zustimmung oder Ablehnung von Cookies beim ersten Besuch</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">7. Datenspeicherung</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>
            Daten werden nur so lange gespeichert, wie es für Vertragszwecke, gesetzliche Aufbewahrungspflichten oder
            berechtigte Interessen erforderlich ist. Nach Ablauf werden Daten sicher gelöscht oder anonymisiert.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">8. Rechte der Nutzer</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>Du hast jederzeit:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Recht auf Auskunft über deine gespeicherten Daten</li>
            <li>Recht auf Berichtigung unrichtiger Daten</li>
            <li>Recht auf Löschung („Recht auf Vergessenwerden“)</li>
            <li>Recht auf Einschränkung der Verarbeitung</li>
            <li>Recht auf Datenübertragbarkeit</li>
            <li>Widerspruch gegen Verarbeitung aus berechtigtem Interesse</li>
            <li>Recht auf Widerruf einer Einwilligung (z. B. Newsletter)</li>
          </ul>
          <p>Kontakt für Datenschutzanfragen: info@awodo24.com</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">9. Datensicherheit</h3>
          <div className="h-px w-full bg-slate-200" />
          <ul className="list-disc space-y-1 pl-5">
            <li>Einsatz von SSL/TLS für verschlüsselte Datenübertragung</li>
            <li>Passwortverschlüsselung</li>
            <li>Zugriffsbeschränkungen intern</li>
            <li>Regelmäßige Sicherheitsupdates</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">10. Änderungen der Datenschutzerklärung</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>
            Wir können diese Datenschutzerklärung aktualisieren. Änderungen werden auf der Plattform veröffentlicht und
            mit Version/Datum gekennzeichnet.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">11. Internationale Datenübermittlung</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>
            Daten können ggf. an Dienstleister innerhalb der EU oder in Drittländer übermittelt werden. Übermittlung
            erfolgt nur, wenn angemessene Schutzmaßnahmen bestehen (z. B. Standardvertragsklauseln).
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">12. Kontakt</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>
            Bei Fragen zum Datenschutz oder Ausübung deiner Rechte wende dich an: <strong>info@awodo24.com</strong>
          </p>
        </section>
      </div>

      {/* English version */}
      <div className="mt-6 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-800 shadow-sm">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Policy for awodo24.com</h1>
          <div className="text-sm text-slate-700">
            <p>
              <span className="font-semibold">Effective Date:</span> 17.03.2026
            </p>
            <p>
              <span className="font-semibold">Provider:</span> awodo24.com
            </p>
          </div>
        </header>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">1. Introduction</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>
            Protecting your personal data is important to us. This privacy policy explains how we collect, process, and
            use your data when you use our SaaS platform awodo24.com.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">2. Data Controller</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>The data controller responsible under GDPR is:</p>
          <p>awodo24.com</p>
          <p>Address: Grünecker Str. 11e, 85375 Neufahrn</p>
          <p>Email: info@awodo24.com</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">3. Collection and Use of Personal Data</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>
            We process your data only for operating the platform, providing services, and billing purposes.
          </p>
          <p>
            <span className="font-semibold">3.1 Account Registration:</span>
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Name, email address, phone number</li>
            <li>Company information (if applicable)</li>
            <li>Password (stored securely, encrypted)</li>
          </ul>
          <p>
            <span className="font-semibold">3.2 App Usage:</span>
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Offers, content, and metadata you create</li>
            <li>Log data such as login times, usage frequency, device information</li>
            <li>IP address for security and fraud prevention</li>
          </ul>
          <p>
            <span className="font-semibold">3.3 Payment Processing:</span>
          </p>
          <p>
            Payment information (credit card, PayPal, etc.) is processed directly by third-party payment providers; we
            do not have direct access to card details.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">4. Legal Basis</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>Data processing is based on:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Art. 6(1)(b) GDPR – performance of contract</li>
            <li>Art. 6(1)(a) GDPR – consent (e.g., newsletters)</li>
            <li>Art. 6(1)(f) GDPR – legitimate interest (e.g., security, fraud prevention)</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">5. Sharing of Data</h3>
          <div className="h-px w-full bg-slate-200" />
          <ul className="list-disc space-y-1 pl-5">
            <li>
              To service providers for hosting, payment processing, email delivery, analytics (all GDPR compliant)
            </li>
            <li>No disclosure to unauthorized third parties</li>
            <li>Service providers are contractually bound to data protection</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">6. Cookies and Tracking</h3>
          <div className="h-px w-full bg-slate-200" />
          <ul className="list-disc space-y-1 pl-5">
            <li>Session cookies for platform use</li>
            <li>Optional analytics cookies (e.g., Google Analytics, anonymized, only if activated)</li>
            <li>Users can accept or decline cookies on first visit</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">7. Data Retention</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>
            Data is stored only as long as necessary for contract purposes, legal obligations, or legitimate interests.
            After expiration, data is securely deleted or anonymized.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">8. User Rights</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>You have the right to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Access your stored personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion (“right to be forgotten”)</li>
            <li>Restrict processing</li>
            <li>Data portability</li>
            <li>Object to processing based on legitimate interest</li>
            <li>Withdraw consent (e.g., newsletter)</li>
          </ul>
          <p>Data protection contact: info@awodo24.com</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">9. Data Security</h3>
          <div className="h-px w-full bg-slate-200" />
          <ul className="list-disc space-y-1 pl-5">
            <li>SSL/TLS encryption for data transmission</li>
            <li>Password encryption</li>
            <li>Internal access restrictions</li>
            <li>Regular security updates</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">10. Changes to the Privacy Policy</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>
            We may update this privacy policy. Changes will be published on the platform with version and date
            information.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">11. International Data Transfer</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>
            Data may be transferred to providers within the EU or to third countries. Transfers are made only if
            adequate protection measures exist (e.g., standard contractual clauses).
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">12. Contact</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>
            For questions about privacy or to exercise your rights, contact: <strong>info@awodo24.com</strong>
          </p>
        </section>
      </div>
    </div>
  );
}

