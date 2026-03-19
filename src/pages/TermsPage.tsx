export function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Main card */}
      <div className="mt-2 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-800 shadow-sm">
        {/* 1. Geltungsbereich */}
        <header className="min-w-0 space-y-1">
        <h1 className="break-words hyphens-auto text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">
          Allgemeine Geschäftsbedingungen (AGB) – SaaS‑App
        </h1>
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
          <h2 className="text-lg font-semibold text-slate-900">1. Geltungsbereich</h2>
          <div className="h-px w-full bg-slate-200" />
          <p>
            1.1 Diese AGB gelten für alle Verträge zwischen dem Anbieter der SaaS-Plattform{' '}
            <span className="font-semibold">awodo24.com</span> („Anbieter“) und Nutzern („Kunde“).
          </p>
          <p>
            1.2 Abweichende oder ergänzende Bedingungen des Kunden werden nur wirksam, wenn sie vom Anbieter
            schriftlich bestätigt wurden.
          </p>
        </section>

        {/* 2. Vertragsgegenstand */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">2. Vertragsgegenstand</h2>
          <div className="h-px w-full bg-slate-200" />
          <p>
            2.1 Der Anbieter stellt über die Plattform eine Software-as-a-Service-Lösung bereit, mit der Nutzer
            Angebote erstellen, verwalten und versenden können.
          </p>
          <p>2.2 Die Nutzung erfolgt über Web- und Mobile-Apps.</p>
        </section>

        {/* 3. Registrierung und Nutzerkonto */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">3. Registrierung und Nutzerkonto</h2>
          <div className="h-px w-full bg-slate-200" />
          <p>3.1 Für die Nutzung ist eine Registrierung erforderlich.</p>
          <p>3.2 Der Kunde ist für die Geheimhaltung von Zugangsdaten verantwortlich.</p>
          <p>3.3 Der Kunde haftet für alle Aktivitäten, die unter seinem Konto erfolgen.</p>
          <p>3.4 Änderungen der Kontaktdaten müssen unverzüglich mitgeteilt werden.</p>
        </section>

        {/* 4. Tarife & Leistungsumfang (table like in the doc) */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">4. Tarife &amp; Leistungsumfang</h2>
          <div className="h-px w-full bg-slate-200" />
          <div className="overflow-x-auto">
            <table className="min-w-[860px] table-fixed border border-slate-200 text-xs sm:text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-44 border-b border-slate-200 px-3 py-2 text-left font-semibold">Plan</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold">Angebote/Monat</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold">Nutzer</th>
                  <th className="w-[300px] border-b border-slate-200 px-3 py-2 text-left font-semibold">Features</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold">Preis/Monat</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-b border-slate-100 px-3 py-2 font-medium">Basis+</td>
                  <td className="border-b border-slate-100 px-3 py-2">bis 50</td>
                  <td className="border-b border-slate-100 px-3 py-2">1</td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    Grundfunktionen: Angebotserstellung, PDF-Export, E-Mail/WhatsApp-Versand
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">€29</td>
                </tr>
                <tr className="bg-slate-50/60">
                  <td className="border-b border-slate-100 px-3 py-2 font-medium">Premium</td>
                  <td className="border-b border-slate-100 px-3 py-2">bis 250</td>
                  <td className="border-b border-slate-100 px-3 py-2">bis 5</td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    Alle Grundfunktionen + Teamarbeit, Branding-PDFs, priorisierter Support
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">€69</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Platinum</td>
                  <td className="px-3 py-2">unbegrenzt</td>
                  <td className="px-3 py-2">unbegrenzt</td>
                  <td className="px-3 py-2">
                    Alle Funktionen + Platinum-Features, persönlicher Support, früher Zugriff auf neue Funktionen
                  </td>
                  <td className="px-3 py-2">individuell</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 5–13 like in your text, with rules between sections */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">5. Preise und Zahlung</h2>
          <div className="h-px w-full bg-slate-200" />
          <p>5.1 Alle Preise verstehen sich ohne der gesetzlichen Mehrwertsteuer.</p>
          <p>5.2 Die Zahlung erfolgt monatlich im Voraus.</p>
          <p>5.3 Preisänderungen werden mindestens 30 Tage vorher angekündigt.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">6. Vertragsdauer und Kündigung</h2>
          <div className="h-px w-full bg-slate-200" />
          <p>6.1 Der Vertrag beginnt mit der Freischaltung des Kontos.</p>
          <p>
            6.2 Der Vertrag läuft auf unbestimmte Zeit und kann von beiden Parteien mit einer Frist von 30 Tagen zum
            Monatsende gekündigt werden.
          </p>
          <p>6.3 Das Recht zur außerordentlichen Kündigung bleibt unberührt.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">7. Nutzungspflichten des Kunden</h2>
          <div className="h-px w-full bg-slate-200" />
          <p>7.1 Der Kunde darf die Plattform nur im rechtlich zulässigen Rahmen nutzen.</p>
          <p>7.2 Es ist untersagt, Inhalte hochzuladen, die Rechte Dritter verletzen oder gesetzeswidrig sind.</p>
          <p>7.3 Der Kunde sollte regelmäßige Backups seiner Daten erstellen.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">8. Verfügbarkeit &amp; Wartung</h2>
          <div className="h-px w-full bg-slate-200" />
          <p>
            8.1 Der Anbieter bemüht sich um hohe Verfügbarkeit der Plattform, übernimmt jedoch keine ununterbrochene
            Verfügbarkeit.
          </p>
          <p>
            8.2 Wartungsarbeiten können kurzfristig durchgeführt werden. Der Anbieter bemüht sich, diese anzukündigen.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">9. Haftung</h2>
          <div className="h-px w-full bg-slate-200" />
          <p>9.1 Der Anbieter haftet nur für vorsätzlich oder grob fahrlässig verursachte Schäden.</p>
          <p>
            9.2 Für mittelbare Schäden, entgangenen Gewinn oder Datenverlust haftet der Anbieter nur, soweit gesetzlich
            zwingend vorgeschrieben.
          </p>
          <p>9.3 Der Anbieter haftet nicht für Schäden durch Dritte oder Drittsoftware.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">10. Datenschutz</h2>
          <div className="h-px w-full bg-slate-200" />
          <p>10.1 Der Anbieter verarbeitet personenbezogene Daten gemäß der Datenschutzerklärung.</p>
          <p>
            10.2 Der Kunde stimmt zu, dass seine Daten für den Betrieb der Plattform gespeichert und verarbeitet werden.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">11. Rechte an Software &amp; Inhalten</h2>
          <div className="h-px w-full bg-slate-200" />
          <p>
            11.1 Die Plattform und alle enthaltenen Programme, Designs und Inhalte bleiben Eigentum des Anbieters.
          </p>
          <p>
            11.2 Der Kunde erhält ein einfaches, nicht übertragbares Nutzungsrecht, abhängig vom gewählten Tarif.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">12. Änderungen der AGB</h2>
          <div className="h-px w-full bg-slate-200" />
          <p>
            12.1 Der Anbieter kann diese AGB ändern. Änderungen werden 30 Tage vorher per E-Mail oder
            Plattformmitteilung angekündigt.
          </p>
          <p>12.2 Widerspricht der Kunde nicht innerhalb von 30 Tagen, gelten die Änderungen als angenommen.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">13. Schlussbestimmungen</h2>
          <div className="h-px w-full bg-slate-200" />
          <p>13.1 Es gilt deutsches Recht.</p>
          <p>13.2 Gerichtsstand ist der Sitz des Anbieters.</p>
          <p>13.3 Sollten einzelne Bestimmungen unwirksam sein, bleiben die übrigen Bestimmungen unberührt.</p>
        </section>
      </div>

      {/* English version below German */}
      <div className="mt-6 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-800 shadow-sm">
        <header className="min-w-0 space-y-1">
        <h1 className="break-words hyphens-auto text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">Terms &amp; Conditions (T&amp;C) – SaaS App</h1>
          <div className="text-sm text-slate-700">
            <p>
              <span className="font-semibold">Version:</span> 17.03.2026
            </p>
            <p>
              <span className="font-semibold">Provider:</span> awodo24.com
            </p>
          </div>
        </header>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">1. Scope</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>
            1.1 These Terms &amp; Conditions (T&amp;C) apply to all contracts between the provider awodo24.com
            (“Provider”) and users (“Customer”).
          </p>
          <p>
            1.2 Deviating or additional terms of the Customer are only effective if confirmed in writing by the
            Provider.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">2. Subject of Contract</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>
            2.1 The Provider offers a Software-as-a-Service (SaaS) solution that enables users to create, manage, and
            send quotes.
          </p>
          <p>2.2 Access is provided via web and mobile applications.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">3. Registration &amp; Account</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>3.1 Registration is required to use the platform.</p>
          <p>3.2 The Customer is responsible for keeping login credentials confidential.</p>
          <p>3.3 The Customer is liable for all activities conducted under their account.</p>
          <p>3.4 Changes to contact information must be reported immediately.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-semibold text-slate-900">4. Plans &amp; Features</h3>
          <div className="h-px w-full bg-slate-200" />
          <div className="overflow-x-auto">
            <table className="min-w-[860px] table-fixed border border-slate-200 text-xs sm:text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-44 border-b border-slate-200 px-3 py-2 text-left font-semibold">Plan</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold">Offers/Month</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold">Users</th>
                  <th className="w-[300px] border-b border-slate-200 px-3 py-2 text-left font-semibold">Features</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold">Price/Month</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-b border-slate-100 px-3 py-2 font-medium">Basis+</td>
                  <td className="border-b border-slate-100 px-3 py-2">up to 50</td>
                  <td className="border-b border-slate-100 px-3 py-2">1</td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    Basic features: quote creation, PDF export, email/WhatsApp sending
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">€29</td>
                </tr>
                <tr className="bg-slate-50/60">
                  <td className="border-b border-slate-100 px-3 py-2 font-medium">Premium</td>
                  <td className="border-b border-slate-100 px-3 py-2">up to 250</td>
                  <td className="border-b border-slate-100 px-3 py-2">up to 5</td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    All basic features + team collaboration, branding PDFs, priority support
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">€69</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Platinum</td>
                  <td className="px-3 py-2">unlimited</td>
                  <td className="px-3 py-2">unlimited</td>
                  <td className="px-3 py-2">
                    All features + Platinum features, personal support, early access to new features
                  </td>
                  <td className="px-3 py-2">Individual</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">5. Prices &amp; Payment</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>5.1 All prices are exclusive of VAT.</p>
          <p>5.2 Payment is made monthly in advance via the chosen payment method.</p>
          <p>5.3 Price changes will be communicated at least 30 days in advance.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">6. Duration &amp; Termination</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>6.1 The contract begins with account activation.</p>
          <p>
            6.2 The contract is open-ended and may be terminated by either party with 30 days’ notice to the end of the
            month.
          </p>
          <p>6.3 Extraordinary termination for important reasons remains unaffected.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">7. Customer Obligations</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>7.1 The Customer may only use the platform in a legally compliant manner.</p>
          <p>
            7.2 Uploading content that infringes third-party rights or is illegal is prohibited.
          </p>
          <p>7.3 The Customer is advised to regularly back up their data.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">8. Availability &amp; Maintenance</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>
            8.1 The Provider strives for high platform availability but does not guarantee uninterrupted access.
          </p>
          <p>
            8.2 Maintenance may be performed at short notice. The Provider will attempt to announce scheduled
            maintenance in advance.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">9. Liability</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>9.1 The Provider is only liable for damages caused intentionally or by gross negligence.</p>
          <p>
            9.2 Indirect damages, lost profits, or data loss are only covered to the extent legally required.
          </p>
          <p>9.3 The Provider is not liable for damages caused by third parties or third-party software.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">10. Data Protection</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>10.1 The Provider processes personal data according to the Privacy Policy.</p>
          <p>
            10.2 The Customer consents to storage and processing of their data required for platform operation.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">11. Software &amp; Content Rights</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>11.1 All software, designs, and content remain the property of the Provider.</p>
          <p>
            11.2 The Customer receives a non-exclusive, non-transferable right to use the platform according to the
            selected plan.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">12. Changes to T&amp;C</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>
            12.1 The Provider may change these T&amp;C. Changes will be communicated 30 days in advance via email or
            platform notification.
          </p>
          <p>12.2 If the Customer does not object within 30 days, the changes are considered accepted.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">13. Final Provisions</h3>
          <div className="h-px w-full bg-slate-200" />
          <p>13.1 Governing law: Germany.</p>
          <p>13.2 Jurisdiction: Provider’s registered office.</p>
          <p>
            13.3 If any provision is invalid, the remaining provisions remain in effect.
          </p>
        </section>

        <section className="space-y-2 border-t border-dashed border-slate-200 pt-4">
          <h3 className="text-base font-semibold text-slate-900">Optional SaaS Add-ons for T&amp;C</h3>
          <ul className="list-disc space-y-1 pl-5 text-slate-700">
            <li>Service Level Agreement (SLA) with availability guarantees</li>
            <li>Customer data export obligations on contract termination</li>
            <li>International usage clauses</li>
          </ul>
        </section>
      </div>
    </div>
  );
}