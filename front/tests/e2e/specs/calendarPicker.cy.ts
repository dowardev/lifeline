// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * LBDS-298 - e2e test for the calendar picker in the event
 * create/update modal. Drives the real Vue + Ionic + Pinia stack
 * against the Vite dev server, with the backend endpoints stubbed
 * via cy.intercept so the test does not depend on a running
 * Laravel or a seeded DB.
 *
 * The project's e2e harness is Cypress (see cypress.config.ts and
 * `pnpm run test:e2e`). The ticket's "Playwright" wording was a
 * suggestion from the ticket author; the acceptance test is the
 * end-to-end coverage, not the specific runner.
 */

// LBDS-305 - the picker contract is `CalendarItem` from
// `calendarStore.ts`. Every row carries `source_id`, a nested
// `source` block (null for local rows), `archived_at` (null while
// alive), and `selectable` (false for archived mirrors). The local
// rows in these stubs use the same null/null/null/true defaults
// the backend `CalendarResource` emits for `calendars.user_id = ...`
// rows with `source_id = null`.

type CalendarRow = {
  id: number
  user_id: number
  name: string
  default: number
  source_id: number | null
  source: {
    id: number
    type: 'ics' | 'caldav' | 'google'
    name: string
    color: string
    username: string | null
  } | null
  archived_at: string | null
  selectable: boolean
}

const localRow = (params: {
  id: number
  user_id: number
  name: string
  default: number
}): CalendarRow => ({
  id: params.id,
  user_id: params.user_id,
  name: params.name,
  default: params.default,
  source_id: null,
  source: null,
  archived_at: null,
  selectable: true,
})

const mirrorRow = (params: {
  id: number
  user_id: number
  name: string
  source_id: number
  source_type: 'ics' | 'caldav' | 'google'
  source_username?: string | null
  color?: string
  default?: number
}): CalendarRow => ({
  id: params.id,
  user_id: params.user_id,
  name: params.name,
  default: params.default ?? 0,
  source_id: params.source_id,
  source: {
    id: params.source_id,
    type: params.source_type,
    name: params.name,
    color: params.color ?? '#3880ff',
    username: params.source_username ?? null,
  },
  archived_at: null,
  selectable: true,
})

const CALENDARS = [
  localRow({ id: 1, user_id: 7, name: 'Personal', default: 1 }),
  localRow({ id: 2, user_id: 7, name: 'Trabajo', default: 0 }),
  localRow({ id: 3, user_id: 7, name: 'Side', default: 0 }),
]

// LBDS-305 - one local + two mirrors (a Google one carrying the
// same name the user already has locally, and a CalDAV one), so
// the picker has to list the local calendar and the external
// sources in the same list.
const CALENDARS_WITH_SOURCE = [
  localRow({ id: 1, user_id: 7, name: 'Personal', default: 1 }),
  mirrorRow({
    id: 10, user_id: 7, name: 'Personal',
    source_id: 99, source_type: 'google',
    source_username: 'alice@gmail.com',
    color: '#4285f4',
  }),
  mirrorRow({
    id: 11, user_id: 7, name: 'Work',
    source_id: 100, source_type: 'caldav',
    source_username: null, color: '#ff8800',
  }),
]

const CALENDARS_EMPTY: { id: number; user_id: number; name: string; default: number; source_id: null; source: null; archived_at: null; selectable: boolean }[] = []

