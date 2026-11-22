// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { actionSheetController } from "@ionic/vue";

export interface AddSourceSheetOptions {
  onGoogle: () => void;
  onIcs: () => void;
}

/**
 * The "Agregar" menu of the Google Calendar section.
 *
 * There are two ways in: a Google account (the OAuth flow) and a calendar
 * published as an ICS URL. Both live in the same sheet, so neither of them
 * is a hidden path.
 */
export function useAddSourceSheet(params: { options: AddSourceSheetOptions }): {
  open: () => Promise<void>;
} {
  const { options } = params;

  async function open(): Promise<void> {
    const sheet = await actionSheetController.create({
      header: "Agregar calendario",
      buttons: [
        { text: "Google Calendar", role: "google" },
        { text: "Calendario por URL (ICS)", role: "ics" },
        { text: "Cancelar", role: "cancel" },
      ],
    });
    // Creating the overlay does not show it: without the presentation the
    // click on "Agregar" looks like nothing happened.
    await sheet.present();
    const result = await sheet.onDidDismiss();
    if (result.role === "google") {
      options.onGoogle();
      return;
    }
    if (result.role === "ics") {
      options.onIcs();
    }
  }

  return { open };
}
