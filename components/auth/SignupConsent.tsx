"use client";

import Link from "next/link";
import { useState } from "react";
import { GoogleSignInButton } from "./GoogleSignInButton";

/**
 * Single consent gate covering both signup paths (RNF-C01). The checkbox is
 * rendered here, above the fold, but associated with the email/password
 * form via the `form="signup-form"` attribute so its value still submits as
 * part of that form's FormData even though it isn't a DOM descendant of it —
 * that lets one gate cover the Google button (disabled client-side until
 * checked) and the manual form (also re-checked server-side in signup()).
 */
export function SignupConsent({ redirectTo }: { redirectTo: string }) {
  const [consented, setConsented] = useState(false);

  return (
    <>
      <label className="opt-check" htmlFor="consent" style={{ marginBottom: 14 }}>
        <input
          type="checkbox"
          id="consent"
          name="consent"
          form="signup-form"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
        />
        <span className="opt-box" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="opt-text">
          <span>
            Li e concordo com os <Link href="/termos">Termos de Uso</Link> e a{" "}
            <Link href="/privacidade">Política de Privacidade</Link>, e confirmo que tenho 18 anos
            ou autorização de um responsável legal.
          </span>
        </span>
      </label>

      <GoogleSignInButton redirectTo={redirectTo} disabled={!consented} />
    </>
  );
}