function stubBackends(): void {
  cy.intercept('GET', '**/api/v1/calendars*', (req) => {
    // The test parametrises whether the user has calendars via
    // an alias so each test can decide.
    const url = new URL(req.url)
    const empty = url.searchParams.get('__empty') === '1'
    const withSource = url.searchParams.get('__with_source') === '1'
    const data = empty
      ? CALENDARS_EMPTY
      : (withSource ? CALENDARS_WITH_SOURCE : CALENDARS)
    req.reply({
      status: 200,
      body: {
        data,
        links: { first: '...', last: '...', prev: null, next: null },
        meta: { current_page: 1, from: 1, last_page: 1, per_page: 50, to: data.length },
      },
    })
  }).as('getCalendars')

  // Stub the rest of the read endpoints so the page does not error
  // before we get to the modal. Empty data is fine; the picker does
  // not depend on it.
  cy.intercept('GET', '**/api/v1/events*', { body: { data: [], links: {}, meta: {} } })
  cy.intercept('GET', '**/api/v1/calendar-sources*', { body: { data: [], links: {}, meta: {} } })
  cy.intercept('GET', '**/api/v1/external-events*', { body: [] })
  cy.intercept('GET', '**/api/v1/external-contacts*', { body: [] })
  cy.intercept('GET', '**/api/v1/external-tasks*', { body: [] })
  cy.intercept('GET', '**/api/v1/wakatime-durations*', { body: {} })
  cy.intercept('GET', '**/api/v1/admin-tags*', { body: [] })
  cy.intercept('GET', '**/api/v1/notes*', { body: { data: [], links: {}, meta: {} } })
  cy.intercept('GET', '**/api/v1/tasks*', { body: { data: [], links: {}, meta: {} } })
  cy.intercept('GET', '**/api/v1/documents*', { body: { data: [], links: {}, meta: {} } })
}

/**
 * Opens the "Agregar evento" modal from the calendar page.
 *
 * The page opens the modal from an ICON-ONLY toolbar button
 * (`ion-button fill="clear"` wrapping the `addOutline` icon), so there
 * is no "Añadir evento" label to match on this page — that label only
 * exists on the CalendarWidget. The second button of that slot is the
 * options trigger, so it is excluded by id.
 */
function openAddEventModal(): void {
  cy.get('ion-buttons[slot="end"] ion-button:not(#main-options-trigger)')
    .first()
    .click({ force: true })
}

/**
 * Waits until the calendar list has landed in the picker.
 *
 * The select is rendered DISABLED (no calendars yet) and the list arrives
 * asynchronously from the (stubbed) API, so any interaction with the
 * picker has to wait for it: clicking a disabled select opens nothing,
 * which is what made this spec look like it had a broken harness.
 */
function waitForCalendarsLoaded(): void {
  cy.get('ion-select.calendar-select').should('have.prop', 'disabled', false)
}

/**
 * The options of the select popover, in order.
 *
 * `cy.contains()`-style text matching is done with a FILTER FUNCTION and
 * not with `:has-text()`: the app ships its own jQuery/Sizzle, which does
 * not know Cypress' `:has-text()` pseudo-selector (it throws "unsupported
 * pseudo: has-text"). The filter function runs on Cypress' own jQuery.
 */
function popoverOptions(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('ion-select-popover .select-interface-option')
}

function popoverOptionsWithText(params: { text: string }): Cypress.Chainable<JQuery<HTMLElement>> {
  return popoverOptions().filter((_index, element) =>
    Cypress.$(element).text().includes(params.text),
  )
}

/**
 * Picks an option of the select popover.
 *
 * The click has to land on the `ion-radio` INSIDE the option: the radio
 * is what toggles the selection (the radio group emits `ionChange`), and
 * the option row is only its container.
 */
function pickOption(params: { text: string }): void {
  popoverOptionsWithText({ text: params.text })
    .find('ion-radio')
    .first()
    .click({ force: true })
}

/**
 * The text the select DISPLAYS (the selected calendar, or the
 * placeholder when nothing is selected).
 *
 * `ion-select` renders in a shadow root, so the displayed text is NOT
 * part of the host element: it lives in the `.select-text` div inside
 * the shadow root. Reading the host's text would only return the text
 * of the SLOTTED options (all of them, selected or not).
 */
function selectText(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('ion-select.calendar-select').shadow().find('.select-text')
}

describe('Calendar picker (LBDS-298)', () => {
  beforeEach(() => {
    // Force a fresh storage so the SSO/anonymous state from
    // previous specs does not bleed into the picker's request.
    cy.clearLocalStorage()
    cy.clearCookies()
    stubBackends()
  })

  it('renders the Calendario select when the user has at least one calendar', () => {
    cy.visit('/calendar')
    openAddEventModal()
    waitForCalendarsLoaded()

    // The picker is an `ion-select` inside the "Otros" card, the same
    // control the availability select uses. It must be present AND
    // enabled so its popover can open.
    cy.get('ion-select.calendar-select').should('exist')
      .and('have.prop', 'disabled', false)
    // Pre-selects the default:1 row.
    selectText().should('contain', 'Personal')
  })

  it('opens the select popover with one option per calendar and closes after pick', () => {
    cy.visit('/calendar')
    openAddEventModal()
    waitForCalendarsLoaded()
    cy.get('ion-select.calendar-select').click({ force: true })

    // The select's popover renders one option per calendar.
    cy.get('ion-select-popover').should('exist')
    popoverOptions().should('have.length', CALENDARS.length)

    // Pick the second calendar. The popover closes and the select
    // reflects the new selection.
    pickOption({ text: 'Trabajo' })
    selectText().should('contain', 'Trabajo')
  })

  it('renders the Calendario row disabled with "Sin calendarios" when the user has zero', () => {
    // Override the calendars stub for this test only.
    cy.intercept('GET', '**/api/v1/calendars*', { body: { data: [], links: {}, meta: {} } }).as('getCalendarsEmpty')
    cy.visit('/calendar')
    openAddEventModal()
    // The modal asks for the calendars when it opens, so the request
    // happens after the visit.
    cy.wait('@getCalendarsEmpty')

    // The select is rendered (so the user can see the picker exists)
    // but disabled (the popover does not open on tap), and it says
    // there are no calendars.
    cy.get('ion-select.calendar-select').should('exist')
      .and('have.prop', 'disabled', true)
    selectText().should('contain', 'Sin calendarios')
    // LBDS-305: with the `ion-select` there is no popover to explain
    // the case, so the note lives next to the control.
    //
    // LBDS-292 changed what the note says: the event no longer goes
    // out with an EMPTY `calendar_id` (the server would have to guess),
    // it lands in the account's default calendar. The copy says so,
    // and it no longer mentions the ticket.
    cy.get('ion-note.calendar-select-note').should('exist')
      .and('contain', 'calendario por defecto')
  })

  it('LBDS-305: lists the mirrored external sources in the same picker', () => {
    // Override the stub for this test only: 1 local + 2 mirrors.
    cy.intercept('GET', '**/api/v1/calendars*', (req) => {
      req.reply({
        status: 200,
        body: {
          data: CALENDARS_WITH_SOURCE,
          links: { first: '...', last: '...', prev: null, next: null },
          meta: { current_page: 1, from: 1, last_page: 1, per_page: 50, to: CALENDARS_WITH_SOURCE.length },
        },
      })
    }).as('getCalendarsWithSource')
    cy.visit('/calendar')
    openAddEventModal()
    waitForCalendarsLoaded()
    cy.get('ion-select.calendar-select').click({ force: true })

    // The select's popover renders one option per row: the local
    // calendar AND the mirrored external sources, in the same list.
    cy.get('ion-select-popover').should('exist')
    popoverOptions().should('have.length', CALENDARS_WITH_SOURCE.length)

    // A mirrored option carries the kind of its source and the
    // account, so two Google accounts with the same calendar name
    // are told apart.
    popoverOptionsWithText({ text: 'alice@gmail.com' }).should('exist')
    popoverOptionsWithText({ text: 'Google' }).should('exist')

    // The local option keeps just the calendar name.
    popoverOptionsWithText({ text: 'Personal' }).first()
      .invoke('text')
      .should('not.match', /Google|CalDAV/)

    // Picking a mirrored source closes the popover and the select
    // reflects the new selection.
    pickOption({ text: 'Work' })
    selectText().should('contain', 'Work')
  })
})
